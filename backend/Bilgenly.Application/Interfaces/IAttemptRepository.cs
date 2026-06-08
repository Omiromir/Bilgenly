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
    Task DeleteByQuizIdAsync(Guid quizId);

    Task DeleteIncompleteAsync(Guid userId, Guid quizId, Guid? assignmentId);
}