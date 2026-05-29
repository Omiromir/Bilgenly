using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Bilgenly.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bilgenly.Infrastructure.Repositories;

public class ClassInvitationRepository : IClassInvitationRepository
{
    private readonly AppDbContext _context;

    public ClassInvitationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ClassInvitation?> GetPendingAsync(Guid classId, string email)
        => await _context.ClassInvitations
            .FirstOrDefaultAsync(i =>
                i.ClassId == classId &&
                i.RecipientEmail.ToLower() == email.Trim().ToLower() &&
                i.Status == "pending");

    public async Task<IEnumerable<ClassInvitation>> GetByClassIdAsync(Guid classId)
        => await _context.ClassInvitations
            .Where(i => i.ClassId == classId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

    public async Task<ClassInvitation?> GetByIdAsync(Guid id)
        => await _context.ClassInvitations.FirstOrDefaultAsync(i => i.Id == id);

    public async Task AddAsync(ClassInvitation invitation)
        => await _context.ClassInvitations.AddAsync(invitation);

    public Task DeleteAsync(ClassInvitation invitation)
    {
        _context.ClassInvitations.Remove(invitation);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
        => await _context.SaveChangesAsync();
}
