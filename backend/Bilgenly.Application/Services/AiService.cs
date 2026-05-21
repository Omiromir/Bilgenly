using System.Net.Http.Json;
using System.Text.Json;
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
        return await GenerateEnoughQuestionsAsync(
            questionCount,
            remaining => new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["text"] = text,
                ["num_questions"] = remaining.ToString(),
            }),
            "/generate/text");
    }

    public async Task<List<CreateQuestionDto>> GenerateFromPdfAsync(
        byte[] fileBytes,
        int questionCount,
        string topic,
        string topicFocus,
        string questionType,
        string additionalInstructions)
    {
        return await GenerateEnoughQuestionsAsync(
            questionCount,
            remaining =>
            {
                var form = new MultipartFormDataContent();
                var fileContent = new ByteArrayContent(fileBytes);

                fileContent.Headers.ContentType =
                    new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
                form.Add(fileContent, "file", "upload.pdf");
                form.Add(new StringContent(remaining.ToString()), "num_questions");

                return form;
            },
            "/generate/pdf");
    }

    private async Task<List<CreateQuestionDto>> GenerateEnoughQuestionsAsync(
        int requestedQuestionCount,
        Func<int, HttpContent> createContent,
        string endpoint)
    {
        var questions = new List<CreateQuestionDto>();
        var seenQuestionTexts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var maxAttempts = Math.Max(requestedQuestionCount, 1);

        for (var attempt = 0; attempt < maxAttempts && questions.Count < requestedQuestionCount; attempt++)
        {
            var remaining = requestedQuestionCount - questions.Count;
            List<CreateQuestionDto> batch;

            try
            {
                using var content = createContent(remaining);
                batch = await SendGenerationRequestAsync(endpoint, content);
            }
            catch when (questions.Count > 0)
            {
                break;
            }

            foreach (var question in batch)
            {
                var normalizedQuestion = NormalizeQuestionText(question.Text);
                if (!seenQuestionTexts.Add(normalizedQuestion))
                {
                    continue;
                }

                questions.Add(question);
                if (questions.Count == requestedQuestionCount)
                {
                    break;
                }
            }
        }

        if (questions.Count == 0)
        {
            throw new InvalidOperationException("AI service returned no generated questions.");
        }

        for (var index = 0; index < questions.Count; index++)
        {
            questions[index].Position = index + 1;
        }

        return questions;
    }

    private async Task<List<CreateQuestionDto>> SendGenerationRequestAsync(
        string endpoint,
        HttpContent content)
    {
        using var response = await _httpClient.PostAsync(endpoint, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            var message = string.IsNullOrWhiteSpace(responseBody)
                ? response.ReasonPhrase
                : responseBody;
            throw new InvalidOperationException(
                $"AI service failed with {(int)response.StatusCode} {response.StatusCode}: {message}");
        }

        if (string.IsNullOrWhiteSpace(responseBody))
        {
            throw new InvalidOperationException("AI service returned an empty response.");
        }

        var mlResponse = JsonSerializer.Deserialize<MlResponse>(responseBody)
            ?? throw new InvalidOperationException("AI service returned an unreadable response.");
        var questions = MapToQuestions(mlResponse);

        return questions;
    }

    private static string NormalizeQuestionText(string value)
        => string.Join(" ", value.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    
    private static List<CreateQuestionDto> MapToQuestions(MlResponse ml)
    {
        var questions = new List<CreateQuestionDto>();
        int position = 1;

        foreach (var chunk in (ml.Results ?? new Dictionary<string, List<MlQuestion>>())
                     .OrderBy(kv => kv.Key, StringComparer.OrdinalIgnoreCase)
                     .Select(kv => kv.Value ?? new List<MlQuestion>()))
        {
            foreach (var item in chunk)
            {
                if (string.IsNullOrWhiteSpace(item.Question) || item.Options is null || item.Options.Count == 0)
                {
                    continue;
                }

                var answers = item.Options
                    .Select(kv => new CreateAnswerDto
                    {
                        Text      = kv.Value,
                        IsCorrect = string.Equals(kv.Key, item.Answer, StringComparison.OrdinalIgnoreCase)
                            || string.Equals(kv.Value, item.Answer, StringComparison.OrdinalIgnoreCase)
                    })
                    .ToList();
                if (answers.Count(a => a.IsCorrect) != 1)
                {
                    continue;
                }

                questions.Add(new CreateQuestionDto
                {
                    Text         = item.Question,
                    QuestionType = "MCQ",
                    Explanation  = item.Explanation ?? string.Empty,
                    Position     = position++,
                    Answers      = answers
                });
            }
        }

        return questions;
    }


    private sealed record MlResponse(
        [property: JsonPropertyName("total_questions")] int TotalQuestions,
        [property: JsonPropertyName("results")]         Dictionary<string, List<MlQuestion>>? Results
    );

    private sealed record MlQuestion(
        [property: JsonPropertyName("question")]    string Question,
        [property: JsonPropertyName("options")]     Dictionary<string, string>? Options,
        [property: JsonPropertyName("answer")]      string Answer,
        [property: JsonPropertyName("explanation")] string? Explanation
    );
}
