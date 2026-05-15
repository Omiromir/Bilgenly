namespace Bilgenly.Application.DTOs;

public class UpdateQuizDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public List<UpdateQuizQuestionDto> Questions { get; set; } = new();
}

public class UpdateQuizQuestionDto
{
    public Guid? Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "MCQ";
    public string Explanation { get; set; } = string.Empty;
    public int Position { get; set; }
    public int Points { get; set; } = 1;
    public int EstimatedMinutes { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public List<UpdateQuizAnswerDto> Answers { get; set; } = new();
}

public class UpdateQuizAnswerDto
{
    public Guid? Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}
