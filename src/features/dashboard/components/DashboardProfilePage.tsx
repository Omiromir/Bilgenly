import {
  BookOpen,
  CalendarDays,
  Camera,
  Clock3,
  type LucideIcon,
  Mail,
  MapPin,
  Medal,
  TrendingUp,
} from "lucide-react";
import { DashboardPageHeader } from "./DashboardPageHeader";
import { cn } from "../../../components/ui/utils";
import type {
  ProfileStat,
  ProfileSummary,
} from "../mock/sharedUi";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardMetaTextClassName,
  dashboardPageClassName,
  dashboardSectionDividerClassName,
} from "./DashboardPrimitives";

interface DashboardProfilePageProps {
  title: string;
  subtitle: string;
  profile: ProfileSummary;
}

export function DashboardProfilePage({
  title,
  subtitle,
  profile,
}: DashboardProfilePageProps) {
  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader title={title} subtitle={subtitle} />

      <DashboardSurface asChild radius="lg" padding="none" className="overflow-hidden">
        <section>
          <div
            className="relative h-[116px] px-4 py-4 sm:px-6"
            style={{ background: "var(--dashboard-gradient)" }}
          >
            <DashboardButton
              type="button"
              variant="hero"
              size="sm"
              className="absolute right-4 top-4 backdrop-blur"
            >
              <Camera className="h-4 w-4" />
              Edit Cover
            </DashboardButton>
          </div>

          <div className="px-5 pb-6 sm:px-6">
            <div className="-mt-12 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-5 md:flex-row md:items-start">
                <div className="relative h-[108px] w-[108px] shrink-0 rounded-full bg-white p-1 shadow-sm shadow-slate-300/50">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[40px] font-semibold text-[var(--dashboard-brand)]">
                    {profile.initials}
                  </div>
                  <DashboardButton
                    type="button"
                    size="iconSm"
                    className="absolute bottom-2 right-1"
                  >
                    <Camera className="h-4 w-4" />
                  </DashboardButton>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
                      {profile.name}
                    </h2>
                    <p className="text-lg text-[var(--dashboard-text-soft)]">{profile.roleLabel}</p>
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-[var(--dashboard-text-soft)] md:flex-row md:flex-wrap md:gap-x-10">
                    <InfoLine icon={Mail} text={profile.email} />
                    <InfoLine icon={CalendarDays} text={profile.joinedLabel} />
                    <InfoLine icon={MapPin} text={profile.location} />
                  </div>
                </div>
              </div>

              <DashboardButton type="button" size="lg" className="self-start">
                Edit Profile
              </DashboardButton>
            </div>

            <div className={cn("mt-6 border-t pt-5", dashboardSectionDividerClassName)}>
              <h3 className="text-[1.55rem] font-semibold text-[var(--dashboard-text-strong)]">Bio</h3>
              <p className="mt-2 max-w-4xl text-[17px] leading-8 text-[var(--dashboard-text-soft)]">
                {profile.bio}
              </p>
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
                  key={`${item.title}-${item.time}`}
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
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--dashboard-text-faint)]" />
      {text}
    </span>
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
