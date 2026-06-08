import { Link } from "react-router";
import {
  Clock3,
  LoaderCircle,
  RotateCcw,
  Trophy,
} from "../../../components/icons/AppIcons";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconTextRowClassName,
} from "../../dashboard/components/DashboardPrimitives";
import type { QuizSessionRecord } from "../quizSessionTypes";
import {
  formatQuizAttemptDuration,
  formatQuizScore,
  getQuizSessionResultSummary,
} from "../quizSessionUtils";

interface QuizResultsSummaryProps {
  session: QuizSessionRecord;
  onRetake?: () => void;
  
  isRetaking?: boolean;
  returnLink?: {
    path: string;
    label: string;
    state?: unknown;
  };
  secondaryLink?: {
    path: string;
    label: string;
  };
}

export function QuizResultsSummary({
  session,
  onRetake,
  isRetaking = false,
  returnLink,
  secondaryLink,
}: QuizResultsSummaryProps) {
  const result = getQuizSessionResultSummary(session);

  return (
    <DashboardSurface
      radius="xl"
      padding="lg"
      className="space-y-6 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <DashboardBadge tone="brand">
            {session.assignmentContext ? "Assigned quiz complete" : "Quiz complete"}
          </DashboardBadge>
          <h1 className="mt-3 text-[2.35rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            {session.quiz.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
            {session.completionReason === "deadline-expired"
              ? "This attempt was submitted automatically when the assignment deadline passed. Review the summary below, then look through each answer to see what still needs attention."
              : session.completionReason === "time-limit-reached"
                ? "Time ran out — your answered questions were submitted automatically. Unanswered questions count as missed. Review the summary below."
                : "You finished the quiz. Review the summary below, then look through each answer to understand what went well and what needs more practice."}
          </p>
        </div>

        <div className="rounded-[24px] border border-[var(--dashboard-brand-soft)] bg-[var(--dashboard-surface-elevated)] px-6 py-5 text-center">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
            Final score
          </p>
          <p className="mt-2 text-[2.4rem] font-semibold text-[var(--dashboard-brand)]">
            {formatQuizScore(result.percentage)}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {result.earnedPoints}/{result.totalPoints} points earned
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
            Points earned
          </p>
          <p className="mt-3 text-[1.6rem] font-semibold text-[var(--dashboard-text-strong)]">
            {result.earnedPoints}
          </p>
        </div>
        <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
            Points remaining
          </p>
          <p className="mt-3 text-[1.6rem] font-semibold text-[var(--dashboard-text-strong)]">
            {Math.max(result.totalPoints - result.earnedPoints, 0)}
          </p>
        </div>
        <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
            Time spent
          </p>
          <p className="mt-3 text-[1.6rem] font-semibold text-[var(--dashboard-text-strong)]">
            {formatQuizAttemptDuration(session)}
          </p>
        </div>
      </div>

      <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
        <p className={dashboardIconTextRowClassName}>
          <Clock3 className="h-4 w-4" />
          Results overview
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--dashboard-text-soft)]">
          Immediate feedback is designed to help you learn as you go. Use the review list below to revisit explanations, especially on the questions you missed or the points you want to recover on your next attempt.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onRetake ? (
          <DashboardButton
            type="button"
            size="lg"
            onClick={onRetake}
            disabled={isRetaking}
          >
            {isRetaking ? (
              <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <RotateCcw className="h-4.5 w-4.5" />
            )}
            {isRetaking
              ? "Opening…"
              : session.assignmentContext
                ? "Open Assigned Quiz"
                : "Retake Quiz"}
          </DashboardButton>
        ) : null}

        {returnLink ? (
          <DashboardButton asChild type="button" size="lg" variant="secondary">
            <Link to={returnLink.path} state={returnLink.state}>
              {returnLink.label}
            </Link>
          </DashboardButton>
        ) : null}

        {secondaryLink ? (
          <DashboardButton asChild type="button" size="lg" variant="ghost">
            <Link to={secondaryLink.path}>
              <Trophy className="h-4.5 w-4.5" />
              {secondaryLink.label}
            </Link>
          </DashboardButton>
        ) : null}
      </div>
    </DashboardSurface>
  );
}
