namespace Bilgenly.Domain.Entities;

public class UserPreferences
{
    public Guid UserId { get; set; }
    public string ThemeMode { get; set; } = "system";
    public string Language { get; set; } = "English";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string TimeZone { get; set; } = "Eastern Time (ET)";
    public bool NotifyEmailQuizAssignments { get; set; } = true;
    public bool NotifyEmailGradingUpdates { get; set; } = true;
    public bool NotifyEmailAchievementAlerts { get; set; } = true;
    public bool NotifyEmailDeadlineReminders { get; set; } = true;
    public bool NotifyPushRealTimeUpdates { get; set; } = true;
    public bool NotifyPushWeeklySummaries { get; set; } = true;
    public string? StudyReminderTime { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
