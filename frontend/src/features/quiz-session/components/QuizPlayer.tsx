import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { toAssignmentConstraintSource } from "../../assignments/assignmentConstraints";
import { useAssignmentConstraints } from "../../assignments/useAssignmentConstraints";
import { getQuizFeedbackPolicy } from "../feedbackPolicy";
import { useQuizSession } from "../useQuizSession";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizSessionSidebar } from "./QuizSessionSidebar";

interface QuizPlayerProps {
  sessionId: string;
}

export function QuizPlayer({ sessionId }: QuizPlayerProps) {
  const { sessions } = useQuizSessions();
  const {
    completeSession,
    currentQuestion,
    currentQuestionState,
    goToNextQuestion,
    isLastQuestion,
    selectAnswer,
    session,
    setCurrentQuestion,
    submitAnswer,
    submittedCount,
    totalQuestions,
  } = useQuizSession(sessionId);
  const assignmentConstraints = useAssignmentConstraints({
    assignment: session?.assignmentContext
      ? toAssignmentConstraintSource(session.assignmentContext)
      : null,
    sessions,
    viewerRole: session?.viewerRole ?? "student",
    refreshIntervalMs: 1000,
  });

  const feedbackPolicy = useMemo(
    () =>
      getQuizFeedbackPolicy({
        sourceType: session?.sourceType,
        viewerRole: session?.viewerRole,
        isAssigned: Boolean(session?.assignmentContext),
        // attemptsUsed counts ONLY completed attempts, so during an in-progress
        // attempt the count is one less than what it'll be after submit. That's
        // exactly what we want: the current attempt's answers stay hidden until
        // it's actually finished AND counted.
        attemptsUsed: assignmentConstraints?.attemptsUsed ?? 0,
        maxAttempts: assignmentConstraints?.maxAttempts ?? null,
        hasInProgressAttempt: true,
      }),
    [
      assignmentConstraints?.attemptsUsed,
      assignmentConstraints?.maxAttempts,
      session?.assignmentContext,
      session?.sourceType,
      session?.viewerRole,
    ],
  );

  const [isFinishing, setIsFinishing] = useState(false);

  const canGoPrevious = useMemo(
    () => Boolean(session && session.currentQuestionIndex > 0),
    [session],
  );
  const canGoNext = useMemo(() => {
    if (!session) {
      return false;
    }

    return session.currentQuestionIndex < submittedCount;
  }, [session, submittedCount]);

  if (!session || !currentQuestion || !currentQuestionState) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
      <QuizSessionSidebar
        session={session}
        assignmentConstraints={assignmentConstraints}
        answeredCount={submittedCount}
        currentQuestionIndex={session.currentQuestionIndex}
        onJumpToQuestion={setCurrentQuestion}
      />

      <div className="space-y-5">
        <QuizQuestionCard
          question={currentQuestion}
          questionNumber={session.currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          selectedIndices={currentQuestionState.selectedIndices}
          submitted={currentQuestionState.submitted}
          isCorrect={currentQuestionState.isCorrect}
          onSelect={(selectedIndex) =>
            selectAnswer(currentQuestion.id, selectedIndex)
          }
          onSubmit={() => submitAnswer(currentQuestion.id)}
          onContinue={() => {
            if (isLastQuestion) {
              setIsFinishing(true);
              void completeSession().catch((error: unknown) => {
                setIsFinishing(false);
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to submit that quiz attempt.",
                );
              });
              return;
            }

            goToNextQuestion();
          }}
          onPrevious={() => {
            if (!canGoPrevious) {
              return;
            }

            setCurrentQuestion(session.currentQuestionIndex - 1);
          }}
          onNext={() => {
            if (!canGoNext) {
              return;
            }

            setCurrentQuestion(session.currentQuestionIndex + 1);
          }}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          isLastQuestion={isLastQuestion}
          isFinishing={isFinishing}
          feedbackPolicy={feedbackPolicy}
        />
      </div>
    </div>
  );
}
