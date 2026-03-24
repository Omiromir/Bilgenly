import { BookOpen, Play } from "lucide-react";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  studentPracticeRecommendations,
  studentPracticeTopics,
} from "../../../features/dashboard/mock/studentWorkspace";

const difficultyTone = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
} as const;

export function StudentPracticePage() {
  const meta = useDashboardPageMeta();

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Practice Mode"}
        subtitle="Strengthen your skills with unlimited practice on any topic"
      />

      <DashboardSurface asChild radius="lg" padding="none">
        <section>
          <div className="border-b border-[var(--dashboard-border-soft)] px-6 py-5">
          <h2 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
            Recommended for You
          </h2>
          </div>
          <div className="grid gap-4 p-6 xl:grid-cols-3">
          {studentPracticeRecommendations.map((item) => (
            <DashboardSurface
              asChild
              key={item.title}
              radius="md"
              padding="sm"
            >
              <article>
              <h3 className="text-[1.12rem] font-semibold text-[var(--dashboard-text-strong)]">
                {item.title}
              </h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--dashboard-text-soft)]">
                <DashboardBadge tone={difficultyTone[item.difficulty]}>
                  {item.difficulty}
                </DashboardBadge>
                {item.questions}
              </div>
              <p className="mt-3 text-sm text-[var(--dashboard-text-soft)]">{item.note}</p>
                <DashboardButton type="button" size="lg" className="mt-4 w-full">
                  <Play className="h-4 w-4" />
                  Start Practice
                </DashboardButton>
              </article>
            </DashboardSurface>
          ))}
          </div>
        </section>
      </DashboardSurface>

      <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2">
        {studentPracticeTopics.map((topic) => (
          <DashboardSurface
            asChild
            key={topic.title}
            radius="lg"
            padding="md"
          >
            <article>
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: topic.accent }}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[var(--dashboard-success-soft)] px-3 py-1 text-xs font-medium text-[var(--dashboard-success)]">
                {topic.mastery}
              </span>
            </div>

            <h3 className="mt-6 text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
              {topic.title}
            </h3>

            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>{topic.quizCount}</span>
              <span>{topic.totalQuestions}</span>
            </div>

            <div className="mt-3 h-2.5 rounded-full bg-[var(--dashboard-border)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: topic.progressWidth,
                  backgroundColor: topic.accent,
                }}
              />
            </div>

              <DashboardButton type="button" size="lg" className="mt-5 w-full">
              <Play className="h-4 w-4" />
              Practice Now
              </DashboardButton>
            </article>
          </DashboardSurface>
        ))}
      </div>
    </div>
  );
}
