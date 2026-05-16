import {
  BookOpen,
  CalendarDays,
  Clock3,
  type LucideIcon,
  Mail,
  MapPin,
  Medal,
  TrendingUp,
} from "../../../components/icons/AppIcons";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../components/ui/utils";
import { useProfile } from "../hooks/useProfile";
import {
  STATIC_AVATAR_OPTIONS,
  resolveAvatarUrl,
} from "../../profile/avatars";
import { SETTINGS_COUNTRY_OPTIONS } from "../settings/settingsPreferences";
import type {
  ProfileStat,
} from "../profile/profileTypes";
import { DashboardPageHeader } from "./DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardInputVariants,
  dashboardMetaTextClassName,
  dashboardPageClassName,
  dashboardSectionDividerClassName,
  dashboardTextareaVariants,
} from "./DashboardPrimitives";

interface DashboardProfilePageProps {
  title: string;
  subtitle: string;
}

export function DashboardProfilePage({
  title,
  subtitle,
}: DashboardProfilePageProps) {
  const {
    profile,
    formValues,
    formErrors,
    isEditing,
    isSaving,
    canSave,
    startEditing,
    cancelEditing,
    saveProfile,
    updateField,
    selectStaticAvatar,
  } = useProfile();

  if (!profile) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader title={title} subtitle={subtitle} />
      </div>
    );
  }

  const resolvedAvatarUrl = resolveAvatarUrl(formValues.avatarUrl);
  const displayInitials = formValues.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader title={title} subtitle={subtitle} />

      <DashboardSurface asChild radius="lg" padding="none" className="overflow-hidden">
        <section>
          <div
            className="relative h-[116px] px-4 py-4 sm:px-6"
            style={{ background: "var(--dashboard-gradient)" }}
          />

          <div className="px-5 pb-6 sm:px-6">
            <div className="flex flex-col gap-6 pt-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex flex-col gap-5 md:flex-row md:items-start">
                <div className="-mt-16 relative h-[108px] w-[108px] shrink-0 rounded-full bg-[var(--dashboard-surface-elevated)] p-1 shadow-[var(--dashboard-shadow-card)] ring-1 ring-[var(--dashboard-border-soft)]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--dashboard-surface)] text-[40px] font-semibold text-[var(--dashboard-brand)]">
                    {resolvedAvatarUrl ? (
                      <img
                        src={resolvedAvatarUrl}
                        alt={`${profile.name} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      displayInitials || profile.initials
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-4 pt-1 md:pt-5">
                  <div className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={formValues.fullName}
                          onChange={(event) =>
                            updateField("fullName", event.target.value.slice(0, 40))
                          }
                          maxLength={40}
                          aria-invalid={Boolean(formErrors.fullName)}
                          className={cn(
                            dashboardInputVariants({ size: "lg" }),
                            "h-14 rounded-[18px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 text-[2rem] font-semibold tracking-tight shadow-none focus-visible:ring-0",
                          )}
                        />
                        {formErrors.fullName ? (
                          <p className="text-sm text-[var(--dashboard-danger)]">
                            {formErrors.fullName}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <h2 className="break-words text-[2rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
                        {profile.name}
                      </h2>
                    )}
                    <p className="text-lg text-[var(--dashboard-text-soft)]">
                      {profile.roleLabel}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-[var(--dashboard-text-soft)] md:flex-row md:flex-wrap md:gap-x-10">
                    {isEditing ? (
                      <>
                        {/* Email is intentionally read-only — changing email
                            would require re-verification flow that the backend
                            doesn't support yet. */}
                        <InfoLine icon={Mail} text={profile.email} />
                        <InfoLine icon={CalendarDays} text={profile.joinedLabel} />
                        <EditableSelectInfoLine
                          icon={MapPin}
                          value={formValues.location}
                          label="Country"
                          options={SETTINGS_COUNTRY_OPTIONS}
                          onChange={(value) =>
                            updateField("location", value)
                          }
                          error={formErrors.location}
                        />
                      </>
                    ) : (
                      <>
                        <InfoLine icon={Mail} text={profile.email} />
                        <InfoLine icon={CalendarDays} text={profile.joinedLabel} />
                        <InfoLine icon={MapPin} text={profile.location} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="flex flex-wrap gap-3 self-start">
                  <DashboardButton
                    type="button"
                    size="lg"
                    variant="secondary"
                    onClick={cancelEditing}
                    disabled={isSaving}
                  >
                    Cancel
                  </DashboardButton>
                  <DashboardButton
                    type="button"
                    size="lg"
                    onClick={() => void saveProfile()}
                    disabled={!canSave}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </DashboardButton>
                </div>
              ) : (
                <DashboardButton type="button" size="lg" className="self-start" onClick={startEditing}>
                  Edit Profile
                </DashboardButton>
              )}
            </div>

            {isEditing ? (
              <div className={cn("mt-6 border-t pt-5", dashboardSectionDividerClassName)}>
                <h3 className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                  Choose your avatar
                </h3>
                <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                  Pick one of the four preset avatars.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {STATIC_AVATAR_OPTIONS.map((option) => {
                    const isSelected = formValues.avatarUrl === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => selectStaticAvatar(option.id)}
                        aria-pressed={isSelected}
                        aria-label={option.label}
                        className={cn(
                          "h-16 w-16 overflow-hidden rounded-full border-2 transition",
                          isSelected
                            ? "border-[var(--dashboard-brand)] ring-2 ring-[var(--dashboard-brand)]/40"
                            : "border-[var(--dashboard-border-soft)] hover:border-[var(--dashboard-border)]",
                        )}
                      >
                        <img
                          src={option.src}
                          alt={option.label}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className={cn("mt-6 border-t pt-5", dashboardSectionDividerClassName)}>
              <h3 className="text-[1.55rem] font-semibold text-[var(--dashboard-text-strong)]">Bio</h3>
              {isEditing ? (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={formValues.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    aria-invalid={Boolean(formErrors.bio)}
                    className={cn(
                      dashboardTextareaVariants({ size: "md" }),
                      "min-h-[132px] rounded-[22px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4 text-[17px] leading-8 shadow-none focus-visible:ring-0",
                    )}
                  />
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--dashboard-text-faint)]">
                      {formValues.bio.trim().length}/280
                    </span>
                    {formErrors.bio ? (
                      <span className="text-[var(--dashboard-danger)]">{formErrors.bio}</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-2 max-w-4xl text-[17px] leading-8 text-[var(--dashboard-text-soft)]">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </section>
      </DashboardSurface>

      <div className="grid gap-5 xl:grid-cols-4">
        {profile.stats.map((stat) => (
          <ProfileStatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSurface asChild radius="lg" padding="none" className="overflow-hidden">
          <section>
            <div className={cn("border-b px-5 py-4 sm:px-6", dashboardSectionDividerClassName)}>
              <h3 className="text-[1.55rem] font-semibold text-[var(--dashboard-text-strong)]">
                Recent Activity
              </h3>
            </div>

            <div className="px-5 py-3 sm:px-6">
              {profile.activity.map((item, index) => (
                <div
                  key={`${item.title}-${item.time}-${index}`}
                  className={cn(
                    "flex gap-4 py-5",
                    index < profile.activity.length - 1 &&
                      "border-b border-[var(--dashboard-border-soft)]",
                  )}
                >
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--dashboard-brand)]" />
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                      {item.title}
                    </p>
                    <p className="text-[15px] text-[var(--dashboard-text-soft)]">
                      {item.description}
                    </p>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-faint)]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </DashboardSurface>

        <DashboardSurface asChild radius="lg" padding="none" className="overflow-hidden">
          <section>
            <div className={cn("border-b px-5 py-4 sm:px-6", dashboardSectionDividerClassName)}>
              <h3 className="text-[1.55rem] font-semibold text-[var(--dashboard-text-strong)]">
                Personal Information
              </h3>
            </div>

            <div className="space-y-5 px-5 py-6 sm:px-6">
              {profile.personalInfo.map((field) => (
                <div key={field.label}>
                  <p className={dashboardMetaTextClassName}>{field.label}</p>
                  <p className="mt-1 text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </DashboardSurface>
      </div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-[var(--dashboard-text-faint)]" />
      <span className="break-words">{text}</span>
    </span>
  );
}

function EditableSelectInfoLine({
  icon: Icon,
  value,
  error,
  label,
  options,
  onChange,
}: {
  icon: LucideIcon;
  value: string;
  error?: string;
  label: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="inline-flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--dashboard-text-faint)]" />
        <div className="relative min-w-[220px]">
          <select
            value={value}
            aria-label={label}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            className={cn(
              dashboardInputVariants({ size: "sm" }),
              "h-9 w-full appearance-none rounded-[12px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-3 pr-8 shadow-none focus-visible:ring-0",
            )}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </span>
      {error ? <p className="pl-6 text-sm text-[var(--dashboard-danger)]">{error}</p> : null}
    </label>
  );
}

function ProfileStatCard({ stat }: { stat: ProfileStat }) {
  const Icon = getStatIcon(stat.icon);

  return (
    <DashboardSurface asChild radius="lg" padding="sm">
      <article>
        <div className="flex items-center gap-3">
          <div className={dashboardIconChipVariants({ tone: "brand", size: "md" })}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
            {stat.label}
          </p>
        </div>
        <p className="mt-4 text-[2.2rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
          {stat.value}
        </p>
      </article>
    </DashboardSurface>
  );
}

function getStatIcon(icon: ProfileStat["icon"]) {
  switch (icon) {
    case "badge":
      return Medal;
    case "trend":
      return TrendingUp;
    case "clock":
      return Clock3;
    case "book":
    default:
      return BookOpen;
  }
}
