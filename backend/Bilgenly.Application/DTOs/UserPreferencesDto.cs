namespace Bilgenly.Application.DTOs;

public class UserPreferencesDto
{
    public string ThemeMode { get; set; } = "system";
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string TimeZone { get; set; } = "UTC";
    public bool NotifyEmailQuizAssignments { get; set; } = true;
    public bool NotifyEmailGradingUpdates { get; set; } = true;
    public bool NotifyEmailAchievementAlerts { get; set; } = true;
    public bool NotifyEmailDeadlineReminders { get; set; } = true;
    public bool NotifyPushRealTimeUpdates { get; set; } = true;
    public bool NotifyPushWeeklySummaries { get; set; } = true;
    public string? StudyReminderTime { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SaveUserPreferencesDto
{
    public string ThemeMode { get; set; } = "system";
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string TimeZone { get; set; } = "UTC";
    public bool NotifyEmailQuizAssignments { get; set; } = true;
    public bool NotifyEmailGradingUpdates { get; set; } = true;
    public bool NotifyEmailAchievementAlerts { get; set; } = true;
    public bool NotifyEmailDeadlineReminders { get; set; } = true;
    public bool NotifyPushRealTimeUpdates { get; set; } = true;
    public bool NotifyPushWeeklySummaries { get; set; } = true;
    public string? StudyReminderTime { get; set; }
}
