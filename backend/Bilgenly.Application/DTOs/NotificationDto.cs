namespace Bilgenly.Application.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string RecipientUserId { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool Read { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string RelatedClassId { get; set; } = string.Empty;
    public string RelatedClassName { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? QuizId { get; set; }
    public string? QuizTitle { get; set; }
    public string? AssignmentId { get; set; }
    public string? AttemptId { get; set; }
    public string? FollowUpKind { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateNotificationDto
{
    public string Type { get; set; } = string.Empty;
    public string RecipientUserId { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string RelatedClassId { get; set; } = string.Empty;
    public string RelatedClassName { get; set; } = string.Empty;
    public string? InviteCode { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string? QuizId { get; set; }
    public string? QuizTitle { get; set; }
    public string? AssignmentId { get; set; }
    public string? AttemptId { get; set; }
    public string? FollowUpKind { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? ExistingId { get; set; }
}

public class UpdateNotificationStatusDto
{
    public string Status { get; set; } = string.Empty;
}
