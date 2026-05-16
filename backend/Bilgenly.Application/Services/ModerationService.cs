using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class ModerationService
{
    private readonly IReportRepository _reportRepository;
    private readonly IUserRepository _userRepository;
    private readonly IQuizRepository _quizRepository;

    public ModerationService(
        IReportRepository reportRepository,
        IUserRepository userRepository,
        IQuizRepository quizRepository)
    {
        _reportRepository = reportRepository;
        _userRepository = userRepository;
        _quizRepository = quizRepository;
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
