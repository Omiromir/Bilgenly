import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Layers3,
  Rocket,
  TrendingUp,
  Users,
} from "../../../../components/icons/AppIcons";
import { cn } from "../../../../components/ui/utils";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconTextRowClassName,
} from "../DashboardPrimitives";
import type { RecentQuizOverviewItem } from "./teacherOverviewData";

interface RecentQuizzesListProps {
  quizzes: RecentQuizOverviewItem[];
  onViewDetails: (quiz: RecentQuizOverviewItem) => void;
  onEdit: (quiz: RecentQuizOverviewItem) => void;
  onAssign: (quiz: RecentQuizOverviewItem) => void;
}

interface CompactMetricProps {
  icon: typeof BookOpen;
  label: string;
  value: string;
  toneClassName?: string;
}

function getQuizStatusBadge(quiz: RecentQuizOverviewItem) {
  if (quiz.needsReviewCount > 0) {
    return <DashboardBadge tone="warning">Needs intervention</DashboardBadge>;
  }

  if (quiz.inProgressCount > 0 || quiz.notStartedCount > 0) {
    return <DashboardBadge tone="info">Live assigned quiz</DashboardBadge>;
  }

  if (quiz.assignedStudentsCount > 0) {
    return <DashboardBadge tone="success">Completed</DashboardBadge>;
  }

  if (quiz.isDraft) {
    return <DashboardBadge tone="neutral">Draft quiz</DashboardBadge>;
  }

  return <DashboardBadge tone="neutral">Ready for assigned quiz</DashboardBadge>;
}

function CompactMetric({
  icon: Icon,
  label,
  value,
  toneClassName,
}: CompactMetricProps) {
  return (
    <div className="flex min-w-[120px] items-center gap-3 rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-3.5 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-brand)] shadow-[0_6px_18px_rgba(18,32,58,0.08)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dashboard-text-faint)]">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-sm font-semibold text-[var(--dashboard-text-strong)]",
            toneClassName,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function RecentQuizzesList({
  quizzes,
  onViewDetails,
  onEdit,
  onAssign,
}: RecentQuizzesListProps) {
  if (!quizzes.length) {
    return (
      <EmptyStateBlock
        title="No recent quizzes yet"
        description="Create or assign a quiz and this section will start showing live assigned-quiz progress automatically."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <DashboardSurface
          asChild
          key={quiz.quizId}
          radius="md"
          padding="sm"
        >
          <article className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                    {quiz.title}
                  </h3>
                  {getQuizStatusBadge(quiz)}
                </div>
                <div className="flex flex-wrap gap-5 text-sm text-[var(--dashboard-text-soft)]">
                  <span className={dashboardIconTextRowClassName}>
                    <Users className="h-4 w-4" />
                    {quiz.classLabel}
                  </span>
                  <span className={dashboardIconTextRowClassName}>
                    <Layers3 className="h-4 w-4" />
                    {quiz.subjectLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <CompactMetric
                icon={TrendingUp}
                label="Avg grade"
                value={quiz.avgGrade !== null ? `${quiz.avgGrade}%` : "—"}
                toneClassName={
                  quiz.avgGrade === null
                    ? undefined
                    : quiz.avgGrade >= 75
                      ? "text-[var(--dashboard-success)]"
                      : quiz.avgGrade >= 50
                        ? "text-[var(--dashboard-warning)]"
                        : "text-[var(--dashboard-danger)]"
                }
              />
              <CompactMetric
                icon={BookOpen}
                label="Questions"
                value={String(quiz.questionCount)}
              />
              <CompactMetric
                icon={CheckCircle2}
                label="Completed"
                value={`${quiz.completedCount}`}
                toneClassName="text-[var(--dashboard-success)]"
              />
              {quiz.inProgressCount > 0 ? (
                <CompactMetric
                  icon={Clock3}
                  label="In progress"
                  value={`${quiz.inProgressCount} active`}
                  toneClassName="text-[var(--dashboard-brand)]"
                />
              ) : null}
              {quiz.needsReviewCount > 0 ? (
                <CompactMetric
                  icon={AlertCircle}
                  label="Review requests"
                  value={`${quiz.needsReviewCount} students`}
                  toneClassName="text-[var(--dashboard-warning)]"
                />
              ) : null}
              <CompactMetric
                icon={Clock3}
                label="Updated"
                value={quiz.latestActivityLabel}
              />
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-[var(--dashboard-border-soft)] pt-4">
              <DashboardButton
                type="button"
                size="lg"
                className="flex-1 sm:flex-none"
                onClick={() => onViewDetails(quiz)}
              >
                View Details
              </DashboardButton>
              <DashboardButton
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => onEdit(quiz)}
                aria-label={`Edit ${quiz.title}`}
                title={`Edit ${quiz.title}`}
              >
                <FilePenLine className="h-4 w-4" />
              </DashboardButton>
              <DashboardButton
                type="button"
                variant="soft"
                size="lg"
                onClick={() => onAssign(quiz)}
              >
                Assign quiz
              </DashboardButton>
            </div>
          </article>
        </DashboardSurface>
      ))}
    </div>
  );
}
