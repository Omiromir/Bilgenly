namespace Bilgenly.Application.DTOs;

public class MyAttemptDto
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public int Score { get; set; }
    public DateTime DateTaken { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int? DurationSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public List<MyAttemptQuestionReviewDto> Questions { get; set; } = new();
}

public class MyAttemptQuestionReviewDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public Guid? SelectedAnswerId { get; set; }
    public string? SelectedAnswerText { get; set; }
    public Guid? CorrectAnswerId { get; set; }
    public string? CorrectAnswerText { get; set; }
    public bool IsCorrect { get; set; }
    public List<MyAttemptAnswerOptionDto> AnswerOptions { get; set; } = new();
}

public class MyAttemptAnswerOptionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
