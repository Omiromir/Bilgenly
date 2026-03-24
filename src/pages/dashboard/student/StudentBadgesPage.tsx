import { Flame, Medal, Target, Trophy, Zap } from "lucide-react";
import { CtaPanel } from "../../../features/dashboard/components/CtaPanel";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardSurface,
  dashboardPageClassName,
  dashboardSelectVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  studentBadgeSummary,
  studentBadges,
  studentLeaderboard,
} from "../../../features/dashboard/mock/studentWorkspace";

const badgeIcons = [Zap, Target, Flame, Trophy, Zap, Medal] as const;

export function StudentBadgesPage() {
  const meta = useDashboardPageMeta();
  const earnedBadges = studentBadges.filter((badge) => badge.earnedAt);
  const progressBadges = studentBadges.filter((badge) => badge.progress);

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Badges & Leaderboard"}
        subtitle="Track your achievements and compete with peers"
      />

      <CtaPanel
        title="Your Rank: #3"
        description="You're in the top 15% of all students. Keep up the great work."
        variant="gradient"
        aside={<Trophy className="hidden h-20 w-20 text-white/85 lg:block" />}
        actions={
          <div className="grid gap-10 text-white sm:grid-cols-3">
            {studentBadgeSummary.map((item) => (
              <div key={item.label}>
                <p className="text-sm text-white/80">{item.label}</p>
                <p className="mt-1 text-[2rem] font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        }
      />

      <SectionCard title="Your Badges">
        <div className="flex justify-end pb-5 text-sm text-slate-500">
          12 of 50 earned
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {earnedBadges.map((badge, index) => {
            const Icon = badgeIcons[index];

            return (
              <DashboardSurface
                asChild
                key={badge.name}
                variant="muted"
                radius="md"
                padding="sm"
                className="border-[var(--dashboard-warning)]/20"
              >
                <article>
                <div className="flex items-start justify-between gap-3">
                  <Icon
                    className="h-9 w-9"
                    style={{ color: badge.accent ?? "#F59E0B" }}
                  />
                  <Medal className="h-4 w-4 text-[var(--dashboard-warning)]" />
                </div>
                <h3 className="mt-5 text-[1.1rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {badge.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{badge.detail}</p>
                <p className="mt-4 text-xs font-medium text-[var(--dashboard-success)]">
                  {badge.earnedAt}
                </p>
                </article>
              </DashboardSurface>
            );
          })}

          {progressBadges.map((badge, index) => {
            const Icon = badgeIcons[index + earnedBadges.length];

            return (
              <DashboardSurface
                asChild
                key={badge.name}
                radius="md"
                padding="sm"
              >
                <article>
                <Icon
                  className="h-9 w-9"
                  style={{ color: badge.accent ?? "#F59E0B" }}
                />
                <h3 className="mt-5 text-[1.1rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {badge.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{badge.detail}</p>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{badge.progress}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: badge.progress === "24/50" ? "48%" : "85%",
                        backgroundColor: badge.accent ?? "#F59E0B",
                      }}
                    />
                  </div>
                </div>
                </article>
              </DashboardSurface>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Class Leaderboard"
        actions={
          <select className={dashboardSelectVariants({ size: "sm" })}>
            <option>All Classes</option>
          </select>
        }
      >

        <div className="space-y-4">
          {studentLeaderboard.map((entry, index) => (
            <DashboardSurface asChild key={entry.name} radius="md" padding="sm">
              <article className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dashboard-warning)] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--dashboard-text-strong)]">{entry.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[1.8rem] font-semibold text-[var(--dashboard-success)]">
                  {entry.score}
                </span>
                <Medal className="h-5 w-5 text-[var(--dashboard-success)]" />
              </div>
              </article>
            </DashboardSurface>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
