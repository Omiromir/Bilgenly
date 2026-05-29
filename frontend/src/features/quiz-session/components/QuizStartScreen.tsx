import { Link } from "react-router";
import {
  BookOpen,
  Clock3,
  LoaderCircle,
  Play,
  UserRound,
} from "../../../components/icons/AppIcons";
import {
  AssignmentWarning,
  AttemptProgressIndicator,
  AttemptsBadge,
  DeadlineBadge,
  QuizStatusBadge,
} from "../../assignments/AssignmentControls";
import type { AssignedQuizAvailability } from "../../assignments/assignedQuizAvailability";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconTextRowClassName,
} from "../../dashboard/components/DashboardPrimitives";
import type {
  QuizAssignmentContext,
  QuizRecord,
} from "../../dashboard/components/quiz-library/quizLibraryTypes";
import type { QuizSessionRecord } from "../quizSessionTypes";
import {
  formatQuizAttemptDate,
  formatQuizPoints,
  formatQuizScore,
  getQuizSessionResultSummary,
  getSubmittedQuestionCount,
} from "../quizSessionUtils";

interface QuizStartScreenProps {
  quiz: QuizRecord;
  assignmentContext?: QuizAssignmentContext;
  assignmentConstraints?: AssignedQuizAvailability | null;
  latestInProgressSession?: QuizSessionRecord;
  latestCompletedSession?: QuizSessionRecord;
  isStarting?: boolean;
  isResuming?: boolean;
  onStart?: () => void;
  onResume?: () => void;
  onReviewLatest?: () => void;
  backLink?: {
    path: string;
    label: string;
    state?: unknown;
  };
}

