import { CheckCircle2, XCircle } from "../../../components/icons/AppIcons";
import { DashboardBadge } from "../../dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../dashboard/components/SectionCard";
import type { QuizSessionRecord } from "../quizSessionTypes";
import { getQuestionState } from "../quizSessionUtils";

interface QuizReviewListProps {
  session: QuizSessionRecord;
}

export function QuizReviewList({ session }: QuizReviewListProps) {
  const backendReviewByQuestionId = new Map(
    (session.backendSubmitResult?.questions ?? []).map((question) => [
      question.questionId,
      question,
    ]),
  );

  return (
    <SectionCard
      title="Answer Review"
      description="Review each question, compare your answer with the correct one, and use the explanation to close the gap."
      contentClassName="space-y-4"
    >
      {session.quiz.questions.map((question, questionIndex) => {
        const questionState = getQuestionState(session, question.id);
        const backendReview = backendReviewByQuestionId.get(question.id);
        const selectedAnswer = backendReview
          ? backendReview.selectedAnswer || "No answer selected"
          : questionState?.selectedIndices?.length
            ? questionState.selectedIndices
                .map((selectedIndex) => question.options[selectedIndex])
                .filter(Boolean)
                .join(", ")
            : "No answer selected";
        const correctIndexes =
          question.selectionMode === "multiple"
            ? question.correctIndexes?.length
              ? question.correctIndexes
              : [question.correctIndex]
            : [question.correctIndex];
        const correctAnswer = backendReview
          ? backendReview.correctAnswer
          : correctIndexes
              .map((correctIndex) => question.options[correctIndex])
              .filter(Boolean)
              .join(", ");
        const isCorrect = backendReview?.isCorrect ?? Boolean(questionState?.isCorrect);

        return (
          <article
            key={question.id}
            className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                  Question {questionIndex + 1}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <DashboardBadge tone="neutral" size="md">
                    {Math.max(1, Math.round(question.points ?? 1))} pts
                  </DashboardBadge>
                </div>
                <h3 className="mt-2 text-[1.1rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {question.text}
                </h3>
              </div>

              <DashboardBadge tone={isCorrect ? "success" : "danger"} size="md">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {isCorrect ? "Correct" : "Incorrect"}
              </DashboardBadge>
            </div>

            {question.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]">
                <img
                  src={question.imageUrl}
                  alt={`Question ${questionIndex + 1} illustration`}
                  className="h-auto max-h-[240px] w-full object-cover"
                />
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                  Your answer
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-strong)]">
                  {selectedAnswer}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/35 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                  Correct answer
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-strong)]">
                  {correctAnswer}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--dashboard-text-soft)]">
                {question.explanation ??
                  "Review the correct answer and the surrounding topic to strengthen this concept before your next attempt."}
              </p>
            </div>
          </article>
        );
      })}
    </SectionCard>
  );
}
