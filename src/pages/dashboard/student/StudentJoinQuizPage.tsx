import { BookOpen, Hash, Timer } from "lucide-react";
import { cn } from "../../../components/ui/utils";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardIconTextRowClassName,
  dashboardInputVariants,
  dashboardPageNarrowClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { studentJoinAssignments } from "../../../features/dashboard/mock/studentWorkspace";

export function StudentJoinQuizPage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageNarrowClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Join a Quiz"}
        subtitle="Enter the quiz code provided by your teacher or select from assigned quizzes"
        align="center"
      />

      <DashboardSurface asChild radius="xl" padding="lg">
        <section>
          <div className="mx-auto max-w-[420px] text-center">
            <div
              className={cn(
                dashboardIconChipVariants({ tone: "brand", size: "xl" }),
                "mx-auto rounded-full",
              )}
            >
              <Hash className="h-9 w-9" />
            </div>
            <h2 className="mt-5 text-[2rem] font-medium text-[var(--dashboard-text-strong)]">
              Enter Quiz Code
            </h2>
            <p className="mt-2 text-[1rem] text-[var(--dashboard-text-soft)]">
              Your teacher will provide you with a unique code
            </p>

            <div className="mt-7 flex justify-center gap-2.5">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className={dashboardInputVariants({ size: "otp" })}
                />
              ))}
            </div>

            <DashboardButton type="button" size="lg" className="mt-6 w-full">
              Join Quiz
            </DashboardButton>
          </div>
        </section>
      </DashboardSurface>

      <div className="flex items-center gap-4 py-2 text-sm text-[var(--dashboard-text-soft)]">
        <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
        or select from assigned quizzes
        <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
      </div>

      <div className="space-y-4">
        {studentJoinAssignments.map((assignment) => (
          <DashboardSurface asChild key={assignment.title} radius="lg" padding="md">
            <article>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[1.25rem] font-semibold text-[var(--dashboard-text-strong)]">
                    {assignment.title}
                  </h3>
                  <p className="mt-2 text-[1rem] text-[var(--dashboard-text-soft)]">
                    {assignment.teacher}
                  </p>
                </div>
                <DashboardBadge tone="warning" size="md">
                  {assignment.dueDate}
                </DashboardBadge>
              </div>

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-[var(--dashboard-text-soft)]">
                <span className={dashboardIconTextRowClassName}>
                  <BookOpen className="h-4 w-4" />
                  {assignment.questions}
                </span>
                <span className={dashboardIconTextRowClassName}>
                  <Timer className="h-4 w-4" />
                  {assignment.duration}
                </span>
              </div>

              <DashboardButton type="button" size="lg" className="mt-5 w-full">
                Start Quiz
                <span className="text-base">{">"}</span>
              </DashboardButton>
            </article>
          </DashboardSurface>
        ))}
      </div>
    </div>
  );
}
