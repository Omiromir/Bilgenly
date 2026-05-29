using Bilgenly.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bilgenly.Infrastructure.Data;

/// <summary>
/// Ensures the Badges table always reflects the canonical definitions.
/// Run on every startup — safe to re-run (upsert by Title).
/// Also revokes UserBadge rows that were awarded when RequiredValue was wrong.
/// </summary>
public static class BadgeSeeder
{
    // Single source of truth for every badge.
    // Changing RequiredValue here will correct the DB on next startup AND
    // revoke UserBadge rows for users who no longer meet the threshold.
    private static readonly BadgeDefinition[] Definitions =
    [
        new("First Step",     "Complete your first quiz",       "first_quiz",        1,  "🚀"),
        new("Quick Learner",  "Complete 5 quizzes",             "quizzes_completed", 5,  "⭐"),
        new("Dedicated",      "Complete 10 quizzes",            "quizzes_completed", 10, "💪"),
        new("Scholar",        "Complete 25 quizzes",            "quizzes_completed", 25, "🔥"),
        new("High Achiever",  "Reach 80% average score",        "average_score",     80, "🔥"),
        new("Perfectionist",  "Get 100% on any quiz",           "perfect_score",     100,"👑"),
        new("Team Player",    "Complete 3 class-assigned quizzes","assignment_completions", 3, "🤝"),
    ];

    public static async Task SeedAsync(AppDbContext db)
    {
        // Add Icon column if it doesn't exist yet (handles DB that predate this migration).
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Badges""
            ADD COLUMN IF NOT EXISTS ""Icon"" text NOT NULL DEFAULT '';
        ");

        var existingBadges = await db.Badges.ToListAsync();

        foreach (var def in Definitions)
        {
            var existing = existingBadges.FirstOrDefault(b =>
                string.Equals(b.Title, def.Title, StringComparison.OrdinalIgnoreCase));

            if (existing is null)
            {
                db.Badges.Add(new Badge
                {
                    Id            = Guid.NewGuid(),
                    Title         = def.Title,
                    Description   = def.Description,
                    Condition     = def.Condition,
                    RequiredValue = def.RequiredValue,
                    Icon          = def.Icon,
                });
            }
            else
            {
                // Always sync — catches RequiredValue drift that caused the Scholar bug.
                existing.Description   = def.Description;
                existing.Condition     = def.Condition;
                existing.RequiredValue = def.RequiredValue;
                existing.Icon          = def.Icon;
            }
        }

        await db.SaveChangesAsync();

        // Reload after upsert so IDs are accurate for revocation.
        existingBadges = await db.Badges.ToListAsync();
        await RevokeInvalidAwardsAsync(db, existingBadges);
    }

    /// <summary>
    /// Removes UserBadge rows where the user's current stats no longer meet
    /// the badge's (now-corrected) threshold.
    /// </summary>
    private static async Task RevokeInvalidAwardsAsync(AppDbContext db, List<Badge> badges)
    {
        var userBadges = await db.UserBadges.Include(ub => ub.Badge).ToListAsync();
        if (!userBadges.Any()) return;

        var affectedUserIds = userBadges.Select(ub => ub.UserId).Distinct().ToList();

        foreach (var userId in affectedUserIds)
        {
            var attempts = await db.Attempts
                .Where(a => a.UserId == userId && a.IsCompleted)
                .ToListAsync();

            var quizzesDone = attempts.Count;
            var averageScore = attempts.Any()
                ? Math.Round(attempts.Average(a => a.Score), 1)
                : 0;
            var assignmentCompletions = attempts.Count(a => a.AssignmentId != null);

            foreach (var userBadge in userBadges.Where(ub => ub.UserId == userId))
            {
                var badge = badges.FirstOrDefault(b => b.Id == userBadge.BadgeId);
                if (badge is null) continue;

                bool stillEarned = badge.Condition switch
                {
                    "quizzes_completed"      => quizzesDone >= badge.RequiredValue,
                    "average_score"          => averageScore >= badge.RequiredValue,
                    "perfect_score"          => attempts.Any(a => a.Score == 100),
                    "first_quiz"             => quizzesDone >= 1,
                    "assignment_completions" => assignmentCompletions >= badge.RequiredValue,
                    _                        => true, // unknown condition — keep
                };

                if (!stillEarned)
                    db.UserBadges.Remove(userBadge);
            }
        }

        await db.SaveChangesAsync();
    }

    private record BadgeDefinition(
        string Title,
        string Description,
        string Condition,
        int    RequiredValue,
        string Icon);
}
