import { Medal, Trophy } from "lucide-react";
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
  studentLeaderboard,
} from "../../../features/dashboard/mock/studentWorkspace";

export function StudentBadgesPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Achievements"}
        subtitle={meta?.subtitle ?? "Track your achievements and progress in class"}
      />

      <CtaPanel
        title="Your Rank: #3"
        description="You're in the top 15% of all students. Keep up the great work."
        variant="gradient"
        aside={
          <div className="hidden h-40 w-40 items-center justify-center rounded-[28px] bg-white/12 lg:flex">
            <Trophy className="h-20 w-20 text-white/85" />
          </div>
        }
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
          0 of 50 earned
        </div>

        <DashboardSurface
          variant="muted"
          radius="md"
          padding="sm"
          className="border-dashed border-[var(--dashboard-border-soft)]"
        >
          <div className="py-8 text-center">
            <p className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
              No badges yet
            </p>
          </div>
        </DashboardSurface>
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
