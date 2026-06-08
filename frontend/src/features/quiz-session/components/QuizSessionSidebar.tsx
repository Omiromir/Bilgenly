import {
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "../../../components/icons/AppIcons";
import {
  AttemptProgressIndicator,
  DeadlineBadge,
  QuizStatusBadge,
} from "../../assignments/AssignmentControls";
import type { AssignmentConstraintState } from "../../assignments/assignmentConstraints";
import { cn } from "../../../components/ui/utils";
import {
  DashboardBadge,
  DashboardSurface,
  dashboardBadgeVariants,
  dashboardIconTextRowClassName,
} from "../../dashboard/components/DashboardPrimitives";
import type { QuizSessionRecord } from "../quizSessionTypes";
import { formatCountdown } from "../useQuizTimer";

interface QuizSessionSidebarProps {
  session: QuizSessionRecord;
  assignmentConstraints?: AssignmentConstraintState | null;
  answeredCount: number;
  currentQuestionIndex: number;
  onJumpToQuestion: (questionIndex: number) => void;
  
  revealAnswerKey?: boolean;
  
  timeRemainingSeconds?: number;
  
  totalDurationSeconds?: number;
  
  isTimerWarning?: boolean;
  
  isTimerDanger?: boolean;
}

export function QuizSessionSidebar({
  session,
  assignmentConstraints,
  answeredCount,
  currentQuestionIndex,
  onJumpToQuestion,
  revealAnswerKey = true,
  timeRemainingSeconds,
  totalDurationSeconds,
  isTimerWarning = false,
  isTimerDanger = false,
}: QuizSessionSidebarProps) {
  const unlockedIndex = Math.min(
    answeredCount,
    Math.max(session.quiz.questions.length - 1, 0),
  );

  const answeredCorrectCount = session.questionStates.filter(
    (questionState) => questionState.submitted && questionState.isCorrect,
  ).length;
  const liveAccuracy =
    answeredCount === 0
      ? 0
      : Math.round((answeredCorrectCount / answeredCount) * 100);

  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <DashboardSurface
        radius="xl"
        padding="md"
        className="space-y-3 bg-[linear-gradient(180deg,var(--dashboard-brand)_0%,var(--dashboard-brand-strong)_100%)] text-white shadow-[0_24px_52px_rgba(91,76,240,0.22)]"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
            Quiz
          </p>
          <h2 className="text-[1.3rem] font-semibold leading-tight">
            {session.quiz.title}
          </h2>
          <p className="text-sm leading-6 text-white/78">
            {session.assignmentContext
              ? `${session.assignmentContext.className} assignment`
              : session.sourceLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {assignmentConstraints ? (
            <span className={cn(dashboardBadgeVariants({ tone: "white", size: "md" }))}>
              Attempt {session.attemptNumber}
            </span>
          ) : null}
        </div>
      </DashboardSurface>

      <DashboardSurface radius="xl" padding="md" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
            Time guide
          </p>

          {timeRemainingSeconds !== undefined && totalDurationSeconds !== undefined && totalDurationSeconds > 0 ? (
            
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-[16px] transition-colors",
                    isTimerDanger
                      ? "bg-red-500/15 text-red-500"
                      : isTimerWarning
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand-bright)]",
                  )}
                >
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[1.35rem] font-semibold tabular-nums tracking-tight transition-colors",
                      isTimerDanger
                        ? "text-red-500"
                        : isTimerWarning
                          ? "text-amber-500"
                          : "text-[var(--dashboard-text-strong)]",
                    )}
                  >
                    {formatCountdown(timeRemainingSeconds)}
                  </p>
                  <p
                    className={cn(
                      "text-sm transition-colors",
                      isTimerDanger
                        ? "font-medium text-red-500"
                        : isTimerWarning
                          ? "font-medium text-amber-500"
                          : "text-[var(--dashboard-text-soft)]",
                    )}
                  >
                    {isTimerDanger
                      ? "Hurry up!"
                      : isTimerWarning
                        ? "Time running low"
                        : "Time remaining"}
                  </p>
                </div>
              </div>

              
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--dashboard-border-soft)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width,background-color] duration-500",
                    isTimerDanger
                      ? "bg-red-500"
                      : isTimerWarning
                        ? "bg-amber-500"
                        : "bg-[var(--dashboard-brand)]",
                  )}
                  style={{
                    width: `${Math.round((timeRemainingSeconds / totalDurationSeconds) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand-bright)]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {session.quiz.durationMinutes} min
                </p>
                <p className="text-sm text-[var(--dashboard-text-soft)]">
                  Suggested completion time
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
          <div className={dashboardIconTextRowClassName}>
            <CheckCircle2 className="h-4 w-4 text-[var(--dashboard-brand)]" />
            <span>
              {answeredCount} of {session.quiz.questions.length} answered
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--dashboard-border-soft)]">
            <div
              className="h-full rounded-full bg-[var(--dashboard-brand)] transition-[width] duration-300"
              style={{
                width: `${
                  session.quiz.questions.length === 0
                    ? 0
                    : Math.round(
                        (answeredCount / session.quiz.questions.length) * 100,
                      )
                }%`,
              }}
            />
          </div>
        </div>

        
        {revealAnswerKey && answeredCount > 0 ? (
          <div className="rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className={dashboardIconTextRowClassName}>
                <TrendingUp className="h-4 w-4 text-[var(--dashboard-brand)]" />
                Accuracy
              </span>
              <span className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                {liveAccuracy}%
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--dashboard-text-soft)]">
              {answeredCorrectCount} of {answeredCount} correct so far
            </p>
          </div>
        ) : null}

        {assignmentConstraints ? (
          <div className="space-y-3 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <QuizStatusBadge status={assignmentConstraints.status} />
              <DeadlineBadge
                deadline={assignmentConstraints.deadline}
                expired={assignmentConstraints.deadlinePassed}
              />
            </div>
            <AttemptProgressIndicator
              attemptsUsed={assignmentConstraints.attemptsUsed}
              maxAttempts={assignmentConstraints.maxAttempts}
              status={assignmentConstraints.status}
            />
          </div>
        ) : null}
      </DashboardSurface>

      <DashboardSurface radius="xl" padding="md" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
              Questions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {session.questionStates.map((questionState, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isUnlocked = index <= unlockedIndex;

            return (
              <button
                key={`${session.id}-${questionState.questionId}`}
                type="button"
                disabled={!isUnlocked}
                onClick={() => onJumpToQuestion(index)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-[12px] text-sm font-semibold transition",
                  isCurrent
                    ? "border border-[var(--dashboard-brand-bright)] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-brand-bright)] shadow-[0_10px_24px_rgba(33,145,246,0.18)]"
                    : questionState.submitted
                      ? revealAnswerKey
                        ? questionState.isCorrect
                          ? "bg-[linear-gradient(180deg,var(--dashboard-success)_0%,#228a57_100%)] text-white"
                          : "bg-[var(--dashboard-danger)] text-white"
                        :
                          "bg-[var(--dashboard-brand)] text-white"
                      : isUnlocked
                        ? "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand-bright)] hover:bg-[var(--dashboard-surface-accent)]"
                        : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-faint)]",
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        

      
      </DashboardSurface>
    </aside>
  );
}
