using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;

namespace Bilgenly.Application.Services;

public class AiService : IAiService
{
    private readonly HttpClient _httpClient;

    public AiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<CreateQuestionDto>> GenerateFromTextAsync(
        string text,
        int questionCount,
        string topic,
        string topicFocus,
        string questionType,
        string additionalInstructions)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(text), "text");
        form.Add(new StringContent(questionCount.ToString()), "num_questions");

        var response = await _httpClient.PostAsync("/generate/text", form);
        response.EnsureSuccessStatusCode();

        var mlResponse = await response.Content.ReadFromJsonAsync<MlResponse>()
            ?? throw new InvalidOperationException("AI service returned an empty response.");

        return MapToQuestions(mlResponse);
    }

    public async Task<List<CreateQuestionDto>> GenerateFromPdfAsync(
        byte[] fileBytes,
        int questionCount,
        string topic,
        string topicFocus,
        string questionType,
        string additionalInstructions)
    {
        using var form = new MultipartFormDataContent();

        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType =
            new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        form.Add(fileContent, "file", "upload.pdf");
        form.Add(new StringContent(questionCount.ToString()), "num_questions");

        var response = await _httpClient.PostAsync("/generate/pdf", form);
        response.EnsureSuccessStatusCode();

        var mlResponse = await response.Content.ReadFromJsonAsync<MlResponse>()
            ?? throw new InvalidOperationException("AI service returned an empty response.");

        return MapToQuestions(mlResponse);
    }
    
    private static List<CreateQuestionDto> MapToQuestions(MlResponse ml)
    {
        var questions = new List<CreateQuestionDto>();
        int position = 1;

        foreach (var chunk in ml.Results
                     .OrderBy(kv => kv.Key, StringComparer.OrdinalIgnoreCase)
                     .Select(kv => kv.Value))
        {
            foreach (var item in chunk)
            {
                var answers = item.Options
                    .Select(kv => new CreateAnswerDto
                    {
                        Text      = kv.Value,
                        IsCorrect = string.Equals(kv.Key, item.Answer,
                                        StringComparison.OrdinalIgnoreCase)
                    })
                    .ToList();

                questions.Add(new CreateQuestionDto
                {
                    Text         = item.Question,
                    QuestionType = "MCQ",
                    Position     = position++,
                    Answers      = answers
                });
            }
        }

        return questions;
    }


    private sealed record MlResponse(
        [property: JsonPropertyName("total_questions")] int TotalQuestions,
        [property: JsonPropertyName("results")]         Dictionary<string, List<MlQuestion>> Results
    );

    private sealed record MlQuestion(
        [property: JsonPropertyName("question")] string Question,
        [property: JsonPropertyName("options")]  Dictionary<string, string> Options,
        [property: JsonPropertyName("answer")]   string Answer
    );
}
