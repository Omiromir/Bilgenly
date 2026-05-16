import {
  Bell,
  ChevronDown,
  Lock,
  Palette,
  User,
} from "../../../components/icons/AppIcons";
import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../components/ui/utils";
import { useSettings } from "../../../app/providers/SettingsProvider";
import { DashboardPageHeader } from "./DashboardPageHeader";
import type {
  SettingsFieldMetadata,
  SettingsScreenMetadata,
  SettingsSelectMetadata,
  SettingsToggleMetadata,
} from "../settings/settingsMetadata";
import type {
  EmailNotificationPreferenceKey,
  PushNotificationPreferenceKey,
  ThemeMode,
} from "../settings/userSettings";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardInputVariants,
  dashboardMetaTextClassName,
  dashboardPageClassName,
  dashboardTabVariants,
  dashboardTextareaVariants,
} from "./DashboardPrimitives";

type SettingsTab = "account" | "security" | "notifications" | "preferences";

interface DashboardSettingsPageProps {
  title: string;
  subtitle: string;
  metadata: SettingsScreenMetadata;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const tabs: Array<{
  id: SettingsTab;
  label: string;
  icon: typeof User;
}> = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Palette },
];

const emptyPasswordForm: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function buildRoleLabel(role: string | null | undefined) {
  switch (role) {
    case "teacher":
      return "Teacher";
    case "student":
      return "Student";
    case "moderator":
      return "Moderator";
    default:
      return "User";
  }
}

