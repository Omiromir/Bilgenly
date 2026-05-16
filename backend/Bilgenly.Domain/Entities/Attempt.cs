namespace Bilgenly.Domain.Entities;

public class Attempt
{
    public Guid Id { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; }
    
    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; }
    
    public int Score { get; set; }
    public DateTime DateTaken { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int? DurationSeconds { get; set; }
    public bool IsCompleted { get; set; } = false;
    
    public ICollection<AttemptAnswer> AttemptAnswers { get; set; } = new List<AttemptAnswer>();
}