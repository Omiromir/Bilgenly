using Bilgenly.Domain.Entities;
namespace Bilgenly.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task AddAsync(User user);
    Task SaveChangesAsync();
    Task<User?> GetByIdAsync(Guid id);
    Task<IEnumerable<User>> GetSuspendedUsersAsync();
    Task<IEnumerable<User>> GetAllAsync();
}