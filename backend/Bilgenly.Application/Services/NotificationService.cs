using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class NotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<IEnumerable<NotificationDto>> GetForUserAsync(Guid userId, string email)
    {
        var notifications = await _notificationRepository.GetByRecipientAsync(userId, email);
        return notifications.Select(ToDto);
    }

    public async Task<(NotificationDto? Result, string? Error)> UpsertClassInvitationAsync(
        CreateNotificationDto dto, Guid requestingUserId)
    {
        var existing = await _notificationRepository.GetClassInvitationAsync(
            dto.RelatedClassId, dto.StudentId);

        if (existing != null)
        {
            existing.RecipientUserId = ParseGuid(dto.RecipientUserId);
            existing.RecipientEmail = dto.RecipientEmail;
            existing.Title = dto.Title;
            existing.Message = dto.Message;
            existing.RelatedClassName = dto.RelatedClassName;
            existing.SenderName = dto.SenderName;
            existing.SenderEmail = dto.SenderEmail;
            existing.StudentName = dto.StudentName;
            existing.StudentEmail = dto.StudentEmail;
            existing.Status = "pending";
            existing.Read = false;
            existing.UpdatedAt = DateTime.UtcNow;
            await _notificationRepository.SaveChangesAsync();
            return (ToDto(existing), null);
        }

        var notification = new Notification
        {
            Id = TryParseGuid(dto.ExistingId) ?? Guid.NewGuid(),
            Type = "class_invitation",
            RecipientUserId = ParseGuid(dto.RecipientUserId),
            RecipientEmail = dto.RecipientEmail,
            Title = dto.Title,
            Message = dto.Message,
            ActionType = "class_invitation",
            RelatedClassId = dto.RelatedClassId,
            RelatedClassName = dto.RelatedClassName,
            SenderName = dto.SenderName,
            SenderEmail = dto.SenderEmail,
            StudentId = dto.StudentId,
            StudentName = dto.StudentName,
            StudentEmail = dto.StudentEmail,
            Status = "pending",
            Read = false,
            CreatedAt = dto.CreatedAt?.ToUniversalTime() ?? DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();
        return (ToDto(notification), null);
    }

    public async Task<(NotificationDto? Result, string? Error)> CreateQuizFollowUpAsync(
        CreateNotificationDto dto, Guid requestingUserId)
    {
        var notification = new Notification
        {
            Id = TryParseGuid(dto.ExistingId) ?? Guid.NewGuid(),
            Type = "quiz_follow_up",
            RecipientUserId = ParseGuid(dto.RecipientUserId),
            RecipientEmail = dto.RecipientEmail,
            Title = dto.Title,
            Message = dto.Message,
            ActionType = "open_assigned_quiz",
            RelatedClassId = dto.RelatedClassId,
            RelatedClassName = dto.RelatedClassName,
            SenderName = dto.SenderName,
            SenderEmail = dto.SenderEmail,
            StudentId = dto.StudentId,
            StudentName = dto.StudentName,
            StudentEmail = dto.StudentEmail,
            Status = "sent",
            Read = false,
            QuizId = dto.QuizId,
            QuizTitle = dto.QuizTitle,
            AssignmentId = dto.AssignmentId,
            AttemptId = dto.AttemptId,
            FollowUpKind = dto.FollowUpKind,
            CreatedAt = dto.CreatedAt?.ToUniversalTime() ?? DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();
        return (ToDto(notification), null);
    }

    public async Task<(NotificationDto? Result, string? Error)> MarkReadAsync(Guid notificationId, Guid userId, string email)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId);
        if (notification is null) return (null, "Notification not found");
        if (!BelongsToUser(notification, userId, email)) return (null, "Access denied");

        notification.Read = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _notificationRepository.SaveChangesAsync();
        return (ToDto(notification), null);
    }

    public async Task MarkAllReadAsync(Guid userId, string email)
    {
        var notifications = await _notificationRepository.GetByRecipientAsync(userId, email);
        foreach (var n in notifications)
        {
            n.Read = true;
            n.UpdatedAt = DateTime.UtcNow;
        }
        await _notificationRepository.SaveChangesAsync();
    }

    public async Task<(NotificationDto? Result, string? Error)> UpdateStatusAsync(
        Guid notificationId, string status, Guid userId, string email)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId);
        if (notification is null) return (null, "Notification not found");
        if (!BelongsToUser(notification, userId, email)) return (null, "Access denied");

        notification.Status = status;
        notification.Read = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _notificationRepository.SaveChangesAsync();
        return (ToDto(notification), null);
    }

    public async Task<string?> DeleteAsync(Guid notificationId, Guid userId, string email)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId);
        if (notification is null) return "Notification not found";
        if (!BelongsToUser(notification, userId, email)) return "Access denied";

        _notificationRepository.Remove(notification);
        await _notificationRepository.SaveChangesAsync();
        return null;
    }

    public async Task DeleteForClassAsync(string relatedClassId, Guid requestingUserId)
    {
        var notifications = await _notificationRepository.GetByRecipientAsync(requestingUserId, "");
        foreach (var n in notifications.Where(n => n.RelatedClassId == relatedClassId))
            _notificationRepository.Remove(n);
        await _notificationRepository.SaveChangesAsync();
    }

    private static bool BelongsToUser(Notification n, Guid userId, string email)
    {
        if (n.RecipientUserId == userId) return true;
        var normalizedEmail = email.Trim().ToLower();
        return n.RecipientEmail.Trim().ToLower() == normalizedEmail;
    }

    private static Guid? ParseGuid(string? value)
        => Guid.TryParse(value, out var guid) ? guid : null;

    private static Guid? TryParseGuid(string? value)
        => Guid.TryParse(value, out var guid) ? guid : null;

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        RecipientUserId = n.RecipientUserId?.ToString() ?? string.Empty,
        RecipientEmail = n.RecipientEmail,
        Title = n.Title,
        Message = n.Message,
        Read = n.Read,
        ActionType = n.ActionType,
        RelatedClassId = n.RelatedClassId,
        RelatedClassName = n.RelatedClassName,
        SenderName = n.SenderName,
        SenderEmail = n.SenderEmail,
        StudentId = n.StudentId,
        StudentName = n.StudentName,
        StudentEmail = n.StudentEmail,
        Status = n.Status,
        QuizId = n.QuizId,
        QuizTitle = n.QuizTitle,
        AssignmentId = n.AssignmentId,
        AttemptId = n.AttemptId,
        FollowUpKind = n.FollowUpKind,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt,
    };
}
