using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;

namespace Bilgenly.Application.Services;

public class AnalyticsService
{
    private readonly IAttemptRepository _attemptRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly IClassRepository _classRepository; 

    public AnalyticsService(
        IAttemptRepository attemptRepository,
        IQuizRepository quizRepository,
        IClassRepository classRepository) 
    {
        _attemptRepository = attemptRepository;
        _quizRepository = quizRepository;
        _classRepository = classRepository; 
    }

    public async Task<(QuizAnalyticsDto? Result, string? Error)> GetQuizAnalyticsAsync(Guid quizId,
        Guid requestingUserId)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz == null)
            return (null , "Quiz not found");
        
        if (quiz.UserId != requestingUserId)
            return (null, "Access denied");
        
        var attempts = (await  _attemptRepository.GetByQuizIdAsync(quizId))
            .Where(a => a.IsCompleted)
            .ToList();
        
        if (!attempts.Any())
        {
            return (new QuizAnalyticsDto
            {
                QuizId = quiz.Id,
                QuizTitle = quiz.Title,
                TotalAttempts = 0,
                AverageScore = 0,
                HighestScore = 0,
                LowestScore = 0,
                Questions = new()
            }, null);
        }

        var questionStats = quiz.Questions.Select(q =>
        {
            int totalAnswered = attempts.Count(a =>
                a.AttemptAnswers.Any(aa => aa.QuestionId == q.Id));

            int correctCount = attempts.Count(a =>
                a.AttemptAnswers.Any(aa => aa.QuestionId == q.Id && aa.IsCorrect));

            double correctPct = totalAnswered > 0
                ? Math.Round((double)correctCount / totalAnswered * 100, 1)
                : 0;

            return new QuestionAnalyticsDto
            {
                QuestionId = q.Id,
                QuestionText = q.Text,
                TotalAnswered = totalAnswered,
                CorrectAnswers = correctCount,
                CorrectPercentage = correctPct
            };
        }).ToList();
        return (new QuizAnalyticsDto
        {
            QuizId = quiz.Id,
            QuizTitle = quiz.Title,
            TotalAttempts = attempts.Count,
            AverageScore = Math.Round(attempts.Average(a => a.Score), 1),
            HighestScore = attempts.Max(a => a.Score),
            LowestScore = attempts.Min(a => a.Score),
            Questions = questionStats
        }, null);
    }

    public async Task<StudentAnalyticsDto> GetStudentAnalyticsAsync(Guid userId, string username)
    {
        var attempts = (await _attemptRepository.GetByUserIdAsync(userId))
            .Where(a => a.IsCompleted)
            .ToList();
        var attemptSummaries = attempts.Select(a => new AttemptSummaryDto
        {
            AttemptId = a.Id,
            QuizId = a.QuizId,
            QuizTitle = a.Quiz?.Title ?? "Unknown",
            Score = a.Score,
            DateTaken = a.DateTaken,
            IsCompleted = a.IsCompleted,
        })
        .OrderByDescending(attempt => attempt.DateTaken)
        .ToList();
        return new StudentAnalyticsDto
        {
            UserId = userId,
            Username = username,
            TotalAttempts = attempts.Count,
            AverageScore = attempts.Any()
                ? Math.Round(attempts.Average(a => a.Score), 1)
                : 0,
            Attempts = attemptSummaries,
        };
    }

    public async Task<(StudentAnalyticsDto? Result, string? Error)> GetStudentAnalyticsForTeacherAsync(Guid studentId, Guid quizId, Guid teacherId )
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId);
        if (quiz == null)
            return (null, "Quiz not found");
        if (quiz.UserId != teacherId)
            return (null, "Access denied");
        var attempts = (await _attemptRepository.GetByUserIdAsync(studentId))
            .Where(a => a.QuizId == quizId && a.IsCompleted)
            .ToList();
        var summaries = attempts.Select(a => new AttemptSummaryDto
        {
            AttemptId = a.Id,
            QuizId = a.QuizId,
            QuizTitle = a.Quiz?.Title ?? "Unknown",
            Score = a.Score,
            DateTaken = a.DateTaken,
            IsCompleted = a.IsCompleted
        })
        .OrderByDescending(attempt => attempt.DateTaken)
        .ToList();
        return (new StudentAnalyticsDto
        {
            UserId = studentId,
            Username = attempts.FirstOrDefault()?.User?.Username ?? "Unknown",
            TotalAttempts = attempts.Count,
            AverageScore = attempts.Any()
                ? Math.Round(attempts.Average(a => a.Score), 1)
                : 0,
            Attempts = summaries
        }, null);
    }
    public async Task<(StudentSummaryDto? Result, string? Error)> GetStudentSummaryForTeacherAsync(
        Guid studentId, Guid teacherId)
    {
        var teacherClasses = (await _classRepository.GetByTeacherIdAsync(teacherId)).ToList();

        var studentClasses = teacherClasses
            .Where(c => c.ClassStudents.Any(cs => cs.StudentId == studentId))
            .ToList();

        if (!studentClasses.Any())
            return (null, "Access denied or student not in any of your classes");

        var teacherQuizIds = teacherClasses
            .SelectMany(c => c.Assignments)
            .Select(a => a.QuizId)
            .ToHashSet();

        var allAttempts = (await _attemptRepository.GetByUserIdAsync(studentId))
            .Where(a => a.IsCompleted && teacherQuizIds.Contains(a.QuizId))
            .ToList();

        var studentName = studentClasses
            .SelectMany(c => c.ClassStudents)
            .FirstOrDefault(cs => cs.StudentId == studentId)
            ?.Student?.Username ?? "Unknown";

        var studentEmail = studentClasses
            .SelectMany(c => c.ClassStudents)
            .FirstOrDefault(cs => cs.StudentId == studentId)
            ?.Student?.Email ?? "";

        var completedQuizIds = allAttempts.Select(a => a.QuizId).Distinct().Count();
        var avgGrade = allAttempts.Any()
            ? Math.Round(allAttempts.Average(a => a.Score), 1)
            : 0;

        var status = !allAttempts.Any()
            ? "no_results"
            : avgGrade < 60
                ? "needs_review"
                : "active";

        return (new StudentSummaryDto
        {
            StudentId = studentId,
            StudentName = studentName,
            StudentEmail = studentEmail,
            AverageGradePercent = avgGrade,
            CompletedQuizzesCount = completedQuizIds,
            AttemptsCount = allAttempts.Count,
            LatestAttemptAt = allAttempts.Any()
                ? allAttempts.Max(a => a.DateTaken)
                : null,
            ClassesCount = studentClasses.Count,
            Status = status
        }, null);
    }

    public async Task<(ClassAnalyticsDto? Result, string? Error)> GetClassAnalyticsAsync(
        Guid assignmentId, Guid teacherId)
    {
        var assignment = await _classRepository.GetAssignmentByIdAsync(assignmentId);
        if (assignment is null) return (null, "Assignment not found");
        if (assignment.Class.TeacherId != teacherId) return (null, "Access denied");

        var quiz = assignment.Quiz;
        var students = assignment.Class.ClassStudents
            .Where(cs => cs.Student != null)
            .ToList();
        var studentIds = students.Select(cs => cs.StudentId).ToHashSet();
        // Scope to this assignment only — excludes attempts from a previous
        // assignment that was removed and recreated for the same quiz.
        // Attempts created before the AssignmentId field existed (null) are
        // excluded so stale data from old assignments doesn't bleed through.
        var allAttempts = (await _attemptRepository.GetByQuizIdAsync(quiz.Id))
            .Where(a => studentIds.Contains(a.UserId) && a.AssignmentId == assignment.Id)
            .OrderByDescending(a => a.DateTaken)
            .ToList();
        var deadlinePassed = assignment.Deadline.HasValue
            && DateTime.UtcNow > assignment.Deadline.Value
            && !assignment.AllowLateSubmissions;

        var studentResults = students.Select(cs =>
        {
            var student = cs.Student!;
            var studentAttempts = allAttempts
                .Where(a => a.UserId == cs.StudentId)
                .OrderByDescending(a => a.DateTaken)
                .ToList();
            var completedAttempts = studentAttempts
                .Where(a => a.IsCompleted)
                .ToList();
            var latestCompletedAttempt = completedAttempts.FirstOrDefault();
            var attemptsUsed = completedAttempts.Count;
            var hasInProgressAttempt = studentAttempts.Any(a => !a.IsCompleted);
            var exhausted = assignment.MaxAttempts.HasValue
                && attemptsUsed >= assignment.MaxAttempts.Value;

            var attemptHistory = completedAttempts.Select(attempt =>
            {
                var totalQuestions = quiz.Questions.Count;
                var correctAnswers = attempt.AttemptAnswers.Count(answer => answer.IsCorrect);
                var responsesCount = attempt.AttemptAnswers.Count;

                return new StudentAttemptAnalyticsDto
                {
                    AttemptId = attempt.Id,
                    Score = attempt.Score,
                    SubmittedAt = attempt.DateTaken,
                    TotalQuestions = totalQuestions,
                    CorrectAnswers = correctAnswers,
                    IncorrectAnswers = Math.Max(totalQuestions - correctAnswers, 0),
                    ResponsesCount = responsesCount,
                };
            }).ToList();

            var latestAttemptQuestions = latestCompletedAttempt is null
                ? new List<MyAttemptQuestionReviewDto>()
                : quiz.Questions
                    .OrderBy(question => question.Position)
                    .Select(question =>
                    {
                        var selectedAttemptAnswer = latestCompletedAttempt.AttemptAnswers
                            .FirstOrDefault(answer => answer.QuestionId == question.Id);
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
                    .ToList();

            var latestCorrectAnswers = latestCompletedAttempt?.AttemptAnswers.Count(answer => answer.IsCorrect);
            var totalQuestionsForLatest = latestCompletedAttempt is null ? (int?)null : quiz.Questions.Count;
            var latestResponsesCount = latestCompletedAttempt?.AttemptAnswers.Count;
            var latestScore = latestCompletedAttempt?.Score;
            var bestScore = completedAttempts.Any()
                ? completedAttempts.Max(a => a.Score)
                : (int?)null;
            var averageScore = completedAttempts.Any()
                ? Math.Round(completedAttempts.Average(a => a.Score), 1)
                : (double?)null;
            var status = exhausted
                ? "attempts_exhausted"
                : hasInProgressAttempt
                    ? "in_progress"
                    : attemptsUsed > 0
                        ? "completed"
                        : deadlinePassed
                            ? "expired"
                            : "active";

            return new StudentAssignmentResultDto
            {
                StudentId = cs.StudentId,
                StudentName = student.Username,
                Email = student.Email,
                Status = status,
                AttemptsUsed = attemptsUsed,
                AttemptsRemaining = assignment.MaxAttempts.HasValue
                    ? Math.Max(assignment.MaxAttempts.Value - attemptsUsed, 0)
                    : null,
                LatestScore = latestScore,
                BestScore = bestScore,
                AverageScore = averageScore,
                LatestAttemptId = latestCompletedAttempt?.Id,
                LastAttemptAt = latestCompletedAttempt?.DateTaken,
                TotalQuestions = totalQuestionsForLatest,
                CorrectAnswers = latestCorrectAnswers,
                IncorrectAnswers = totalQuestionsForLatest.HasValue && latestCorrectAnswers.HasValue
                    ? Math.Max(totalQuestionsForLatest.Value - latestCorrectAnswers.Value, 0)
                    : null,
                ResponsesCount = latestResponsesCount,
                HasDetailedResponses = latestAttemptQuestions.Count > 0,
                Attempts = attemptHistory,
                LatestAttemptQuestions = latestAttemptQuestions,
                MissedDeadline = deadlinePassed && attemptsUsed == 0 && !hasInProgressAttempt,
            };
        }).ToList();

        var completedStudentResults = studentResults
            .Where(result => result.AttemptsUsed > 0)
            .ToList();
        var completed = completedStudentResults.Count;
        var inProgress = studentResults.Count(result => result.Status == "in_progress");
        var missed = studentResults.Count(result => result.MissedDeadline);
        var needsAttention = studentResults.Count(result =>
            (result.BestScore.HasValue && result.BestScore < 70) ||
            result.Status == "attempts_exhausted" ||
            result.Status == "expired");
        var attemptsWithAnswers = allAttempts
            .Where(a => a.IsCompleted && a.AttemptAnswers.Any())
            .ToList();

        var questionStats = quiz.Questions.Select(q =>
        {
            int totalAnswered = attemptsWithAnswers.Count(a =>
                a.AttemptAnswers.Any(aa => aa.QuestionId == q.Id));
            int correctCount = attemptsWithAnswers.Count(a =>
                a.AttemptAnswers.Any(aa => aa.QuestionId == q.Id && aa.IsCorrect));

            return new QuestionAnalyticsDto
            {
                QuestionId = q.Id,
                QuestionText = q.Text,
                TotalAnswered = totalAnswered,
                CorrectAnswers = correctCount,
                CorrectPercentage = totalAnswered > 0
                    ? Math.Round((double)correctCount / totalAnswered * 100, 1)
                    : 0
            };
        }).ToList();

        return (new ClassAnalyticsDto
        {
            ClassId = assignment.ClassId,
            ClassName = assignment.Class.Name,
            AssignmentId = assignment.Id,
            QuizTitle = quiz.Title,
            QuestionCount = quiz.Questions.Count,
            TotalStudents = students.Count,
            CompletedCount = completed,
            InProgressCount = inProgress,
            MissedDeadlineCount = missed,
            NeedsAttentionCount = needsAttention,
            CompletionRate = students.Count > 0
                ? Math.Round((double)completed / students.Count * 100, 1)
                : 0,
            AverageScore = completedStudentResults.Any(result => result.LatestScore.HasValue)
                ? Math.Round(completedStudentResults
                    .Where(result => result.LatestScore.HasValue)
                    .Average(result => result.LatestScore!.Value), 1)
                : null,
            AvgAttemptsUsed = students.Count > 0
                ? Math.Round(studentResults.Average(result => result.AttemptsUsed), 1)
                : 0,
            Deadline = assignment.Deadline,
            MaxAttempts = assignment.MaxAttempts,
            StudentResults = studentResults,
            QuestionStats = questionStats
        }, null);
    }
    
}
