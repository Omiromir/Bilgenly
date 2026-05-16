namespace Bilgenly.Application.DTOs;

public class ReportDto
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public Guid? ReportedQuizId { get; set; }
    public string? ReportedQuizTitle { get; set; }
    public Guid? ReportedUserId { get; set; }
    public string? ReportedUserName { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Category { get; set; } = "other";
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }
}

public class CreateReportDto
{
    public Guid? ReportedQuizId { get; set; }
    public Guid? ReportedUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Category { get; set; } = "other";
}

public class ReviewReportDto
{
    public string Status { get; set; } = string.Empty;
    public string? ReviewNote { get; set; }
}

public class SuspendUserDto
{
    public string Reason { get; set; } = string.Empty;
    public DateTime? SuspendedUntil { get; set; }
}

public class HideQuizDto
{
    public string? ModerationNote { get; set; }
}

public class ModeratorDashboardDto
{
    public int PendingReportsCount { get; set; }
    public int ActiveSuspensionsCount { get; set; }
    public int HiddenQuizzesCount { get; set; }
    public IList<ReportDto> RecentReports { get; set; } = new List<ReportDto>();
}

public class SuspendedUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? SuspendedUntil { get; set; }
    public string? SuspensionReason { get; set; }
}

public class HiddenQuizDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string? ModerationNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ModerationQuizDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CreatorId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public string CreatorEmail { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public bool IsHidden { get; set; }
    public string? ModerationNote { get; set; }
    public DateTime? HiddenAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public int QuestionsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ModerationUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsSuspended { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public DateTime? SuspendedUntil { get; set; }
    public string? SuspensionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
