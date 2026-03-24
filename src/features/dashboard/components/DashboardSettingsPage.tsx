import {
  Bell,
  ChevronDown,
  Lock,
  Palette,
  Shield,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../components/ui/utils";
import { DashboardPageHeader } from "./DashboardPageHeader";
import type {
  SettingsField,
  SettingsScreenData,
  SettingsToggleItem,
} from "../mock/sharedUi";
import { Textarea } from "../../../components/ui/textarea";
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
  data: SettingsScreenData;
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

export function DashboardSettingsPage({
  title,
  subtitle,
  data,
}: DashboardSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

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
              <SettingsPanel title="Account Information">
                <div className="space-y-5">
                  {data.account.fields.map((field) => (
                    <FieldRenderer key={field.label} field={field} />
                  ))}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <DashboardButton type="button" size="lg">
                      Save Changes
                    </DashboardButton>
                    <DashboardButton type="button" variant="secondary" size="lg">
                      Cancel
                    </DashboardButton>
                  </div>
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

              <SettingsPanel title="Two-Factor Authentication">
                <p className="mb-5 text-[15px] leading-6 text-[var(--dashboard-text-soft)]">
                  Add an extra layer of security to your account by enabling
                  two-factor authentication.
                </p>
                <div className="flex items-center justify-between gap-4 rounded-[16px] bg-[var(--dashboard-surface-muted)] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={dashboardIconChipVariants({ tone: "success", size: "sm" })}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                        {data.security.twoFactor.title}
                      </p>
                      <p className="text-sm text-[var(--dashboard-text-soft)]">
                        {data.security.twoFactor.description}
                      </p>
                    </div>
                  </div>

                  <DashboardButton type="button" variant="secondary" size="sm">
                    {data.security.twoFactor.actionLabel}
                  </DashboardButton>
                </div>
              </SettingsPanel>

              <SettingsPanel title="Active Sessions">
                <div className="space-y-3">
                  {data.security.sessions.map((session) => (
                    <div
                      key={session.device}
                      className="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--dashboard-border-soft)] px-4 py-4"
                    >
                      <div>
                        <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                          {session.device}
                        </p>
                        <p className="text-sm text-[var(--dashboard-text-soft)]">
                          {session.description}
                        </p>
                      </div>

                      {session.actionLabel ? (
                        <button
                          type="button"
                          className={cn(
                            "text-sm font-medium",
                            session.destructive
                              ? "text-[var(--dashboard-danger)]"
                              : "text-[var(--dashboard-text-strong)]"
                          )}
                        >
                          {session.actionLabel}
                        </button>
                      ) : null}
                    </div>
                  ))}
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
          type={password ? "password" : "text"}
          readOnly
          value={field.value}
          placeholder={password ? "" : undefined}
          className={cn(
            dashboardInputVariants({ size: "lg" }),
            "border-0 shadow-none focus-visible:ring-0",
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
