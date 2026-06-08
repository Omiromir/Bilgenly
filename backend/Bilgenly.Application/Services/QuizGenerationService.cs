using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class QuizGenerationService
{
    private readonly IAiService _aiService;
    private readonly IQuizRepository _quizRepository;

    public QuizGenerationService(IAiService aiService, IQuizRepository quizRepository)
    {
        _aiService = aiService;
        _quizRepository = quizRepository;
    }

    public async Task<(GenerateQuizResultDto? Result, string? Error)> GenerateFromTextAsync(
        GenerateQuizConfigDto config, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(config.Text) || config.Text.Length < 180)
            return (null, "Text must be at least 180 characters");

        if (config.QuestionCount < 5 || config.QuestionCount > 15)
            return (null, "Question count must be between 5 and 15");

        var startTime = DateTime.UtcNow;

        try
        {
            var questions = await _aiService.GenerateFromTextAsync(
                config.Text,
                config.QuestionCount,
                config.Topic,
                config.TopicFocus,
                config.QuestionType,
                config.AdditionalInstructions);

            return await SaveGeneratedQuiz(
                questions, config, userId, "text",
                "Pasted lecture text", startTime);
        }
        catch (Exception e)
        {
            return (null, $"AI generation failed: {e.Message}");
        }
    }

    
    public async Task<(GenerateQuizResultDto? Result, string? Error)> GenerateFromPdfAsync(
        byte[] fileBytes, GenerateQuizConfigDto config, Guid userId)
    {
        if (config.QuestionCount < 5 || config.QuestionCount > 15)
            return (null, "Question count must be between 5 and 15");

        var startTime = DateTime.UtcNow;

        try
        {
            var questions = await _aiService.GenerateFromPdfAsync(
                fileBytes,
                config.QuestionCount,
                config.Topic,
                config.TopicFocus,
                config.QuestionType,
                config.AdditionalInstructions);

            return await SaveGeneratedQuiz(
                questions, config, userId, "pdf",
                "Uploaded PDF", startTime);
        }
        catch (Exception e)
        {
            return (null, $"AI generation failed: {e.Message}");
        }
    }

    
    public async Task<(GenerateQuizResultDto? Result, string? Error)> RegenerateAsync(
        Guid quizId, Guid userId)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz is null) return (null, "Quiz not found");
        if (quiz.UserId != userId) return (null, "Access denied");

        if (string.IsNullOrWhiteSpace(quiz.SourceText))
            return (null, "Regeneration is not available for this quiz — the original source text was not stored. Please generate a new quiz from your notes.");

        var startTime = DateTime.UtcNow;

        try
        {
            var questions = await _aiService.GenerateFromTextAsync(
                quiz.SourceText,
                quiz.Questions.Count > 0 ? quiz.Questions.Count : 5,
                quiz.Topic,
                quiz.TopicFocus,
                "MCQ",
                string.Empty);

            quiz.Questions.Clear();
            quiz.Status = "generated";
            await _quizRepository.SaveChangesAsync();

            foreach (var (q, index) in questions.Select((q, i) => (q, i)))
            {
                quiz.Questions.Add(new Question
                {
                    Id = Guid.NewGuid(),
                    QuizId = quiz.Id,
                    Text = q.Text,
                    QuestionType = q.QuestionType,
                    Explanation = q.Explanation,
                    Position = q.Position > 0 ? q.Position : index + 1,
                    Points = q.Points > 0 ? q.Points : 1,
                    EstimatedMinutes = q.EstimatedMinutes > 0 ? q.EstimatedMinutes : 1,
                    ImageUrl = q.ImageUrl,
                    Answers = q.Answers.Select(a => new Answer
                    {
                        Id = Guid.NewGuid(),
                        Text = a.Text,
                        IsCorrect = a.IsCorrect
                    }).ToList()
                });
            }

            await _quizRepository.SaveChangesAsync();

            var generationTime = (DateTime.UtcNow - startTime).TotalSeconds;
            return (MapToResult(quiz, quiz.SourceType == "pdf" ? "Uploaded PDF" : "Pasted lecture text", generationTime), null);
        }
        catch (Exception e)
        {
            return (null, $"AI regeneration failed: {e.Message}");
        }
    }

    public async Task<(GenerateQuizResultDto? Result, string? Error)> UpdateAfterReviewAsync(
        Guid quizId, UpdateGeneratedQuizDto dto, Guid userId)
    {
        var quiz = await _quizRepository.GetByIdShallowAsync(quizId);
        if (quiz is null) return (null, "Quiz not found");
        if (quiz.UserId != userId) return (null, "Access denied");
        if (string.IsNullOrWhiteSpace(dto.Title))
            return (null, "Title is required");
        if (!dto.Questions.Any())
            return (null, "At least one question is required");

        var validationError = QuizPayloadValidator.ValidateReview(dto);
        if (validationError is not null)
            return (null, validationError);

        foreach (var q in dto.Questions)
        {
            if (string.IsNullOrWhiteSpace(q.Text))
                return (null, "Every question must include text");
            if (q.Answers.Count(a => !string.IsNullOrWhiteSpace(a.Text)) < 2)
                return (null, "Every question must include at least two answer options");
            if (q.Answers.Count(a => a.IsCorrect) != 1)
                return (null, "Every question must include exactly one correct answer");
        }

        quiz.Title = dto.Title.Trim();
        quiz.Description = dto.Description.Trim();
        quiz.IsPublic = dto.IsPublic;
        quiz.Status = dto.IsPublic ? "published-public" : "published-private";

        await _quizRepository.DeleteQuizQuestionsAsync(quizId);

        var newQuestions = dto.Questions.Select((q, index) =>
        {
            var question = new Question
            {
                Id = Guid.NewGuid(),
                QuizId = quizId,
                Text = q.Text.Trim(),
                QuestionType = q.QuestionType,
                Explanation = q.Explanation.Trim(),
                Position = q.Position > 0 ? q.Position : index + 1,
                Tags = NormalizeTags(q.Tags),
            };

            question.Answers = q.Answers.Select(a => new Answer
            {
                Id = Guid.NewGuid(),
                QuestionId = question.Id,
                Text = a.Text.Trim(),
                IsCorrect = a.IsCorrect,
            }).ToList();

            return question;
        }).ToList();

        await _quizRepository.AddQuestionsRangeAsync(newQuestions);
        await _quizRepository.SaveChangesAsync();

        var reloadedQuiz = await _quizRepository.GetByIdAsync(quizId);
        return (MapToResult(reloadedQuiz!, "Saved", 0), null);
    }

    private async Task<(GenerateQuizResultDto? Result, string? Error)> SaveGeneratedQuiz(
        List<CreateQuestionDto> generatedQuestions,
        GenerateQuizConfigDto config,
        Guid userId,
        string sourceType,
        string sourceSummary,
        DateTime startTime)
    {
        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            Title = config.Title,
            Description = string.Empty,
            Topic = config.Topic,
            TopicFocus = config.TopicFocus,
            SourceType = sourceType,
            SourceText = sourceType == "text" ? config.Text : null,
            Status = "generated",
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsPublic = false,
            Questions = generatedQuestions.Select((q, index) => new Question
            {
                Id = Guid.NewGuid(),
                Text = q.Text,
                QuestionType = q.QuestionType,
                Explanation = q.Explanation,
                Position = q.Position > 0 ? q.Position : index + 1,
                Points = q.Points > 0 ? q.Points : 1,
                EstimatedMinutes = q.EstimatedMinutes > 0 ? q.EstimatedMinutes : 1,
                ImageUrl = q.ImageUrl,
                Tags = NormalizeTags(q.Tags),
                Answers = q.Answers.Select(a => new Answer
                {
                    Id = Guid.NewGuid(),
                    Text = a.Text,
                    IsCorrect = a.IsCorrect
                }).ToList()
            }).ToList()
        };

        await _quizRepository.AddAsync(quiz);
        await _quizRepository.SaveChangesAsync();

        var generationTime = (DateTime.UtcNow - startTime).TotalSeconds;
        return (MapToResult(quiz, sourceSummary, generationTime), null);
    }

    private GenerateQuizResultDto MapToResult(Quiz quiz, string sourceSummary, double generationTime)
        => new()
        {
            QuizId = quiz.Id,
            Status = quiz.Status,
            QuestionsGenerated = quiz.Questions.Count,
            SourceSummary = sourceSummary,
            GenerationTimeSeconds = Math.Round(generationTime, 1),
            Questions = quiz.Questions.Select(q => new QuizQuestionReviewDto
            {
                Id = q.Id,
                Text = q.Text,
                QuestionType = q.QuestionType,
                Explanation = q.Explanation,
                Position = q.Position,
                Tags = q.Tags ?? new(),
                Answers = q.Answers.Select(a => new AnswerReviewDto
                {
                    Id = a.Id,
                    Text = a.Text,
                    IsCorrect = a.IsCorrect
                }).ToList()
            }).OrderBy(q => q.Position).ToList()
        };

    private static List<string> NormalizeTags(IEnumerable<string>? tags) =>
        (tags ?? Enumerable.Empty<string>())
            .Select(tag => tag?.Trim() ?? string.Empty)
            .Where(tag => tag.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}
