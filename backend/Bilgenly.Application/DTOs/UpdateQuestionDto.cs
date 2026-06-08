namespace Bilgenly.Application.DTOs;

public class UpdateQuestionDto
{
    public Guid? Id { get; set; }              
    public string Text { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "MCQ";
    public string Explanation { get; set; } = string.Empty;
    public int Position { get; set; }
    public List<UpdateAnswerDto> Answers { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}