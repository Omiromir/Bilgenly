import { BookOpen, Medal, Timer } from "lucide-react";
import { Link } from "react-router";
import logoPng from "../../../assets/logo.png";
import { cn } from "../../../components/ui/utils";
import { CtaPanel } from "../../../features/dashboard/components/CtaPanel";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconTextRowClassName,
  dashboardPageClassName,
  dashboardSectionStackClassName,
  dashboardSplitGridClassName,
  dashboardStatsGridClassName,
  dashboardTextToneClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import {
  studentAssignments,
  studentOverviewStats,
  studentResults,
} from "../../../features/dashboard/mock/studentOverview";

const scoreToneClassName = {
  blue: dashboardTextToneClassName.brand,
  emerald: dashboardTextToneClassName.success,
} as const;

export function StudentOverviewPage() {
  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title="Welcome back, Student!"
        subtitle="Keep up the great work on your learning journey."
      />

      <CtaPanel
        title="Continue Your Learning"
        description="You have 3 quizzes assigned. Jump back in and keep your streak going."
        variant="gradient"
        actions={
          <>
            <DashboardButton asChild variant="inverse" size="xl">
              <Link to="/dashboard/student/join-quiz">
                Join Quiz by Code
              </Link>
            </DashboardButton>
            <DashboardButton asChild variant="hero" size="xl">
              <Link to="/dashboard/student/quiz-library">
                Open Quiz Library
              </Link>
            </DashboardButton>
          </>
        }
        aside={
          <div className="hidden h-40 w-40 items-center justify-center rounded-[28px] bg-white/12 lg:flex">
            <img
              src={logoPng}
              alt="Bilgenly"
              className="h-20 w-20 object-contain opacity-95"
            />
          </div>
        }
      />

      <div className={dashboardStatsGridClassName}>
        {studentOverviewStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className={dashboardSplitGridClassName}>
        <SectionCard title="Assigned Quizzes">
          <div className={dashboardSectionStackClassName}>
            {studentAssignments.map((assignment) => (
              <DashboardSurface
                asChild
                key={assignment.title}
                radius="md"
                padding="sm"
              >
                <article>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {assignment.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-[var(--dashboard-text-soft)]">
                      <span className={dashboardIconTextRowClassName}>
                        <BookOpen className="h-4 w-4" />
                        {assignment.questionCount}
                      </span>
                      <span className={dashboardIconTextRowClassName}>
                        <Timer className="h-4 w-4" />
                        {assignment.duration}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--dashboard-warning)]">
                    {assignment.dueDate}
                  </span>
                </div>

                  <DashboardButton type="button" size="lg" className="mt-5 w-full">
                    Start Quiz
                  </DashboardButton>
                </article>
              </DashboardSurface>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Results">
          <div className={dashboardSectionStackClassName}>
            {studentResults.map((result, index) => (
              <article
                key={result.title}
                className="flex items-start justify-between gap-4 rounded-[18px] px-3 py-4"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-[var(--dashboard-warning)]">
                    {index < 2 ? (
                      <Medal className="h-5 w-5" />
                    ) : (
                      <span className="inline-block h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[1.12rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {result.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{result.date}</p>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[1.8rem] font-semibold tracking-[-0.03em]",
                    scoreToneClassName[result.scoreTone]
                  )}
                >
                  {result.score}
                </span>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
