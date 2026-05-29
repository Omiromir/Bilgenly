import { apiRequest } from "../../../lib/apiClient";

export interface UserPreferencesDto {
  themeMode: "light" | "dark" | "system";
  language: string;
  dateFormat: string;
  timeZone: string;
  notifyEmailQuizAssignments: boolean;
  notifyEmailGradingUpdates: boolean;
  notifyEmailAchievementAlerts: boolean;
  notifyEmailDeadlineReminders: boolean;
  notifyPushRealTimeUpdates: boolean;
  notifyPushWeeklySummaries: boolean;
  studyReminderTime: string | null;
  updatedAt: string;
}

export interface SaveUserPreferencesDto {
  themeMode: string;
  language: string;
  dateFormat: string;
  timeZone: string;
  notifyEmailQuizAssignments: boolean;
  notifyEmailGradingUpdates: boolean;
  notifyEmailAchievementAlerts: boolean;
  notifyEmailDeadlineReminders: boolean;
  notifyPushRealTimeUpdates: boolean;
  notifyPushWeeklySummaries: boolean;
  studyReminderTime?: string | null;
}

export function getMyPreferences() {
  return apiRequest<UserPreferencesDto>("/api/preferences", {
    fallbackErrorMessage: "Unable to load preferences.",
  });
}

export function saveMyPreferences(dto: SaveUserPreferencesDto) {
  return apiRequest<UserPreferencesDto>("/api/preferences", {
    method: "PUT",
    body: dto,
    fallbackErrorMessage: "Unable to save preferences.",
  });
}
