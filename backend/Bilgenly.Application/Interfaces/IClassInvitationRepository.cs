using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Interfaces;

public interface IClassInvitationRepository
{
    Task<ClassInvitation?> GetPendingAsync(Guid classId, string email);
    Task<ClassInvitation?> GetByIdAsync(Guid id);
    Task<IEnumerable<ClassInvitation>> GetByClassIdAsync(Guid classId);
    Task AddAsync(ClassInvitation invitation);
    Task DeleteAsync(ClassInvitation invitation);
    Task SaveChangesAsync();
}
