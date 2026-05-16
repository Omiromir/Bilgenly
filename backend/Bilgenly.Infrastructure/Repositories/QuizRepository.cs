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
}