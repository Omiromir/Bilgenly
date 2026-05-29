import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Lock,
} from "../../../components/icons/AppIcons";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
} from "../../dashboard/components/DashboardPrimitives";
import type { QuizQuestionRecord } from "../../dashboard/components/quiz-library/quizLibraryTypes";
import type { FeedbackPolicy } from "../feedbackPolicy";
import { AnswerOption } from "./AnswerOption";
import { QuestionFeedbackPanel } from "./QuestionFeedbackPanel";

interface QuizQuestionCardProps {
  question: QuizQuestionRecord;
  questionNumber: number;
  totalQuestions: number;
  selectedIndices: number[];
  submitted: boolean;
  isCorrect?: boolean;
  onSelect: (selectedIndex: number) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  isFinishing?: boolean;
  /**
   * Controls how much answer feedback is shown. Defaults to fully open so
   * self-practice keeps its current behavior. Assigned quizzes pass a locked
   * policy when attempts remain.
   */
  feedbackPolicy?: FeedbackPolicy;
}

const DEFAULT_OPEN_POLICY: FeedbackPolicy = {
  showImmediateCorrectAnswer: true,
  showImmediateExplanation: true,
  showDetailedReview: true,
  showSummaryOnly: false,
  lockReason: null,
};

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndices,
  submitted,
  isCorrect,
  onSelect,
  onSubmit,
  onContinue,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isLastQuestion,
  isFinishing = false,
  feedbackPolicy = DEFAULT_OPEN_POLICY,
}: QuizQuestionCardProps) {
  // When the policy hides the answer key, we never expose correct/incorrect
  // visual cues on the option buttons or the post-submit badge.
  const revealAnswerKey = feedbackPolicy.showImmediateCorrectAnswer;
  const correctIndexes =
    question.selectionMode === "multiple"
      ? question.correctIndexes?.length
        ? question.correctIndexes
        : [question.correctIndex]
      : [question.correctIndex];
  const correctAnswerLabel = correctIndexes
    .map((index) => question.options[index])
    .filter(Boolean)
    .join(", ");
  const selectedAnswerLabel = selectedIndices.length
    ? selectedIndices
        .map((index) => question.options[index])
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <div className="space-y-5">
      <DashboardSurface
        radius="xl"
        padding="lg"
        className="space-y-6 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-border-soft)] pb-5">
          <DashboardButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </DashboardButton>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
              Question
            </p>
            <h2 className="mt-1 text-[1.2rem] font-semibold text-[var(--dashboard-brand)]">
              {questionNumber} of {totalQuestions}
            </h2>
          </div>

          <DashboardButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={onNext}
            disabled={!canGoNext}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </DashboardButton>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[var(--dashboard-text-soft)]">
              {question.selectionMode === "multiple"
                ? "Select all correct answers and submit to reveal feedback."
                : "Select one answer and submit to reveal feedback."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DashboardBadge tone="neutral" size="md">
                {Math.max(1, Math.round(question.points ?? 1))} pts
              </DashboardBadge>
              {question.required === false ? (
                <DashboardBadge tone="neutral" size="md">
                  Optional
                </DashboardBadge>
              ) : null}
            </div>
            <h3 className="mt-3 text-[1.35rem] font-semibold leading-8 text-[var(--dashboard-text-strong)]">
              {question.text}
            </h3>
          </div>

          {submitted ? (
            revealAnswerKey ? (
              <DashboardBadge tone={isCorrect ? "success" : "warning"} size="md">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
                {isCorrect ? "Correct" : "Reviewed"}
              </DashboardBadge>
            ) : (
              <DashboardBadge tone="neutral" size="md">
                <Lock className="h-4 w-4" />
                Answer saved
              </DashboardBadge>
            )
          ) : null}
        </div>

        {question.imageUrl ? (
          <div className="overflow-hidden rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]">
            <img
              src={question.imageUrl}
              alt={`Question ${questionNumber} illustration`}
              className="h-auto max-h-[320px] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="space-y-2.5">
          {question.options.map((option, optionIndex) => (
            <AnswerOption
              key={`${question.id}-${optionIndex}`}
              label={option}
              index={optionIndex}
              isSelected={selectedIndices.includes(optionIndex)}
              isSubmitted={submitted}
              // When the policy hides the answer key, mark every option as
              // neutral after submit. The student sees only what they chose,
              // not whether it was correct.
              isCorrectAnswer={
                revealAnswerKey && submitted && correctIndexes.includes(optionIndex)
              }
              isIncorrectSelection={
                revealAnswerKey &&
                submitted &&
                selectedIndices.includes(optionIndex) &&
                !correctIndexes.includes(optionIndex)
              }
              onSelect={() => onSelect(optionIndex)}
            />
          ))}
        </div>

        {!submitted ? (
          <div className="flex justify-end">
            <DashboardButton
              type="button"
              size="lg"
              className="min-w-[180px] rounded-[16px] bg-[var(--dashboard-brand)] hover:brightness-110"
              onClick={onSubmit}
              disabled={selectedIndices.length === 0 && question.required !== false}
            >
              Submit Answer
            </DashboardButton>
          </div>
        ) : null}
      </DashboardSurface>

      {submitted ? (
        <QuestionFeedbackPanel
          isCorrect={Boolean(isCorrect)}
          correctAnswerLabel={correctAnswerLabel}
          selectedAnswerLabel={selectedAnswerLabel}
          explanation={
            feedbackPolicy.showImmediateExplanation ? question.explanation : undefined
          }
          isLastQuestion={isLastQuestion}
          isFinishing={isFinishing}
          onContinue={onContinue}
          hideAnswerKey={!feedbackPolicy.showImmediateCorrectAnswer}
          lockReason={feedbackPolicy.lockReason}
        />
      ) : null}
    </div>
  );
}
