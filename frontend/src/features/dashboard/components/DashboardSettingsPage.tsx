import {
  Bell,
  ChevronDown,
  Lock,
  Palette,
  Trash2,
  User,
} from "../../../components/icons/AppIcons";
import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../../app/providers/AuthProvider";
import { deleteMyAccount } from "../../../features/auth/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../components/ui/utils";
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
  data,
}: DashboardSettingsPageProps) {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
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
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteMyAccount();
      signOut();
      navigate("/");
      toast.success("Your account has been permanently deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete account.");
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
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

              <SettingsPanel title="Location & Time Zone">
                <div className="space-y-5">
                  {data.account.location.map((field) => (
                    <SelectLikeField
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </SettingsPanel>
            </>
          ) : null}

          {activeTab === "security" ? (
            <>
              <SettingsPanel title="Change Password">
                <div className="space-y-5">
                  {data.security.passwordFields.map((field) => (
                    <FieldRenderer key={field.label} field={field} password />
                  ))}
                  <DashboardButton type="button" size="lg">
                    Update Password
                  </DashboardButton>
                </div>
              </SettingsPanel>

              <SettingsPanel title="Danger Zone">
                <div className="space-y-4">
                  <div className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/30 px-5 py-4">
                    <p className="text-sm font-semibold text-[var(--dashboard-danger)]">
                      Delete Account
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <DashboardButton
                    type="button"
                    size="lg"
                    variant="ghost"
                    className="border border-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)] hover:bg-[var(--dashboard-danger-soft)]/40 hover:text-[var(--dashboard-danger)]"
                    onClick={() => setShowDeleteAccountDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete My Account
                  </DashboardButton>
                </div>
              </SettingsPanel>
            </>
          ) : null}

          {activeTab === "notifications" ? (
            <>
              <SettingsPanel title="Email Notifications">
                <div className="space-y-3">
                  {data.notifications.email.map((item) => (
                    <ToggleRow key={item.label} item={item} />
                  ))}
                </div>
              </SettingsPanel>

              <SettingsPanel title="Push Notifications">
                <div className="space-y-3">
                  {data.notifications.push.map((item) => (
                    <ToggleRow key={item.label} item={item} />
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
                    <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">Theme</p>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {data.preferences.themes.map((theme) => (
                        <button
                          key={theme.label}
                          type="button"
                          className={cn(
                            "rounded-[16px] border p-4 text-center transition",
                            theme.selected
                              ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-surface-muted)]"
                              : "border-[var(--dashboard-border-soft)] bg-white hover:bg-[var(--dashboard-surface-muted)]"
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

              <SettingsPanel title="Language & Region">
                <div className="space-y-5">
                  {data.preferences.region.map((field) => (
                    <SelectLikeField
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </SettingsPanel>

              <SettingsPanel title="Privacy">
                <div className="space-y-4">
                  {data.preferences.privacy.map((item) => (
                    <ToggleRow key={item.label} item={item} />
                  ))}
                </div>
              </SettingsPanel>
            </>
          ) : null}
        </div>
      </div>

      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all quiz attempts, class memberships, and any quizzes you created. There is no way to recover your data after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingAccount}
              className="bg-[var(--dashboard-danger)] text-white hover:bg-[var(--dashboard-danger)]/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeletingAccount ? "Deleting…" : "Delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  password = false,
}: {
  field: SettingsField;
  password?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">{field.label}</span>
      {field.kind === "textarea" ? (
        <Textarea
          readOnly
          value={field.value}
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
    </label>
  );
}

function SelectLikeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">{label}</p>
      <div
        className={cn(
          dashboardInputVariants({ size: "lg" }),
          "flex items-center justify-between border-0",
        )}
      >
        <span>{value}</span>
        <ChevronDown className="h-4 w-4 text-[var(--dashboard-text-faint)]" />
      </div>
    </div>
  );
}

function ToggleRow({ item }: { item: SettingsToggleItem }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--dashboard-border-soft)] px-4 py-4">
      <div>
        <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">{item.label}</p>
        <p className={dashboardMetaTextClassName}>{item.description}</p>
      </div>
      <div
        className={cn(
          "flex h-7 w-10 items-center rounded-full p-1 transition",
          item.enabled
            ? "justify-end bg-[var(--dashboard-brand)]"
            : "justify-start bg-[var(--dashboard-border)]"
        )}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}
