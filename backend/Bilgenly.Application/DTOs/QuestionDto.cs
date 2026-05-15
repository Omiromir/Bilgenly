namespace Bilgenly.Application.DTOs;

public class QuestionDto
{
    public Guid Id { get; set; }
    public string Text  { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public int Position { get; set; }
    public int Points { get; set; } = 1;
    public int EstimatedMinutes { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public List<AnswerDto> Answers { get; set; } = new ();
}
