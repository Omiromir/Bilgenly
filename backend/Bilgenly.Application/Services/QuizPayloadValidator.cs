using Bilgenly.Application.DTOs;

namespace Bilgenly.Application.Services;

/// <summary>
/// Centralized payload limits for quiz operations. Frontend should respect the
/// same caps, but the backend re-validates as a final safety net so a malicious
/// client cannot store unbounded text and break the UI for everyone else.
/// </summary>
internal static class QuizPayloadValidator
{
    public const int MaxTitle = 120;
    public const int MaxDescription = 500;
    public const int MaxQuestionText = 500;
    public const int MaxExplanation = 700;
    public const int MaxAnswerText = 160;
    public const int MaxQuestionsPerQuiz = 30;
    public const int MaxAnswersPerQuestion = 6;
    public const int MinAnswersPerQuestion = 2;

    public static string? ValidateCreate(CreateQuizDto dto)
    {
        if (TitleTooLong(dto.Title)) return TitleError;
        if (DescriptionTooLong(dto.Description)) return DescriptionError;
        if (dto.Questions.Count > MaxQuestionsPerQuiz) return QuestionCountError;

        foreach (var q in dto.Questions)
        {
            var error = ValidateQuestion(q.Text, q.Explanation, q.Answers.Count,
                q.Answers.Select(a => a.Text));
            if (error is not null) return error;
        }

        return null;
    }

    public static string? ValidateUpdate(UpdateQuizDto dto)
    {
        if (TitleTooLong(dto.Title)) return TitleError;
        if (DescriptionTooLong(dto.Description)) return DescriptionError;
        if (dto.Questions.Count > MaxQuestionsPerQuiz) return QuestionCountError;

        foreach (var q in dto.Questions)
        {
            var error = ValidateQuestion(q.Text, q.Explanation, q.Answers.Count,
                q.Answers.Select(a => a.Text));
            if (error is not null) return error;
        }

        return null;
    }

    public static string? ValidateReview(UpdateGeneratedQuizDto dto)
    {
        if (TitleTooLong(dto.Title)) return TitleError;
        if (DescriptionTooLong(dto.Description)) return DescriptionError;
        if (dto.Questions.Count > MaxQuestionsPerQuiz) return QuestionCountError;

        foreach (var q in dto.Questions)
        {
            var error = ValidateQuestion(q.Text, q.Explanation, q.Answers.Count,
                q.Answers.Select(a => a.Text));
            if (error is not null) return error;
        }

        return null;
    }

    private static string? ValidateQuestion(string text, string explanation,
        int answerCount, IEnumerable<string> answerTexts)
    {
        if ((text ?? string.Empty).Length > MaxQuestionText)
            return $"Each question must be at most {MaxQuestionText} characters.";

        if ((explanation ?? string.Empty).Length > MaxExplanation)
            return $"Each explanation must be at most {MaxExplanation} characters.";

        if (answerCount < MinAnswersPerQuestion)
            return $"Each question must have at least {MinAnswersPerQuestion} answers.";

        if (answerCount > MaxAnswersPerQuestion)
            return $"Each question can have at most {MaxAnswersPerQuestion} answers.";

        foreach (var answer in answerTexts)
        {
            if ((answer ?? string.Empty).Length > MaxAnswerText)
                return $"Each answer must be at most {MaxAnswerText} characters.";
        }

        return null;
    }

    private static bool TitleTooLong(string title)
        => (title ?? string.Empty).Length > MaxTitle;

    private static bool DescriptionTooLong(string description)
        => (description ?? string.Empty).Length > MaxDescription;

    private static string TitleError => $"Title must be at most {MaxTitle} characters.";
    private static string DescriptionError => $"Description must be at most {MaxDescription} characters.";
    private static string QuestionCountError =>
        $"A quiz can have at most {MaxQuestionsPerQuiz} questions.";
}
