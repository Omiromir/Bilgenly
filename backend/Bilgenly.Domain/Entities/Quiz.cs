namespace Bilgenly.Domain.Entities;

public class Quiz
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string TopicFocus { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner";
    public string Language { get; set; } = "English";
    public string SourceType { get; set; } = "manual";
    public string Status { get; set; } = "draft";
    public int DurationMinutes { get; set; } = 0;
    public bool IsHidden { get; set; }
    public string? ModerationNote { get; set; }
    public DateTime? HiddenAt { get; set; }
    public Guid? HiddenByUserId { get; set; }
    public User? HiddenBy { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public bool IsPublic { get; set; }
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
