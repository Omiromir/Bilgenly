using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class AchievementsService
{
    private readonly IAttemptRepository _attemptRepository;
    private readonly IBadgeRepository _badgeRepository;
    private readonly IClassRepository _classRepository;
    private readonly IUserRepository _userRepository;

    public AchievementsService(
        IAttemptRepository attemptRepository,
        IBadgeRepository badgeRepository,
        IClassRepository classRepository,
        IUserRepository userRepository)
    {
        _attemptRepository = attemptRepository;
        _badgeRepository = badgeRepository;
        _classRepository = classRepository;
        _userRepository = userRepository;
    }

    public async Task<AchievementsDto> GetAchievementsAsync(Guid studentId)
    {
        var attempts = (await _attemptRepository.GetByUserIdAsync(studentId))
            .Where(a => a.IsCompleted)
            .ToList();

        var quizzesDone = attempts.Count;
        var averageScore = attempts.Any()
            ? Math.Round(attempts.Average(a => a.Score), 1)
            : 0;
        
        await CheckAndAwardBadgesAsync(studentId, quizzesDone, averageScore, attempts);

        var userBadges = (await _badgeRepository.GetByUserIdAsync(studentId)).ToList();
        var allBadges = (await _badgeRepository.GetAllAsync()).ToList();
        
        var leaderboard = await BuildLeaderboardAsync(studentId);
        
        var rank = leaderboard.FindIndex(e => e.IsCurrentUser) + 1;
        if (rank == 0) rank = leaderboard.Count + 1;

        var totalStudents = leaderboard.Count;
        var topPercent = totalStudents > 0
            ? Math.Max(1, (int)Math.Round((double)rank / totalStudents * 100))
            : 100;

        return new AchievementsDto
        {
            Rank = rank,
            RankLabel = $"top {topPercent}%",
            AverageScore = averageScore,
            QuizzesDone = quizzesDone,
            BadgesEarned = userBadges.Count,
            TotalBadges = allBadges.Count,
            Badges = userBadges.Select(ub => new UserBadgeDto
            {
                BadgeId = ub.BadgeId,
                Title = ub.Badge.Title,
                Description = ub.Badge.Description,
                Icon = ub.Badge.Icon,
                EarnedAt = ub.EarnedAt
            }).ToList(),
            Leaderboard = leaderboard
        };
    }

    private async Task<List<LeaderboardEntryDto>> BuildLeaderboardAsync(Guid studentId)
    {
        
        var classes = (await _classRepository.GetByStudentIdAsync(studentId)).ToList();

        var allStudentIds = classes
            .SelectMany(c => c.ClassStudents)
            .Select(cs => cs.StudentId)
            .Distinct()
            .ToList();

        if (!allStudentIds.Any())
            allStudentIds.Add(studentId);

        var entries = new List<LeaderboardEntryDto>();

        foreach (var id in allStudentIds)
        {
            var studentAttempts = (await _attemptRepository.GetByUserIdAsync(id))
                .Where(a => a.IsCompleted)
                .ToList();

            var avg = studentAttempts.Any()
                ? Math.Round(studentAttempts.Average(a => a.Score), 1)
                : 0;

            var user = await _userRepository.GetByIdAsync(id);

            entries.Add(new LeaderboardEntryDto
            {
                UserId = id,
                Username = user?.Username ?? "Unknown",
                AverageScore = avg,
                IsCurrentUser = id == studentId,
                AvatarUrl = user?.AvatarUrl
            });
        }

        entries = entries
            .OrderByDescending(e => e.AverageScore)
            .ToList();

        for (int i = 0; i < entries.Count; i++)
            entries[i].Rank = i + 1;

        return entries;
    }

    private async Task CheckAndAwardBadgesAsync(
        Guid studentId, int quizzesDone,
        double averageScore, List<Domain.Entities.Attempt> attempts)
    {
        var allBadges = (await _badgeRepository.GetAllAsync()).ToList();
        var assignmentCompletions = attempts.Count(a => a.AssignmentId.HasValue);

        foreach (var badge in allBadges)
        {
            if (await _badgeRepository.UserHasBadgeAsync(studentId, badge.Id))
                continue;

            bool earned = badge.Condition switch
            {
                "quizzes_completed"      => quizzesDone >= badge.RequiredValue,
                "average_score"          => averageScore >= badge.RequiredValue,
                "perfect_score"          => attempts.Any(a => a.Score == 100),
                "first_quiz"             => quizzesDone >= 1,
                "assignment_completions" => assignmentCompletions >= badge.RequiredValue,
                _                        => false
            };

            if (earned)
            {
                await _badgeRepository.AddUserBadgeAsync(new UserBadge
                {
                    UserId = studentId,
                    BadgeId = badge.Id,
                    EarnedAt = DateTime.UtcNow
                });
            }
        }

        await _badgeRepository.SaveChangesAsync();
    }
}