using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace Bilgenly.Application.Services;

public class ClassInvitationService
{
    private readonly IClassInvitationRepository _invitationRepository;
    private readonly IClassRepository _classRepository;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ClassInvitationService(
        IClassInvitationRepository invitationRepository,
        IClassRepository classRepository,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _invitationRepository = invitationRepository;
        _classRepository = classRepository;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<(IList<ClassInvitationDto> Sent, IList<string> Failed, string? Error)> SendInvitationsAsync(
        Guid classId, IList<string> emails, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null) return ([], [], "Class not found.");
        if (classEntity.TeacherId != teacherId) return ([], [], "Access denied.");
        if (classEntity.IsArchived) return ([], [], "Cannot invite to an archived class.");

        var teacherName = classEntity.Teacher?.Username ?? "Your teacher";
        var frontendBaseUrl = _configuration["FrontendBaseUrl"] ?? "https://bilgenly.vercel.app";

        var sent = new List<ClassInvitationDto>();
        var failed = new List<string>();

        foreach (var rawEmail in emails)
        {
            var email = rawEmail.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(email)) continue;

            var existing = await _invitationRepository.GetPendingAsync(classId, email);
            if (existing is not null)
            {
                sent.Add(ToDto(existing, classEntity.Name));
                continue;
            }

            var invitation = new ClassInvitation
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                TeacherId = teacherId,
                RecipientEmail = email,
                InviteCode = classEntity.InviteCode,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
            };

            await _invitationRepository.AddAsync(invitation);

            try
            {
                await _emailService.SendClassInvitationAsync(
                    email, teacherName, classEntity.Name, classEntity.InviteCode, frontendBaseUrl);
                sent.Add(ToDto(invitation, classEntity.Name));
            }
            catch
            {
                sent.Add(ToDto(invitation, classEntity.Name));
                failed.Add(email);
            }
        }

        await _invitationRepository.SaveChangesAsync();
        return (sent, failed, null);
    }

    public async Task<IEnumerable<ClassInvitationDto>> GetInvitationsForClassAsync(
        Guid classId, Guid teacherId)
    {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity is null || classEntity.TeacherId != teacherId) return [];

        var invitations = await _invitationRepository.GetByClassIdAsync(classId);
        return invitations.Select(i => ToDto(i, classEntity.Name));
    }

    public async Task<ClassInvitation?> GetInvitationByIdAsync(Guid id)
        => await _invitationRepository.GetByIdAsync(id);

    public async Task DeleteInvitationAsync(ClassInvitation invitation)
    {
        await _invitationRepository.DeleteAsync(invitation);
        await _invitationRepository.SaveChangesAsync();
    }

    private static ClassInvitationDto ToDto(ClassInvitation i, string className) => new()
    {
        Id = i.Id,
        ClassId = i.ClassId,
        ClassName = className,
        RecipientEmail = i.RecipientEmail,
        InviteCode = i.InviteCode,
        Status = i.Status,
        CreatedAt = i.CreatedAt,
    };
}
