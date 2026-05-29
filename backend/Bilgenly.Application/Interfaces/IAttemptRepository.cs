using Bilgenly.Domain.Entities;
namespace Bilgenly.Application.Interfaces;

public interface IAttemptRepository
{
    Task<Attempt?> GetByIdAsync(Guid id);
    Task<IEnumerable<Attempt>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Attempt>> GetByQuizIdAsync(Guid quizId);
    Task AddAsync(Attempt attempt);
    Task SaveChangesAsync();
    Task AddAnswersAsync(IEnumerable<AttemptAnswer> answers);
    /// <summary>
    /// Hard-deletes every Attempt (and its AttemptAnswers via cascade) for the
    /// given quiz. Called before quiz questions are replaced so that stale
    /// AttemptAnswer FKs never ghost the analytics.
    /// </summary>
    Task DeleteByQuizIdAsync(Guid quizId);
}