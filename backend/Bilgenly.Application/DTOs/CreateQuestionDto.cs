namespace Bilgenly.Application.DTOs;

public class CreateQuestionDto
{
    public string Text  { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "MCQ";
    public string Explanation { get; set; } = string.Empty;
    public int Position { get; set; }
    public int Points { get; set; } = 1;
    public int EstimatedMinutes { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public List<CreateAnswerDto> Answers { get; set; } = new();
}
