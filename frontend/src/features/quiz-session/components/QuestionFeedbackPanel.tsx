import {
  ArrowRight,
  CheckCircle2,
  Info,
  LoaderCircle,
  Lock,
  Trophy,
} from "../../../components/icons/AppIcons";
import {
  DashboardButton,
  DashboardSurface,
} from "../../dashboard/components/DashboardPrimitives";

interface QuestionFeedbackPanelProps {
  isCorrect: boolean;
  correctAnswerLabel: string;
  selectedAnswerLabel?: string;
  explanation?: string;
  isLastQuestion: boolean;
  isFinishing?: boolean;
  onContinue: () => void;
  /**
   * When true, hide the correct-answer box, the explanation, and even the
   * "correct vs incorrect" framing. Used for assigned quizzes while the
   * student still has attempts remaining.
   */
  hideAnswerKey?: boolean;
  /** Message shown in the locked-state notice. */
  lockReason?: string | null;
}

export function QuestionFeedbackPanel({
  isCorrect,
  correctAnswerLabel,
  selectedAnswerLabel,
  explanation,
  isLastQuestion,
  isFinishing = false,
  onContinue,
  hideAnswerKey = false,
  lockReason = null,
}: QuestionFeedbackPanelProps) {
  return (
    <DashboardSurface
      radius="lg"
      padding="md"
      className="space-y-4 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {hideAnswerKey ? (
              <Lock className="h-5 w-5 text-[var(--dashboard-text-soft)]" />
            ) : isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-[var(--dashboard-success)]" />
            ) : (
              <Info className="h-5 w-5 text-[var(--dashboard-warning)]" />
            )}
            <h3 className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
              {hideAnswerKey
                ? "Answer recorded"
                : isCorrect
                  ? "Nice work"
                  : "Keep going"}
            </h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {hideAnswerKey
              ? "Your response was saved. Feedback for this assigned quiz unlocks once you've used all of your attempts."
              : isCorrect
                ? "You chose the right answer. Use the explanation below to reinforce why it works."
                : "This one was not quite right. Review the correct answer and explanation, then continue to the next question."}
          </p>
        </div>

        <DashboardButton
          type="button"
          size="lg"
          className="rounded-[16px] bg-[var(--dashboard-success)] hover:brightness-110"
          onClick={onContinue}
          disabled={isFinishing}
        >
          {isLastQuestion ? (
            isFinishing ? (
              <>
                <LoaderCircle className="h-4.5 w-4.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Trophy className="h-4.5 w-4.5" />
                Finish Quiz
              </>
            )
          ) : (
            <>
              Next Question
              <ArrowRight className="h-4.5 w-4.5" />
            </>
          )}
        </DashboardButton>
      </div>

      {hideAnswerKey ? (
        <>
          {selectedAnswerLabel ? (
            <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                Your answer
              </p>
              <p className="mt-2 text-[15px] font-medium text-[var(--dashboard-text-strong)]">
                {selectedAnswerLabel}
              </p>
            </div>
          ) : null}
          <div className="flex items-start gap-3 rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dashboard-text-faint)]" />
            <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {lockReason ??
                "Detailed feedback for assigned quizzes unlocks after you've used all attempts."}
            </p>
          </div>
        </>
      ) : (
        <>
          {!isCorrect && selectedAnswerLabel ? (
            <div className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                Your answer
              </p>
              <p className="mt-2 text-[15px] font-medium text-[var(--dashboard-text-strong)]">
                {selectedAnswerLabel}
              </p>
            </div>
          ) : null}

          <div className="rounded-[18px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
              Correct answer
            </p>
            <p className="mt-2 text-[15px] font-medium text-[var(--dashboard-text-strong)]">
              {correctAnswerLabel}
            </p>
          </div>

          <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
              Why this matters
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-soft)]">
              {explanation ??
                "This question reinforces the core idea behind the quiz. Review the answer choice carefully before you continue."}
            </p>
          </div>
        </>
      )}
    </DashboardSurface>
  );
}
