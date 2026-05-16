import type { MockDashboardUser } from "../mock/mockUsers";
import type { ThemeMode, UserSettings } from "./settingsTypes";
import {
  getDefaultCountry as getPreferenceDefaultCountry,
  getDefaultDateFormat,
  getDefaultLanguage,
  getDefaultTimeZone,
} from "./settingsPreferences";

export function getProfileInitials(fullName: string) {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getThemeMode(value: unknown, fallback: ThemeMode): ThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : fallback;
}

export function createDefaultUserSettings({
  user,
}: {
  user: MockDashboardUser | null;
}): UserSettings {
  const fullName = user?.fullName ?? "";
  const email = user?.email ?? "";
  const bio = user?.bio ?? "";
  const avatarUrl = user?.avatarUrl ?? null;
  const country = getPreferenceDefaultCountry();

  return {
    profile: {
      fullName,
      email,
      phoneNumber: "",
      bio,
      country,
      timeZone: getDefaultTimeZone(),
      language: getDefaultLanguage(),
      dateFormat: getDefaultDateFormat(),
      avatarUrl,
    },
    appearance: {
      themeMode: "system",
    },
    notifications: {
      email: {
        quizAssignments: true,
        gradingUpdates: true,
        achievementAlerts: false,
        deadlineReminders: false,
      },
      push: {
        realTimeUpdates: true,
        weeklySummaries: true,
      },
    },
    security: {
      sessions: [
        {
          id: "current-session",
          device: "Chrome on MacBook Pro",
          description: `${country} - Active now`,
          isCurrent: true,
        },
        {
          id: "mobile-session",
          device: "Safari on iPhone",
          description: `${country} - 2 hours ago`,
          actionLabel: "Revoke",
          destructive: true,
        },
      ],
      passwordUpdatedAt: null,
    },
    rolePreferences: {
      teacher: {
        classInvitationNotifications: true,
        quizPublishingDefaults: true,
        defaultQuizVisibility: "class",
      },
      student: {
        practiceReminders: true,
        leaderboardVisibility: true,
        learningNotifications: true,
      },
      moderator: {
        moderationQueueAlerts: true,
        reportNotifications: true,
      },
    },
  };
}