export function QuizStartScreen({
  quiz,
  assignmentContext,
  assignmentConstraints,
  latestInProgressSession,
  latestCompletedSession,
  isStarting = false,
  isResuming = false,
  onStart,
  onResume,
  onReviewLatest,
  backLink,
}: QuizStartScreenProps) {
  const latestResult = latestCompletedSession
    ? getQuizSessionResultSummary(latestCompletedSession)
    : null;
  const inProgressAnsweredCount = latestInProgressSession
    ? getSubmittedQuestionCount(latestInProgressSession)
    : 0;
  const nextAttemptNumber =
    assignmentConstraints?.activeAttempt?.attemptNumber ??
    (assignmentConstraints?.attemptsUsed ?? 0) + 1;
  const startLabel = assignmentConstraints?.maxAttempts
    ? `Start Attempt ${nextAttemptNumber} of ${assignmentConstraints.maxAttempts}`
    : `Start Attempt ${nextAttemptNumber}`;

  return (
    <div className="space-y-6">
      <DashboardSurface
        radius="xl"
        padding="lg"
        className="space-y-6 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardBadge tone="brand">
                {assignmentContext ? "Assigned quiz" : "Practice mode"}
              </DashboardBadge>
              <DashboardBadge tone="info">
                {quiz.visibility === "public" ? "Public quiz" : "Private quiz"}
              </DashboardBadge>
              {assignmentConstraints ? (
                <QuizStatusBadge
                  status={assignmentConstraints.status}
                  label={assignmentConstraints.displayStatusLabel}
                />
              ) : null}
              {assignmentContext ? (
                <DeadlineBadge
                  deadline={assignmentContext.deadline}
                  expired={assignmentConstraints?.deadlinePassed}
                />
              ) : null}
              {assignmentConstraints ? (
                <AttemptsBadge
                  attemptsUsed={assignmentConstraints.attemptsUsed}
                  maxAttempts={assignmentConstraints.maxAttempts}
                  isLoading={assignmentConstraints.isLoading}
                />
              ) : null}
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
                {assignmentContext
                  ? `${assignmentContext.className} assigned by ${assignmentContext.assignedByName}`
                  : quiz.sourceLabel}
              </p>
              <h1 className="mt-2 text-[2.4rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
                {quiz.title}
              </h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                {quiz.description}
              </p>
            </div>
          </div>

          {latestResult ? (
            <div className="rounded-[22px] border border-[var(--dashboard-brand-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
              <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
                Latest result
              </p>
              <p className="mt-2 text-[2rem] font-semibold text-[var(--dashboard-brand)]">
                {formatQuizScore(latestResult.percentage)}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {formatQuizPoints(
                  latestResult.earnedPoints,
                  latestResult.totalPoints,
                )} earned on{" "}
                {formatQuizAttemptDate(
                  latestCompletedSession?.finishedAt ??
                    latestCompletedSession?.updatedAt ??
                    "",
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
            <p className={dashboardIconTextRowClassName}>
              <BookOpen className="h-4 w-4" />
              Questions
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold text-[var(--dashboard-text-strong)]">
              {quiz.questions.length}
            </p>
          </div>
          <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
            <p className={dashboardIconTextRowClassName}>
              <Clock3 className="h-4 w-4" />
              Estimated time
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold text-[var(--dashboard-text-strong)]">
              {quiz.durationMinutes} min
            </p>
          </div>
          <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
            <p className={dashboardIconTextRowClassName}>
              <UserRound className="h-4 w-4" />
              Creator
            </p>
            <p className="mt-3 text-[1.5rem] font-semibold text-[var(--dashboard-text-strong)]">
              {quiz.ownerName}
            </p>
          </div>
        </div>

        {assignmentContext ? (
          <div className="space-y-4 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              Class instructions
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-soft)]">
              Complete this assigned quiz one question at a time. Feedback appears after each submitted answer so you can learn before moving on.
            </p>
            {assignmentConstraints ? (
              <AttemptProgressIndicator
                attemptsUsed={assignmentConstraints.attemptsUsed}
                maxAttempts={assignmentConstraints.maxAttempts}
                status={assignmentConstraints.status}
                isLoading={assignmentConstraints.isLoading}
              />
            ) : null}
          </div>
        ) : null}

        {latestInProgressSession && assignmentConstraints?.canResume ? (
          <div className="rounded-[22px] border border-[var(--dashboard-warning-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              Resume available
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-soft)]">
              You already have an in-progress attempt with {inProgressAnsweredCount} of{" "}
              {quiz.questions.length} questions answered.
            </p>
          </div>
        ) : null}

        {assignmentConstraints?.status === "expired" ? (
          <AssignmentWarning>
            Deadline passed. You can review past results, but you cannot start a new attempt now.
          </AssignmentWarning>
        ) : null}

        {assignmentConstraints?.status === "attempts_exhausted" ? (
          <AssignmentWarning>
            No attempts remaining. Review your latest result or ask your teacher if you need another attempt.
          </AssignmentWarning>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {latestInProgressSession && onResume && assignmentConstraints?.canResume ? (
            <DashboardButton
              type="button"
              size="lg"
              onClick={onResume}
              disabled={isResuming}
            >
              {isResuming ? (
                <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
              ) : null}
              {isResuming
                ? "Resuming..."
                : `Resume Attempt ${latestInProgressSession.attemptNumber}`}
            </DashboardButton>
          ) : null}

          {!latestInProgressSession && onStart ? (
            <DashboardButton
              type="button"
              size="lg"
              onClick={onStart}
              disabled={assignmentConstraints?.isLoading || isStarting}
            >
              {isStarting ? (
                <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Play className="h-4.5 w-4.5" />
              )}
              {isStarting
                ? "Starting..."
                : assignmentConstraints?.isLoading
                  ? "Checking attempts..."
                  : assignmentConstraints
                    ? startLabel
                    : "Start Quiz"}
            </DashboardButton>
          ) : null}

          {!latestInProgressSession && !onStart && assignmentConstraints ? (
            <DashboardButton type="button" size="lg" variant="secondary" disabled>
              {assignmentConstraints.isLoading
                ? "Checking attempts..."
                : assignmentConstraints.status === "expired"
                ? "Deadline Passed"
                : "No Attempts Remaining"}
            </DashboardButton>
          ) : null}

          {latestCompletedSession && onReviewLatest ? (
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={onReviewLatest}
            >
              Review Latest Result
            </DashboardButton>
          ) : null}

          {backLink ? (
            <DashboardButton asChild type="button" size="lg" variant="ghost">
              <Link to={backLink.path} state={backLink.state}>
                {backLink.label}
              </Link>
            </DashboardButton>
          ) : null}
        </div>
      </DashboardSurface>
    </div>
  );
}
