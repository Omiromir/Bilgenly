import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import type {
  EmailNotificationPreferenceKey,
  PushNotificationPreferenceKey,
  ThemeMode,
  UserSettings,
  UserSettingsProfile,
} from "../../features/dashboard/settings/userSettings";
import {
  createDefaultUserSettings,
  getSettingsStorageScope,
  readUserSettings,
  writeUserSettings,
} from "../../features/dashboard/settings/userSettings";
import {
  formatCurrentDate,
  formatCurrentDateTime,
  formatCurrentShortDate,
  getDefaultTimeZone,
  resolveDocumentLanguage,
  resolveLocale,
  syncFormattingPreferences,
} from "../../features/dashboard/settings/settingsPreferences";
import { changePassword, revokeSessionById } from "../../features/auth/api";
import {
  getMyPreferences,
  saveMyPreferences,
} from "../../features/dashboard/api/preferencesApi";
import type { UserPreferencesDto } from "../../features/dashboard/api/preferencesApi";
import {
  SETTINGS_DATE_FORMAT_OPTIONS,
  SETTINGS_LANGUAGE_OPTIONS,
  SETTINGS_TIME_ZONE_OPTIONS,
} from "../../features/dashboard/settings/settingsPreferences";

type AnySettingsArray = readonly string[];
function safeFromOptions<T extends AnySettingsArray>(
  options: T,
  value: string,
  fallback: T[number],
): T[number] {
  return (options as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

// These are the factory-default timezone values (frontend + backend).
// If the account still carries one of these, the user never explicitly picked
// a timezone, so we fall back to the browser-detected zone instead.
const FACTORY_DEFAULT_TIMEZONES = new Set([
  "Pacific Time (PT)",  // frontend default
  "Eastern Time (ET)",  // backend default
]);

function applyBackendPreferences(
  settings: UserSettings,
  prefs: UserPreferencesDto,
): UserSettings {
  const themeMode: "light" | "dark" | "system" =
    prefs.themeMode === "light" || prefs.themeMode === "dark" || prefs.themeMode === "system"
      ? prefs.themeMode
      : settings.appearance.themeMode;

  // If the stored timezone is still one of the factory defaults, prefer the
  // browser-detected timezone so the user always sees their local time even
  // if they never visited the Settings page.
  const resolvedTimeZone = FACTORY_DEFAULT_TIMEZONES.has(prefs.timeZone)
    ? getDefaultTimeZone()
    : safeFromOptions(SETTINGS_TIME_ZONE_OPTIONS, prefs.timeZone, settings.profile.timeZone);

  return {
    ...settings,
    appearance: {
      ...settings.appearance,
      themeMode,
    },
    profile: {
      ...settings.profile,
      language: safeFromOptions(SETTINGS_LANGUAGE_OPTIONS, prefs.language, settings.profile.language),
      dateFormat: safeFromOptions(SETTINGS_DATE_FORMAT_OPTIONS, prefs.dateFormat, settings.profile.dateFormat),
      timeZone: resolvedTimeZone,
    },
    notifications: {
      email: {
        quizAssignments: prefs.notifyEmailQuizAssignments,
        gradingUpdates: prefs.notifyEmailGradingUpdates,
        achievementAlerts: prefs.notifyEmailAchievementAlerts,
        deadlineReminders: prefs.notifyEmailDeadlineReminders,
      },
      push: {
        realTimeUpdates: prefs.notifyPushRealTimeUpdates,
        weeklySummaries: prefs.notifyPushWeeklySummaries,
      },
    },
  };
}

const AUTH_TOKEN_KEY_SETTINGS = "bilgenly_token";

interface PasswordUpdateInput {
  currentPassword: string;
  newPassword: string;
}

interface SecurityActionResult {
  mode: "local-only" | "remote";
}

interface SettingsContextValue {
  settings: UserSettings;
  isHydrated: boolean;
  resolvedTheme: "light" | "dark";
  studyReminderTime: string | null;
  saveStudyReminderTime: (time: string | null) => Promise<void>;
  saveProfileSettings: (profile: UserSettingsProfile) => void;
  updateThemeMode: (themeMode: ThemeMode) => void;
  updateNotificationPreference: (
    channel: "email" | "push",
    key: EmailNotificationPreferenceKey | PushNotificationPreferenceKey,
    enabled: boolean,
  ) => void;
  updatePreferenceField: (
    key: "language" | "dateFormat",
    value: string,
  ) => void;
  locale: string;
  formatDate: (
    value: string | Date,
    options?: { includeYear?: boolean },
  ) => string;
  formatDateTime: (value: string | Date) => string;
  formatShortDate: (value: string | Date) => string;
  revokeSession: (sessionId: string) => Promise<SecurityActionResult>;
  updatePassword: (input: PasswordUpdateInput) => Promise<SecurityActionResult>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const {
    currentUser: authCurrentUser,
    role,
    token,
    updateCurrentUserProfile,
  } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const [studyReminderTime, setStudyReminderTime] = useState<string | null>(null);
  const hydratedStorageScopeRef = useRef<string | null>(null);

  const userId = authCurrentUser?.id ?? null;
  const userEmail = authCurrentUser?.email ?? null;
  const storageScope = useMemo(
    () =>
      getSettingsStorageScope({
        userId,
        email: userEmail,
        role,
        token,
      }),
    [userId, userEmail, role, token],
  );
  const defaultSettings = useMemo(
    () => createDefaultUserSettings({ user: authCurrentUser }),
    [authCurrentUser],
  );
  const scopedSettingsSnapshot = useMemo(
    () => readUserSettings(storageScope, defaultSettings),
    [defaultSettings, storageScope],
  );
  const [loadedState, setLoadedState] = useState<{
    scope: string;
    settings: UserSettings;
  }>({
    scope: storageScope,
    settings: scopedSettingsSnapshot,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Only update when scope actually changes to prevent loops
    if (hydratedStorageScopeRef.current === storageScope) {
      return;
    }
    hydratedStorageScopeRef.current = storageScope;

    const localSettings = scopedSettingsSnapshot;

    if (localStorage.getItem(AUTH_TOKEN_KEY_SETTINGS)) {
      getMyPreferences()
        .then((prefs) => {
          const merged = applyBackendPreferences(localSettings, prefs);
          writeUserSettings(storageScope, merged);
          setLoadedState({ scope: storageScope, settings: merged });
          setStudyReminderTime(prefs.studyReminderTime ?? null);

          // If the stored timezone was a factory default we auto-corrected it
          // to the browser zone — persist it so subsequent logins are also right.
          if (FACTORY_DEFAULT_TIMEZONES.has(prefs.timeZone)) {
            saveMyPreferences({
              themeMode: merged.appearance.themeMode,
              language: merged.profile.language,
              dateFormat: merged.profile.dateFormat,
              timeZone: merged.profile.timeZone,
              notifyEmailQuizAssignments: merged.notifications.email.quizAssignments,
              notifyEmailGradingUpdates: merged.notifications.email.gradingUpdates,
              notifyEmailAchievementAlerts: merged.notifications.email.achievementAlerts,
              notifyEmailDeadlineReminders: merged.notifications.email.deadlineReminders,
              notifyPushRealTimeUpdates: merged.notifications.push.realTimeUpdates,
              notifyPushWeeklySummaries: merged.notifications.push.weeklySummaries,
            }).catch(() => {});
          }
        })
        .catch(() => {
          setLoadedState({ scope: storageScope, settings: localSettings });
        })
        .finally(() => {
          setIsHydrated(true);
        });
    } else {
      setLoadedState({ scope: storageScope, settings: localSettings });
      setIsHydrated(true);
    }
  }, [scopedSettingsSnapshot, storageScope]);

  const settings =
    loadedState.scope === storageScope
      ? loadedState.settings
      : scopedSettingsSnapshot;

  const resolvedTheme =
    settings.appearance.themeMode === "system"
      ? systemTheme
      : settings.appearance.themeMode;
  const locale = resolveLocale(settings.profile.language);

  syncFormattingPreferences({
    language: settings.profile.language,
    dateFormat: settings.profile.dateFormat,
    timeZone: settings.profile.timeZone,
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
    root.dataset.themeMode = settings.appearance.themeMode;
    root.lang = resolveDocumentLanguage(settings.profile.language);
    root.dataset.locale = locale;
    root.dataset.dateFormat = settings.profile.dateFormat;
    root.dataset.timeZone = settings.profile.timeZone;
  }, [
    locale,
    resolvedTheme,
    settings.appearance.themeMode,
    settings.profile.dateFormat,
    settings.profile.language,
    settings.profile.timeZone,
  ]);

  const persistSettings = (
    updater: (current: UserSettings) => UserSettings,
  ) => {
    setLoadedState((current) => {
      const baseSettings =
        current.scope === storageScope
          ? current.settings
          : scopedSettingsSnapshot;
      const nextSettings = updater(baseSettings);
      writeUserSettings(storageScope, nextSettings);

      if (localStorage.getItem(AUTH_TOKEN_KEY_SETTINGS)) {
        saveMyPreferences({
          themeMode: nextSettings.appearance.themeMode,
          language: nextSettings.profile.language,
          dateFormat: nextSettings.profile.dateFormat,
          timeZone: nextSettings.profile.timeZone,
          notifyEmailQuizAssignments: nextSettings.notifications.email.quizAssignments,
          notifyEmailGradingUpdates: nextSettings.notifications.email.gradingUpdates,
          notifyEmailAchievementAlerts: nextSettings.notifications.email.achievementAlerts,
          notifyEmailDeadlineReminders: nextSettings.notifications.email.deadlineReminders,
          notifyPushRealTimeUpdates: nextSettings.notifications.push.realTimeUpdates,
          notifyPushWeeklySummaries: nextSettings.notifications.push.weeklySummaries,
        }).catch(() => {});
      }

      return {
        scope: storageScope,
        settings: nextSettings,
      };
    });
  };

  const saveProfileSettings = (profile: UserSettingsProfile) => {
    updateCurrentUserProfile({
      username: profile.fullName,
      email: profile.email,
    });

    persistSettings((current) => ({
      ...current,
      profile,
    }));
  };

  const updateThemeMode = (themeMode: ThemeMode) => {
    persistSettings((current) => ({
      ...current,
      appearance: {
        ...current.appearance,
        themeMode,
      },
    }));
  };

  const updateNotificationPreference = (
    channel: "email" | "push",
    key: EmailNotificationPreferenceKey | PushNotificationPreferenceKey,
    enabled: boolean,
  ) => {
    persistSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [channel]: {
          ...current.notifications[channel],
          [key]: enabled,
        },
      },
    }));
  };

  const updatePreferenceField = (
    key: "language" | "dateFormat",
    value: string,
  ) => {
    persistSettings((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  };

  const revokeSession = async (sessionId: string) => {
    const result = await revokeSessionById(sessionId);

    persistSettings((current) => ({
      ...current,
      security: {
        ...current.security,
        sessions: current.security.sessions.filter(
          (session) => session.id !== sessionId,
        ),
      },
    }));

    return result;
  };

  const updatePassword = async ({
    currentPassword,
    newPassword,
  }: PasswordUpdateInput) => {
    const result = await changePassword({
      currentPassword,
      newPassword,
    });

    persistSettings((current) => ({
      ...current,
      security: {
        ...current.security,
        passwordUpdatedAt: new Date().toISOString(),
      },
    }));

    void currentPassword;
    void newPassword;

    return result;
  };

  const saveStudyReminderTime = async (time: string | null) => {
    setStudyReminderTime(time);
    if (localStorage.getItem(AUTH_TOKEN_KEY_SETTINGS)) {
      await saveMyPreferences({
        themeMode: settings.appearance.themeMode,
        language: settings.profile.language,
        dateFormat: settings.profile.dateFormat,
        timeZone: settings.profile.timeZone,
        notifyEmailQuizAssignments: settings.notifications.email.quizAssignments,
        notifyEmailGradingUpdates: settings.notifications.email.gradingUpdates,
        notifyEmailAchievementAlerts: settings.notifications.email.achievementAlerts,
        notifyEmailDeadlineReminders: settings.notifications.email.deadlineReminders,
        notifyPushRealTimeUpdates: settings.notifications.push.realTimeUpdates,
        notifyPushWeeklySummaries: settings.notifications.push.weeklySummaries,
        studyReminderTime: time,
      });
    }
  };

  const value = useMemo(
    () => ({
      settings,
      isHydrated,
      resolvedTheme,
      studyReminderTime,
      saveStudyReminderTime,
      saveProfileSettings,
      updateThemeMode,
      updateNotificationPreference,
      updatePreferenceField,
      locale,
      formatDate: formatCurrentDate,
      formatDateTime: formatCurrentDateTime,
      formatShortDate: formatCurrentShortDate,
      revokeSession,
      updatePassword,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isHydrated, locale, resolvedTheme, settings, studyReminderTime],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider.");
  }

  return context;
}
