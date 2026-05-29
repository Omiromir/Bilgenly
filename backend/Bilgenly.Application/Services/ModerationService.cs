using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class ModerationService
{
    private readonly IReportRepository _reportRepository;
    private readonly IUserRepository _userRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly INotificationRepository _notificationRepository;

    public ModerationService(
        IReportRepository reportRepository,
        IUserRepository userRepository,
        IQuizRepository quizRepository,
        INotificationRepository notificationRepository)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
        _quizRepository = quizRepository;
        _notificationRepository = notificationRepository;
    }

    public async Task<ModeratorDashboardDto> GetDashboardAsync()
    {
        var pendingReports = (await _reportRepository.GetPendingAsync()).ToList();
        var suspendedUsers = await _userRepository.GetSuspendedUsersAsync();
        var hiddenQuizzes = await _quizRepository.GetHiddenQuizzesAsync();

        return new ModeratorDashboardDto
        {
            PendingReportsCount = pendingReports.Count,
            ActiveSuspensionsCount = suspendedUsers.Count(),
            HiddenQuizzesCount = hiddenQuizzes.Count(),
            RecentReports = pendingReports.Take(5).Select(ToReportDto).ToList(),
        };
    }

    public async Task<IEnumerable<ReportDto>> GetAllReportsAsync()
    {
        var reports = await _reportRepository.GetAllAsync();
        return reports.Select(ToReportDto);
    }

    public async Task<(ReportDto? Result, string? Error)> CreateReportAsync(
        CreateReportDto dto, Guid reporterId)
    {
        if (dto.ReportedQuizId is null && dto.ReportedUserId is null)
            return (null, "Report must target a quiz or a user.");
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return (null, "Reason is required.");

        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = reporterId,
            ReportedQuizId = dto.ReportedQuizId,
            ReportedUserId = dto.ReportedUserId,
            Reason = dto.Reason.Trim(),
            Category = dto.Category,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
        };

        await _reportRepository.AddAsync(report);
        await _reportRepository.SaveChangesAsync();

        var fetched = await _reportRepository.GetByIdAsync(report.Id);
        return (fetched is null ? ToReportDto(report) : ToReportDto(fetched), null);
    }

    public async Task<(ReportDto? Result, string? Error)> ReviewReportAsync(
        Guid reportId, ReviewReportDto dto, Guid moderatorId)
    {
        var report = await _reportRepository.GetByIdAsync(reportId);
        if (report is null) return (null, "Report not found.");

        var validStatuses = new[] { "reviewed", "dismissed" };
        if (!validStatuses.Contains(dto.Status))
            return (null, "Status must be 'reviewed' or 'dismissed'.");

        report.Status = dto.Status;
        report.ReviewNote = dto.ReviewNote;
        report.ReviewerId = moderatorId;
        report.ReviewedAt = DateTime.UtcNow;
        await _reportRepository.SaveChangesAsync();
        return (ToReportDto(report), null);
    }

    public async Task<(SuspendedUserDto? Result, string? Error)> SuspendUserAsync(
        Guid userId, SuspendUserDto dto, Guid moderatorId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return (null, "User not found.");
        if (user.Id == moderatorId) return (null, "Cannot suspend yourself.");

        user.IsSuspended = true;
        user.SuspensionReason = dto.Reason;
        user.SuspendedUntil = dto.SuspendedUntil?.ToUniversalTime();
        user.SuspendedAt = DateTime.UtcNow;
        user.SuspendedByUserId = moderatorId;
        await _userRepository.SaveChangesAsync();

        return (new SuspendedUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            SuspendedUntil = user.SuspendedUntil,
            SuspensionReason = user.SuspensionReason,
        }, null);
    }

    public async Task<string?> DeleteUserAsync(Guid userId, Guid moderatorId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return "User not found.";
        if (user.Id == moderatorId) return "You cannot delete your own account from the moderation panel.";
        if (user.Role == UserRole.Moderator) return "Moderator accounts cannot be deleted from the moderation panel.";

        await _userRepository.DeleteAsync(user);
        await _userRepository.SaveChangesAsync();
        return null;
    }

    public async Task<string?> UnsuspendUserAsync(Guid userId, Guid moderatorId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null) return "User not found.";

        user.IsSuspended = false;
        user.SuspensionReason = null;
        user.SuspendedUntil = null;
        await _userRepository.SaveChangesAsync();
        return null;
    }

    public async Task<IEnumerable<SuspendedUserDto>> GetSuspendedUsersAsync()
    {
        var users = await _userRepository.GetSuspendedUsersAsync();
        return users.Select(u => new SuspendedUserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            SuspendedUntil = u.SuspendedUntil,
            SuspensionReason = u.SuspensionReason,
        });
    }

    public async Task<(HiddenQuizDto? Result, string? Error)> HideQuizAsync(
        Guid quizId, HideQuizDto dto, Guid moderatorId)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz is null) return (null, "Quiz not found.");

        quiz.IsHidden = true;
        quiz.ModerationNote = dto.ModerationNote;
        quiz.HiddenAt = DateTime.UtcNow;
        quiz.HiddenByUserId = moderatorId;
        await _quizRepository.SaveChangesAsync();

        return (new HiddenQuizDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            AuthorName = quiz.User?.Username ?? "Unknown",
            ModerationNote = quiz.ModerationNote,
            CreatedAt = quiz.CreatedAt,
        }, null);
    }

    public async Task<string?> UnhideQuizAsync(Guid quizId, Guid moderatorId)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz is null) return "Quiz not found.";

        quiz.IsHidden = false;
        quiz.ModerationNote = null;
        await _quizRepository.SaveChangesAsync();
        return null;
    }

    public async Task<IEnumerable<HiddenQuizDto>> GetHiddenQuizzesAsync()
    {
        var quizzes = await _quizRepository.GetHiddenQuizzesAsync();
        return quizzes.Select(q => new HiddenQuizDto
        {
            Id = q.Id,
            Title = q.Title,
            AuthorName = q.User?.Username ?? "Unknown",
            ModerationNote = q.ModerationNote,
            CreatedAt = q.CreatedAt,
        });
    }

    public async Task<IEnumerable<ModerationQuizDto>> GetAllQuizzesAsync()
    {
        var quizzes = await _quizRepository.GetAllForModerationAsync();
        return quizzes.Select(q => new ModerationQuizDto
        {
            Id = q.Id,
            Title = q.Title,
            Description = q.Description,
            CreatorId = q.UserId,
            CreatorName = q.User?.Username ?? "Unknown",
            CreatorEmail = q.User?.Email ?? "",
            IsPublic = q.IsPublic,
            IsHidden = q.IsHidden,
            ModerationNote = q.ModerationNote,
            HiddenAt = q.HiddenAt,
            Status = q.Status,
            QuestionsCount = q.Questions.Count,
            CreatedAt = q.CreatedAt,
        });
    }

    public async Task<IEnumerable<ModerationUserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(u => new ModerationUserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role.ToString(),
            IsSuspended = u.IsSuspended,
            SuspendedAt = u.SuspendedAt,
            SuspendedUntil = u.SuspendedUntil,
            SuspensionReason = u.SuspensionReason,
            CreatedAt = u.CreatedAt,
        });
    }

    public async Task<string?> DeleteQuizAsync(Guid quizId, Guid moderatorId)
    {
        // Cheap existence probe — saves us from running a transaction for a
        // quiz that's already gone and lets us surface a clear 404-style error.
        // GetByIdShallowAsync also includes the owning User which we need for
        // the deletion notification, so we don't pay a second round-trip.
        var quiz = await _quizRepository.GetByIdShallowAsync(quizId);
        if (quiz is null) return "Quiz not found.";

        // Capture owner + title BEFORE the cascade — once the row is gone
        // we can't recover them from the now-detached entity.
        var ownerId = quiz.UserId;
        var ownerEmail = quiz.User?.Email ?? string.Empty;
        var quizTitle = quiz.Title;

        // Cascade through every table that holds a FK to this quiz
        // (AttemptAnswers, Attempts, Assignments, Answers, Questions) inside
        // a single transaction so a mid-cascade failure leaves the DB clean.
        var deleted = await _quizRepository.DeleteQuizCascadeAsync(quizId);
        if (!deleted) return "Quiz could not be deleted.";

        // Notify the owner. Failing to write the notification must not
        // resurrect the deleted quiz, so we swallow notification-side
        // errors and just log via the empty catch — the moderation action
        // already succeeded.
        try
        {
            var moderator = await _userRepository.GetByIdAsync(moderatorId);
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                Type = "quiz_removed_by_admin",
                RecipientUserId = ownerId,
                RecipientEmail = ownerEmail,
                Title = "Your quiz was removed",
                Message = $"\"{quizTitle}\" was removed by an administrator. Any attempts and class assignments tied to it have also been cleared.",
                ActionType = string.Empty,
                RelatedClassId = string.Empty,
                RelatedClassName = string.Empty,
                SenderName = moderator?.Username ?? "Administrator",
                SenderEmail = moderator?.Email ?? string.Empty,
                StudentId = string.Empty,
                StudentName = string.Empty,
                StudentEmail = string.Empty,
                Status = "sent",
                QuizId = quizId.ToString(),
                QuizTitle = quizTitle,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            await _notificationRepository.AddAsync(notification);
            await _notificationRepository.SaveChangesAsync();
        }
        catch
        {
            // Notification failure is best-effort — don't propagate, the
            // quiz is already deleted and the admin shouldn't see a 500.
        }

        return null;
    }

    public async Task<AdminAnalyticsDto> GetAnalyticsAsync()
    {
        var users = (await _userRepository.GetAllAsync()).ToList();
        var quizzes = (await _quizRepository.GetAllForModerationAsync()).ToList();

        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-29); // last 30 days inclusive

        // Pre-build a bucket per day so missing days still render as zero.
        var usersByDay = Enumerable.Range(0, 30)
            .ToDictionary(offset => startDate.AddDays(offset), _ => 0);
        var quizzesByDay = Enumerable.Range(0, 30)
            .ToDictionary(offset => startDate.AddDays(offset), _ => 0);

        foreach (var user in users)
        {
            var day = user.CreatedAt.Date;
            if (day >= startDate && day <= today)
                usersByDay[day] = usersByDay[day] + 1;
        }
        foreach (var quiz in quizzes)
        {
            var day = quiz.CreatedAt.Date;
            if (day >= startDate && day <= today)
                quizzesByDay[day] = quizzesByDay[day] + 1;
        }

        var roleBreakdown = users
            .GroupBy(u => u.Role.ToString())
            .Select(g => new AdminAnalyticsRoleBreakdownDto
            {
                Role = g.Key,
                Count = g.Count(),
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var weekStart = today.AddDays(-6);
        var newUsersWeek = users.Count(u => u.CreatedAt.Date >= weekStart);
        var newQuizzesWeek = quizzes.Count(q => q.CreatedAt.Date >= weekStart);

        return new AdminAnalyticsDto
        {
            TotalUsers = users.Count,
            TotalQuizzes = quizzes.Count,
            TotalStudents = users.Count(u => u.Role.ToString() == "Student"),
            TotalTeachers = users.Count(u => u.Role.ToString() == "Teacher"),
            TotalModerators = users.Count(u => u.Role.ToString() == "Moderator"),
            SuspendedUsers = users.Count(u => u.IsSuspended),
            NewUsersLast7Days = newUsersWeek,
            NewQuizzesLast7Days = newQuizzesWeek,
            RoleBreakdown = roleBreakdown,
            UsersOverTime = usersByDay
                .OrderBy(kv => kv.Key)
                .Select(kv => new AdminAnalyticsTimeSeriesPointDto
                {
                    Date = kv.Key.ToString("yyyy-MM-dd"),
                    Value = kv.Value,
                })
                .ToList(),
            QuizzesOverTime = quizzesByDay
                .OrderBy(kv => kv.Key)
                .Select(kv => new AdminAnalyticsTimeSeriesPointDto
                {
                    Date = kv.Key.ToString("yyyy-MM-dd"),
                    Value = kv.Value,
                })
                .ToList(),
        };
    }

    private static ReportDto ToReportDto(Report r) => new()
    {
        Id = r.Id,
        ReporterId = r.ReporterId,
        ReporterName = r.Reporter?.Username ?? "Unknown",
        ReportedQuizId = r.ReportedQuizId,
        ReportedQuizTitle = r.ReportedQuiz?.Title,
        ReportedUserId = r.ReportedUserId,
        ReportedUserName = r.ReportedUser?.Username,
        Reason = r.Reason,
        Category = r.Category,
        Status = r.Status,
        CreatedAt = r.CreatedAt,
        ReviewedAt = r.ReviewedAt,
        ReviewNote = r.ReviewNote,
    };
}
