using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Bilgenly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace Bilgenly.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }
    public async Task <User?> GetByEmailAsync(string email)
        => await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    public async Task <bool> ExistsByEmailAsync(string email)
        => await _context.Users.AnyAsync(u => u.Email == email);
    public async Task AddAsync(User user)
        => await _context.Users.AddAsync(user);
    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
    public async Task<User?> GetByIdAsync(Guid id)
        => await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    public async Task<IEnumerable<User>> GetSuspendedUsersAsync()
        => await _context.Users.Where(u => u.IsSuspended).ToListAsync();

    public async Task<IEnumerable<User>> GetAllAsync()
        => await _context.Users
            .OrderBy(u => u.Role)
            .ThenBy(u => u.Username)
            .ToListAsync();
}