import { BookOpen, Clock3, Plus } from "lucide-react";
import { Link } from "react-router";
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
  teacherInsights,
  teacherOverviewStats,
  teacherRecentQuizzes,
} from "../../../features/dashboard/mock/teacherOverview";

const insightToneClassName = {
  blue: dashboardTextToneClassName.brand,
  amber: dashboardTextToneClassName.warning,
  emerald: dashboardTextToneClassName.success,
} as const;

export function TeacherOverviewPage() {
  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title="Welcome back, Professor!"
        subtitle="Here's what's happening with your classes today."
      />

      <CtaPanel
        title="Generate a New Quiz with AI"
        description="Upload your lecture materials or paste text content. Our AI will generate comprehensive quiz questions in under a minute."
        variant="gradient"
        actions={
          <DashboardButton asChild variant="inverse" size="xl">
            <Link to="/dashboard/teacher/generate-quiz">
              <Plus className="h-5 w-5" />
              Create Quiz from PDF
            </Link>
          </DashboardButton>
        }
        aside={<div className="hidden h-40 w-40 rounded-[28px] bg-white/12 lg:block" />}
      />

      <div className={dashboardStatsGridClassName}>
        {teacherOverviewStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className={dashboardSplitGridClassName}>
        <SectionCard title="Recent Quizzes">
          <div className={dashboardSectionStackClassName}>
            {teacherRecentQuizzes.map((quiz) => (
              <DashboardSurface
                asChild
                key={quiz.title}
                radius="md"
                padding="sm"
              >
                <article>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {quiz.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-5 text-sm text-[var(--dashboard-text-soft)]">
                      <span className={dashboardIconTextRowClassName}>
                        <BookOpen className="h-4 w-4" />
                        {quiz.questionCount}
                      </span>
                      <span className={dashboardIconTextRowClassName}>
                        <Clock3 className="h-4 w-4" />
                        {quiz.className}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[var(--dashboard-success)]">
                    {quiz.accuracy}
                  </span>
                </div>

                <div className="mt-5 flex gap-3">
                  <DashboardButton type="button" size="lg" className="flex-1">
                    View Details
                  </DashboardButton>
                  <DashboardButton type="button" variant="secondary" size="lg">
                    Edit
                  </DashboardButton>
                </div>
                </article>
              </DashboardSurface>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Topics Students Struggle With">
          <div className={dashboardSectionStackClassName}>
            {teacherInsights.map((insight) => (
              <DashboardSurface
                asChild
                key={insight.title}
                radius="md"
                padding="sm"
              >
                <article>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {insight.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      {insight.detail}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-lg font-semibold",
                      insightToneClassName[insight.tone]
                    )}
                  >
                    {insight.value}
                  </span>
                </div>
                </article>
              </DashboardSurface>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
