import type { ThemeMode } from "./userSettings";
import {
  SETTINGS_COUNTRY_OPTIONS,
  SETTINGS_DATE_FORMAT_OPTIONS,
} from "./settingsPreferences";

export interface SettingsToggleMetadata {
  id: string;
  label: string;
  description: string;
}

export interface SettingsFieldMetadata {
  id: string;
  label: string;
  kind?: "input" | "textarea";
}

export interface SettingsSelectMetadata {
  id: string;
  label: string;
  options: readonly string[];
}

export interface SettingsThemeMetadata {
  value: ThemeMode;
  label: string;
}

export interface SettingsScreenMetadata {
  account: {
    fields: SettingsFieldMetadata[];
    location: SettingsSelectMetadata[];
  };
  security: {
    passwordFields: SettingsFieldMetadata[];
  };
  notifications: {
    email: SettingsToggleMetadata[];
    push: SettingsToggleMetadata[];
  };
  preferences: {
    themes: SettingsThemeMetadata[];
    region: SettingsSelectMetadata[];
  };
}

export const dashboardSettingsMetadata: SettingsScreenMetadata = {
  account: {
    fields: [],
    location: [
      {
        id: "country",
        label: "Country",
        options: SETTINGS_COUNTRY_OPTIONS,
      },
    ],
  },
  security: {
    passwordFields: [
      { id: "currentPassword", label: "Current Password" },
      { id: "newPassword", label: "New Password" },
      { id: "confirmPassword", label: "Confirm New Password" },
    ],
  },
  notifications: {
    email: [
      {
        id: "quizAssignments",
        label: "Class invites and assigned quizzes",
        description: "Receive class invitation updates and follow-up quiz assignment notifications.",
      },
      {
        id: "gradingUpdates",
        label: "Review requests",
        description: "Receive follow-up notifications when a teacher asks you to review quiz work.",
      },
      {
        id: "achievementAlerts",
        label: "Achievement alerts",
        description: "Get notified when you score 80% or higher on a quiz.",
      },
      {
        id: "deadlineReminders",
        label: "Deadline reminders",
        description: "Receive an in-app alert when an assigned quiz deadline is within 24 hours.",
      },
    ],
    push: [
      {
        id: "realTimeUpdates",
        label: "In-app notification delivery",
        description: "Controls whether supported notification events appear in the dashboard inbox and header.",
      },
    ],
  },
  preferences: {
    themes: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "system", label: "System" },
    ],
    region: [
      {
        id: "dateFormat",
        label: "Date Format",
        options: SETTINGS_DATE_FORMAT_OPTIONS,
      },
    ],
  },
};
