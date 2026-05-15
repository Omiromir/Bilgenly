namespace Bilgenly.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "MCQ";
    public string Explanation { get; set; } = string.Empty;
    public int Position { get; set; }
    public int Points { get; set; } = 1;
    public int EstimatedMinutes { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();

}