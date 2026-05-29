using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Bilgenly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bilgenly.Infrastructure.Repositories;

public class AttemptRepository : IAttemptRepository
{
    private readonly AppDbContext _context;

    public AttemptRepository(AppDbContext context)
    {
        _context = context;
    }
    public async Task AddAnswersAsync(IEnumerable<AttemptAnswer> answers)
        => await _context.AttemptAnswers.AddRangeAsync(answers);
    public async Task<Attempt?> GetByIdAsync(Guid id)
        => await _context.Attempts
            .Include(a => a.Quiz)
            .ThenInclude(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .Include(a => a.AttemptAnswers)
            .FirstOrDefaultAsync(a => a.Id == id);

    public async Task<IEnumerable<Attempt>> GetByUserIdAsync(Guid userId)
        => await _context.Attempts
            .Where(a => a.UserId == userId)
            .Include(a => a.Quiz)
            .ThenInclude(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .Include(a => a.AttemptAnswers)
            .ToListAsync();
    public async Task<IEnumerable<Attempt>> GetByQuizIdAsync(Guid quizId) 
        => await _context.Attempts
            .Where(a => a.QuizId == quizId)
            .Include(a => a.User)
            .Include(a => a.AttemptAnswers)
            .OrderByDescending(a => a.DateTaken)
            .ToListAsync();
    
    public async Task AddAsync(Attempt attempt)
        => await _context.Attempts.AddAsync(attempt);

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public async Task DeleteByQuizIdAsync(Guid quizId)
    {
        // AttemptAnswers are cascade-deleted by the DB when the parent Attempt row
        // is removed (configured via EF Core's HasMany/WithOne in AppDbContext).
        await _context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"Attempts\" WHERE \"QuizId\" = {0}", quizId);
    }
}
