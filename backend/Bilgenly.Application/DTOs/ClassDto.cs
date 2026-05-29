namespace Bilgenly.Application.DTOs;

public class ClassDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public bool IsArchived { get; set; }
    public int StudentCount { get; set; }
    public int QuizCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ClassStudentDto> Students { get; set; } = new();
    public List<ClassQuizDto> Quizzes { get; set; } = new();
    public List<PendingInvitationDto> PendingInvitations { get; set; } = new();
}

public class PendingInvitationDto
{
    public Guid Id { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
