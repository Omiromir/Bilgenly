using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class AttemptService
{
    private readonly IAttemptRepository _attemptRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly IClassRepository _classRepository;

    public AttemptService(
        IAttemptRepository attemptRepository,
        IQuizRepository quizRepository,
        IClassRepository classRepository)
    {
        _attemptRepository = attemptRepository;
        _quizRepository = quizRepository;
        _classRepository = classRepository;
    }
    public async Task<IEnumerable<MyAttemptDto>> GetMyAttemptsAsync(Guid userId)
    {
        var attempts = await _attemptRepository.GetByUserIdAsync(userId);
        return attempts
            .OrderByDescending(a => a.DateTaken)
            .Select(a =>
        {
            var questionResults = a.IsCompleted
                ? a.Quiz.Questions
                    .OrderBy(q => q.Position)
                    .Select(question =>
                    {
                        var selectedAttemptAnswer = a.AttemptAnswers.FirstOrDefault(
                            attemptAnswer => attemptAnswer.QuestionId == question.Id);
                        var selectedAnswer = selectedAttemptAnswer is null
                            ? null
                            : question.Answers.FirstOrDefault(answer => answer.Id == selectedAttemptAnswer.AnswerId);
                        var correctAnswer = question.Answers.FirstOrDefault(answer => answer.IsCorrect);

                        return new MyAttemptQuestionReviewDto
                        {
                            QuestionId = question.Id,
                            QuestionText = question.Text,
                            QuestionType = question.QuestionType,
                            Position = question.Position,
                            Explanation = question.Explanation,
                            SelectedAnswerId = selectedAnswer?.Id,
                            SelectedAnswerText = selectedAnswer?.Text,
                            CorrectAnswerId = correctAnswer?.Id,
                            CorrectAnswerText = correctAnswer?.Text,
                            IsCorrect = selectedAttemptAnswer?.IsCorrect ?? false,
                            AnswerOptions = question.Answers
                                .Select(answer => new MyAttemptAnswerOptionDto
                                {
                                    Id = answer.Id,
                                    Text = answer.Text,
                                    IsCorrect = answer.IsCorrect,
                                })
                                .ToList(),
                        };
                    })
                    .ToList()
                : new List<MyAttemptQuestionReviewDto>();

            return new MyAttemptDto
            {
                Id = a.Id,
                QuizId = a.QuizId,
                AssignmentId = a.AssignmentId,
                QuizTitle = a.Quiz.Title,
                Score = a.Score,
                DateTaken = a.DateTaken,
                FinishedAt = a.FinishedAt,
                DurationSeconds = a.DurationSeconds,
                IsCompleted = a.IsCompleted,
                TotalQuestions = a.Quiz.Questions.Count,
                CorrectAnswers = a.AttemptAnswers.Count(attemptAnswer => attemptAnswer.IsCorrect),
                Questions = questionResults,
            };
        });
    }
    public async Task<(StartAttemptDto? Result, string? Error)> StartAttemptAsync(Guid quizId, Guid userId)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz is null)
            return (null, "Quiz not found");
        if (quiz.IsHidden)
            return (null, "This quiz is not available.");

        // Resolve which assignment (if any) this student is starting an attempt for.
        // If the same quiz is assigned to multiple of the student's classes we pick the
        // most-recently created active assignment — the one the student is most likely
        // acting on. When there is no assignment the quiz is being taken freely (public
        // library) and no cap enforcement applies.
        var classes = await _classRepository.GetByStudentIdAsync(userId);
        var targetAssignment = classes
            .SelectMany(c => c.Assignments ?? Enumerable.Empty<Assignment>())
            .Where(a => a.QuizId == quizId && a.Status == "active")
            .OrderByDescending(a => a.AssignedAt)
            .FirstOrDefault();

        if (targetAssignment is not null && targetAssignment.MaxAttempts.HasValue)
        {
            var cap = targetAssignment.MaxAttempts.Value;
            var userAttempts = (await _attemptRepository.GetByUserIdAsync(userId)).ToList();

            // Only count attempts that belong to THIS assignment — not attempts from
            // any previous assignment that was removed and recreated for the same quiz.
            var completedForAssignment = userAttempts
                .Count(a => a.AssignmentId == targetAssignment.Id && a.IsCompleted);

            if (completedForAssignment >= cap)
                return (null, "You have used all attempts for this assignment.");
        }

        var attempt = new Attempt
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            QuizId = quizId,
            AssignmentId = targetAssignment?.Id,   // stamp so future counts are scoped
            Score = 0,
            DateTaken = DateTime.UtcNow,
            IsCompleted = false
        };

        await _attemptRepository.AddAsync(attempt);
        await _attemptRepository.SaveChangesAsync();

        return (new StartAttemptDto
        {
            AttemptId = attempt.Id,
            QuizId = quiz.Id,
            QuizTitle = quiz.Title,
            Questions = quiz.Questions.Select(q => new QuestionForStudentDto
            {
                Id = q.Id,
                Text = q.Text,
                QuestionType = q.QuestionType,
                Position = q.Position,
                Answers = q.Answers.Select(a => new AnswerForStudentDto
                {
                    Id = a.Id,
                    Text = a.Text
                   
                }).ToList()
            }).OrderBy(q => q.Position).ToList()
        }, null);
    }
    public async Task<IEnumerable<object>> GetAttemptsByQuizAsync(Guid quizId, Guid userId)
    {
        var attempts = (await _attemptRepository.GetByUserIdAsync(userId))
            .Where(a => a.QuizId == quizId)
            .OrderByDescending(a => a.DateTaken)
            .Select(a => new
            {
                attemptId = a.Id,
                quizId = a.QuizId,
                score = a.Score,
                isCompleted = a.IsCompleted,
                dateTaken = a.DateTaken
            });
        return attempts;
    }
    public async Task<(AttemptResultDto? Result, string? Error)> SubmitAttemptAsync(
        Guid attemptId, Guid userId, SubmitAttemptDto dto)
    {
        var attempt = await _attemptRepository.GetByIdAsync(attemptId);
        if (attempt is null)
            return (null, "Attempt not found");

        if (attempt.UserId != userId)
            return (null, "This is not your attempt");

        if (attempt.IsCompleted)
            return (null, "Attempt already completed");

        var quiz = attempt.Quiz;
        var questionResults = new List<QuestionResultDto>();
        var attemptAnswers = new List<AttemptAnswer>();
        int correctCount = 0;

        foreach (var question in quiz.Questions)
        {
            
            var studentAnswer = dto.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
            var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
            var selectedAnswer = question.Answers.FirstOrDefault(a => a.Id == studentAnswer?.AnswerId);

            bool isCorrect = selectedAnswer?.IsCorrect ?? false;
            if (isCorrect) correctCount++;

            if (studentAnswer != null)
            {
                attemptAnswers.Add(new AttemptAnswer
                {
                  Id = Guid.NewGuid(),
                  AttemptId = attempt.Id,
                  QuestionId = question.Id,
                  AnswerId = studentAnswer.AnswerId,
                  IsCorrect = isCorrect,
                });
            }
            questionResults.Add(new QuestionResultDto
            {
                QuestionId = question.Id,
                QuestionText = question.Text,
                SelectedAnswer = selectedAnswer?.Text ?? "No answer submitted",
                CorrectAnswer = correctAnswer?.Text ?? "",
                IsCorrect = isCorrect
            });
        }

        int totalQuestions = quiz.Questions.Count;
        // Score is points-based (mirrors frontend logic): earnedPoints / totalPoints * 100.
        // Each question contributes Math.Max(1, q.Points) so questions with Points=0 still count as 1.
        int totalPoints = quiz.Questions.Sum(q => Math.Max(1, q.Points));
        int earnedPoints = quiz.Questions.Sum(q =>
        {
            var sa = dto.Answers.FirstOrDefault(a => a.QuestionId == q.Id);
            var sel = q.Answers.FirstOrDefault(a => a.Id == sa?.AnswerId);
            return (sel?.IsCorrect ?? false) ? Math.Max(1, q.Points) : 0;
        });
        int score = totalPoints > 0
            ? (int)Math.Round((double)earnedPoints / totalPoints * 100)
            : 0;

        attempt.Score = score;
        attempt.IsCompleted = true;
        attempt.FinishedAt = DateTime.UtcNow;
        attempt.DurationSeconds = (int)Math.Max(0,
            (attempt.FinishedAt.Value - attempt.DateTaken).TotalSeconds);
        await _attemptRepository.AddAnswersAsync(attemptAnswers);
        await _attemptRepository.SaveChangesAsync();

        return (new AttemptResultDto
        {
            AttemptId = attempt.Id,
            QuizTitle = quiz.Title,
            Score = score,
            TotalQuestions = totalQuestions,
            CorrectAnswers = correctCount,
            Questions = questionResults
        }, null);
    }
}