function validatePasswordForm(values: PasswordFormValues): PasswordFormErrors {
  const errors: PasswordFormErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!values.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

export function DashboardSettingsPage({
  title,
  subtitle,
  metadata,
}: DashboardSettingsPageProps) {
  const { role } = useAuth();
  const {
    settings,
    updateThemeMode,
    updateNotificationPreference,
    updatePreferenceField,
    updatePassword,
  } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [passwordValues, setPasswordValues] =
    useState<PasswordFormValues>(emptyPasswordForm);
  const [passwordTouched, setPasswordTouched] = useState<
    Record<keyof PasswordFormValues, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const passwordErrors = useMemo(
    () => validatePasswordForm(passwordValues),
    [passwordValues],
  );
  const canUpdatePassword =
    !isUpdatingPassword &&
    !hasErrors(passwordErrors) &&
    passwordValues.currentPassword.trim() !== "" &&
    passwordValues.newPassword.trim() !== "" &&
    passwordValues.confirmPassword.trim() !== "";

  const handlePasswordFieldChange =
    (field: keyof PasswordFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setPasswordValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handlePasswordFieldBlur = (field: keyof PasswordFormValues) => () => {
    setPasswordTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handlePasswordSubmit = async () => {
    setPasswordTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    if (hasErrors(passwordErrors)) {
      toast.error("Please fix the password form errors.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await updatePassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
      setPasswordValues(emptyPasswordForm);
      setPasswordTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });
      toast.success(
        result.mode === "remote"
          ? "Password updated."
          : "Password change was saved locally. Connect a backend endpoint before treating this as real account security.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader title={title} subtitle={subtitle} />

      <div className="grid gap-6 xl:grid-cols-[402px_minmax(0,1fr)] xl:items-start">
        <DashboardSurface asChild radius="md" padding="none">
          <aside className="p-2">
            <nav className="space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={dashboardTabVariants({ active: activeTab === tab.id })}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </DashboardSurface>

        <div className="space-y-6">
          {activeTab === "account" ? (
            <>
              <SettingsPanel title="Personal Information">
                <div className="space-y-4">
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    Edit your name, bio, avatar, and country from My Profile. This settings section is read-only so personal details live in one place.
                  </p>
                  <div className="grid gap-5 lg:grid-cols-2">
                    <ReadOnlyField label="Full Name" value={settings.profile.fullName} />
                    <ReadOnlyField label="Email" value={settings.profile.email} />
                    <ReadOnlyField label="Country" value={settings.profile.country} />
                    <ReadOnlyField label="Role" value={buildRoleLabel(role)} />
                  </div>
                  <ReadOnlyField
                    label="Bio"
                    value={settings.profile.bio || "No bio added yet."}
                    multiline
                  />
                </div>
              </SettingsPanel>
            </>
          ) : null}

          {activeTab === "security" ? (
            <>
              <SettingsPanel title="Change Password">
                <div className="space-y-5">
                  {metadata.security.passwordFields.map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      password
                      value={passwordValues[field.id as keyof PasswordFormValues]}
                      error={
                        passwordTouched[field.id as keyof PasswordFormValues]
                          ? passwordErrors[field.id as keyof PasswordFormErrors]
                          : undefined
                      }
                      onBlur={handlePasswordFieldBlur(
                        field.id as keyof PasswordFormValues,
                      )}
                      onChange={handlePasswordFieldChange(
                        field.id as keyof PasswordFormValues,
                      )}
                    />
                  ))}
                  <DashboardButton
                    type="button"
                    size="lg"
                    onClick={handlePasswordSubmit}
                    disabled={!canUpdatePassword}
                  >
                    Update Password
                  </DashboardButton>
                </div>
              </SettingsPanel>
            </>
          ) : null}

          {activeTab === "notifications" ? (
            <>
              <SettingsPanel title="Notification Categories">
                <div className="space-y-3">
                  {metadata.notifications.email.map((item) => (
                    <ToggleRow
                      key={item.id}
                      item={item}
                      enabled={
                        settings.notifications.email[
                          item.id as EmailNotificationPreferenceKey
                        ]
                      }
                      onToggle={(enabled) =>
                        updateNotificationPreference(
                          "email",
                          item.id as EmailNotificationPreferenceKey,
                          enabled,
                        )
                      }
                    />
                  ))}
                </div>
              </SettingsPanel>

              <SettingsPanel title="In-App Delivery">
                <div className="space-y-3">
                  {metadata.notifications.push.map((item) => (
                    <ToggleRow
                      key={item.id}
                      item={item}
                      enabled={
                        settings.notifications.push[
                          item.id as PushNotificationPreferenceKey
                        ]
                      }
                      onToggle={(enabled) =>
                        updateNotificationPreference(
                          "push",
                          item.id as PushNotificationPreferenceKey,
                          enabled,
                        )
                      }
                    />
                  ))}
                </div>
              </SettingsPanel>
            </>
          ) : null}

          {activeTab === "preferences" ? (
            <>
              <SettingsPanel title="Appearance">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                      Theme
                    </p>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {metadata.preferences.themes.map((theme) => (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => {
                            updateThemeMode(theme.value as ThemeMode);
                            toast.success(`Theme set to ${theme.label.toLowerCase()}.`);
                          }}
                          className={cn(
                            "rounded-[16px] border p-4 text-center transition",
                            settings.appearance.themeMode === theme.value
                              ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-surface-muted)]"
                              : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] hover:bg-[var(--dashboard-surface-muted)]",
                          )}
                        >
                          <div
                            className="h-10 rounded-md opacity-20"
                            style={{ background: "var(--dashboard-gradient)" }}
                          />
                          <p className="mt-3 text-sm font-medium text-[var(--dashboard-text-strong)]">
                            {theme.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SettingsPanel>

              <SettingsPanel title="Regional Format">
                <div className="grid gap-5 lg:grid-cols-2">
                  {metadata.preferences.region.map((field) => (
                    <SelectLikeField
                      key={field.id}
                      field={field}
                      value={settings.profile[field.id as "dateFormat"]}
                      onChange={(event) => {
                        updatePreferenceField(
                          field.id as "dateFormat",
                          event.target.value,
                        );
                        toast.success(
                          "Date format preference saved.",
                        );
                      }}
                    />
                  ))}
                </div>
              </SettingsPanel>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <DashboardSurface asChild radius="md" padding="md">
      <section className="sm:p-6">
        <h2 className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
          {title}
        </h2>
        <div className="mt-5">{children}</div>
      </section>
    </DashboardSurface>
  );
}

function ReadOnlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
        {label}
      </p>
      <div
        className={cn(
          "w-full rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)] shadow-none",
          multiline
            ? "min-h-[106px] whitespace-pre-wrap px-4 py-4 text-[15px] leading-7"
            : "flex min-h-[56px] items-center px-4 py-3 text-base",
        )}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  password = false,
  onChange,
  onBlur,
}: {
  field: SettingsFieldMetadata;
  value: string;
  error?: string;
  password?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
        {field.label}
      </span>
      {field.kind === "textarea" ? (
        <Textarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          className={cn(
            dashboardTextareaVariants({ size: "md" }),
            "min-h-[106px] border-0 shadow-none focus-visible:ring-0",
          )}
        />
      ) : (
        <Input
          type={password ? "password" : field.id === "email" ? "email" : "text"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          // Email cannot be changed once an account is created — the backend
          // does not support an email-change verification flow, so we render
          // it as a non-editable display in the settings page.
          disabled={field.id === "email"}
          readOnly={field.id === "email"}
          className={cn(
            dashboardInputVariants({ size: "lg" }),
            "border-0 shadow-none focus-visible:ring-0",
            field.id === "email" &&
              "cursor-not-allowed opacity-70",
          )}
        />
      )}
      {error ? (
        <p className="text-sm text-[var(--dashboard-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function SelectLikeField({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: SettingsSelectMetadata;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
        {field.label}
      </p>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            dashboardInputVariants({ size: "lg" }),
            "w-full appearance-none border-0 pr-10 shadow-none focus-visible:ring-0",
          )}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-text-faint)]" />
      </div>
    </div>
  );
}

function ToggleRow({
  item,
  enabled,
  onToggle,
}: {
  item: SettingsToggleMetadata;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
      className="flex w-full items-center justify-between gap-4 rounded-[16px] border border-[var(--dashboard-border-soft)] px-4 py-4 text-left"
    >
      <div>
        <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
          {item.label}
        </p>
        <p className={dashboardMetaTextClassName}>{item.description}</p>
      </div>
      <div
        className={cn(
          "flex h-7 w-10 items-center rounded-full p-1 transition",
          enabled
            ? "justify-end bg-[var(--dashboard-brand)]"
            : "justify-start bg-[var(--dashboard-border)]",
        )}
      >
        <span className="h-5 w-5 rounded-full bg-[var(--dashboard-surface-elevated)] shadow-sm" />
        <span className="sr-only">{enabled ? "Enabled" : "Disabled"}</span>
      </div>
    </button>
  );
}
