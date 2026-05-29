using Bilgenly.Domain.Entities;
namespace Bilgenly.Application.Interfaces;

public interface IQuizRepository
{
    Task<Quiz?> GetByIdAsync(Guid id);
    Task<Quiz?> GetByIdShallowAsync(Guid id);
    Task<IEnumerable<Quiz>> GetAllPublicAsync();
    Task<IEnumerable<Quiz>> GetByUserIdAsync(Guid userId);
    Task AddAsync(Quiz quiz);
    Task AddQuestionsRangeAsync(IEnumerable<Question> questions);
    Task SaveChangesAsync();
    void Remove(Quiz quiz);
    Task<IEnumerable<Quiz>> GetHiddenQuizzesAsync();
    Task<IEnumerable<Quiz>> GetAllForModerationAsync();
    Task DeleteQuizQuestionsAsync(Guid quizId);
    /// <summary>
    /// Hard-deletes a quiz and every row that references it (attempts,
    /// attempt-answers, assignments, questions, answers) in a single
    /// transaction. Reports that reference the quiz have SetNull cascade
    /// already, so they survive with a null target.
    /// </summary>
    Task<bool> DeleteQuizCascadeAsync(Guid quizId);
}