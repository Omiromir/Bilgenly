using Bilgenly.Application.DTOs;
using Bilgenly.Application.Interfaces;
using Bilgenly.Domain.Entities;

namespace Bilgenly.Application.Services;

public class UserPreferencesService
{
    private readonly IUserPreferencesRepository _preferencesRepository;

    public UserPreferencesService(IUserPreferencesRepository preferencesRepository)
    {
        _preferencesRepository = preferencesRepository;
    }

    public async Task<UserPreferencesDto?> GetAsync(Guid userId)
    {
        var prefs = await _preferencesRepository.GetByUserIdAsync(userId);
        return prefs is null ? null : ToDto(prefs);
    }

    public async Task<UserPreferencesDto> SaveAsync(Guid userId, SaveUserPreferencesDto dto)
    {
        var existing = await _preferencesRepository.GetByUserIdAsync(userId);

        if (existing is null)
        {
            existing = new UserPreferences { UserId = userId };
            await _preferencesRepository.AddAsync(existing);
        }

        existing.ThemeMode = dto.ThemeMode;
        existing.Language = dto.Language;
        existing.DateFormat = dto.DateFormat;
        existing.TimeZone = dto.TimeZone;
        existing.NotifyEmailQuizAssignments = dto.NotifyEmailQuizAssignments;
        existing.NotifyEmailGradingUpdates = dto.NotifyEmailGradingUpdates;
        existing.NotifyEmailAchievementAlerts = dto.NotifyEmailAchievementAlerts;
        existing.NotifyEmailDeadlineReminders = dto.NotifyEmailDeadlineReminders;
        existing.NotifyPushRealTimeUpdates = dto.NotifyPushRealTimeUpdates;
        existing.NotifyPushWeeklySummaries = dto.NotifyPushWeeklySummaries;
        existing.StudyReminderTime = dto.StudyReminderTime;
        existing.UpdatedAt = DateTime.UtcNow;

        await _preferencesRepository.SaveChangesAsync();
        return ToDto(existing);
    }

    private static UserPreferencesDto ToDto(UserPreferences p) => new()
    {
        ThemeMode = p.ThemeMode,
        Language = p.Language,
        DateFormat = p.DateFormat,
        TimeZone = p.TimeZone,
        NotifyEmailQuizAssignments = p.NotifyEmailQuizAssignments,
        NotifyEmailGradingUpdates = p.NotifyEmailGradingUpdates,
        NotifyEmailAchievementAlerts = p.NotifyEmailAchievementAlerts,
        NotifyEmailDeadlineReminders = p.NotifyEmailDeadlineReminders,
        NotifyPushRealTimeUpdates = p.NotifyPushRealTimeUpdates,
        NotifyPushWeeklySummaries = p.NotifyPushWeeklySummaries,
        StudyReminderTime = p.StudyReminderTime,
        UpdatedAt = p.UpdatedAt,
    };
}
