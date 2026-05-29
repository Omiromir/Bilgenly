using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Bilgenly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bilgenly.Infrastructure.Repositories;

public class QuizRepository : IQuizRepository
{
    private readonly AppDbContext _context;

    public QuizRepository(AppDbContext context)
    {
        _context = context;
    }
    public void Remove(Quiz quiz)
        => _context.Quizzes.Remove(quiz);

    public async Task<Quiz?> GetByIdAsync(Guid id)
        => await _context.Quizzes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .Include(q => q.User)
            .FirstOrDefaultAsync(q => q.Id == id);

    public async Task<Quiz?> GetByIdShallowAsync(Guid id)
        => await _context.Quizzes
            .Include(q => q.User)
            .FirstOrDefaultAsync(q => q.Id == id);

    public async Task<IEnumerable<Quiz>> GetAllPublicAsync()
        => await _context.Quizzes
            .Where(q => q.IsPublic && !q.IsHidden)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .Include(q => q.User)
            .ToListAsync();
    
    public async Task<IEnumerable<Quiz>> GetByUserIdAsync(Guid userId)
        => await _context.Quizzes
            .Where(q => q.UserId == userId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .ToListAsync();
    
    public async Task AddAsync(Quiz quiz)
        => await _context.Quizzes.AddAsync(quiz);

    public async Task AddQuestionsRangeAsync(IEnumerable<Question> questions)
        => await _context.Set<Question>().AddRangeAsync(questions);
    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
    public async Task<IEnumerable<Quiz>> GetHiddenQuizzesAsync()
        => await _context.Quizzes
            .Where(q => q.IsHidden)
            .Include(q => q.User)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Quiz>> GetAllForModerationAsync()
        => await _context.Quizzes
            .Include(q => q.User)
            .Include(q => q.Questions)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

    public async Task DeleteQuizQuestionsAsync(Guid quizId)
    {
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Answer" WHERE "QuestionId" IN (SELECT "Id" FROM "Question" WHERE "QuizId" = {quizId})""");
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Question" WHERE "QuizId" = {quizId}""");

        foreach (var entry in _context.ChangeTracker.Entries<Answer>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Question>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
    }

    public async Task<bool> DeleteQuizCascadeAsync(Guid quizId)
    {
        // EF Core change tracker can hold stale references to rows we're about
        // to delete via raw SQL. Detach everything that touches this quiz so
        // SaveChangesAsync calls later in the request don't try to re-insert
        // or update phantom rows.
        await using var tx = await _context.Database.BeginTransactionAsync();

        // Order matters — child rows first, then parents. Each DELETE walks
        // the FK graph one level deeper toward the Quiz row itself.
        //
        // 1) AttemptAnswers can be reached three different ways. The Attempt
        //    path covers the broadest set (any answer on any attempt of this
        //    quiz), so we lead with it. The Question / Answer paths catch
        //    orphaned attempt-answers that somehow exist without a parent
        //    Attempt — defensive cleanup that costs nothing on a healthy DB.
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "AttemptAnswers" WHERE "AttemptId" IN (SELECT "Id" FROM "Attempts" WHERE "QuizId" = {quizId})""");
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "AttemptAnswers" WHERE "QuestionId" IN (SELECT "Id" FROM "Question" WHERE "QuizId" = {quizId})""");
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "AttemptAnswers" WHERE "AnswerId" IN (SELECT a."Id" FROM "Answer" a INNER JOIN "Question" q ON a."QuestionId" = q."Id" WHERE q."QuizId" = {quizId})""");

        // 2) Attempts on this quiz (now safe — no AttemptAnswers reference them).
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Attempts" WHERE "QuizId" = {quizId}""");

        // 3) Class assignments that pin this quiz to a class.
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Assignments" WHERE "QuizId" = {quizId}""");

        // 4) Answers, then Questions — same order as the existing helper.
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Answer" WHERE "QuestionId" IN (SELECT "Id" FROM "Question" WHERE "QuizId" = {quizId})""");
        await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Question" WHERE "QuizId" = {quizId}""");

        // 5) The Quiz itself. Reports.ReportedQuizId has OnDelete(SetNull) in
        //    the model, so Postgres will null those out automatically.
        var rowsAffected = await _context.Database.ExecuteSqlAsync(
            $"""DELETE FROM "Quizzes" WHERE "Id" = {quizId}""");

        await tx.CommitAsync();

        // Drop any tracked entities for this quiz so subsequent code paths
        // (e.g. SaveChangesAsync from another service in the same scope)
        // don't try to operate on the now-gone rows.
        foreach (var entry in _context.ChangeTracker.Entries<AttemptAnswer>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Attempt>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Assignment>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Answer>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Question>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
        foreach (var entry in _context.ChangeTracker.Entries<Quiz>().ToList())
            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        return rowsAffected > 0;
    }
}