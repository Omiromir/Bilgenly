import {
  BookOpen,
  CheckCircle2,
  Clock3,
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

interface QuizSessionSidebarProps {
  session: QuizSessionRecord;
  assignmentConstraints?: AssignmentConstraintState | null;
  answeredCount: number;
  currentQuestionIndex: number;
  onJumpToQuestion: (questionIndex: number) => void;
}

export function QuizSessionSidebar({
  session,
  assignmentConstraints,
  answeredCount,
  currentQuestionIndex,
  onJumpToQuestion,
}: QuizSessionSidebarProps) {
  const unlockedIndex = Math.min(
    answeredCount,
    Math.max(session.quiz.questions.length - 1, 0),
  );

  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <DashboardSurface
        radius="xl"
        padding="md"
        className="space-y-3 bg-[linear-gradient(180deg,#159d8b_0%,#128474_100%)] text-white shadow-[0_24px_52px_rgba(19,167,144,0.18)]"
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
                      ? questionState.isCorrect
                        ? "bg-[linear-gradient(180deg,#159d8b_0%,#128474_100%)] text-white"
                        : "bg-[var(--dashboard-danger)] text-white"
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
