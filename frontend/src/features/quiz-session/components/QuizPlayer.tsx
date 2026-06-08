import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { toAssignmentConstraintSource } from "../../assignments/assignmentConstraints";
import { useAssignmentConstraints } from "../../assignments/useAssignmentConstraints";
import { getQuizFeedbackPolicy } from "../feedbackPolicy";
import { useQuizSession } from "../useQuizSession";
import { useQuizTimer } from "../useQuizTimer";
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
  const isFinishingRef = useRef(false);

  const getAdjustedFinishedAtRef = useRef<() => string>(() => new Date().toISOString());

  const handleTimerExpired = useCallback(() => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    setIsFinishing(true);
    toast.error("Time's up! Your answers have been submitted automatically.", {
      duration: 6000,
    });
    void completeSession({
      completionReason: "time-limit-reached",
      finishedAt: getAdjustedFinishedAtRef.current(),
    }).catch(() => {
      isFinishingRef.current = false;
      setIsFinishing(false);
    });
  }, [completeSession]);

  const timer = useQuizTimer(
    session ?? { id: "", startedAt: new Date().toISOString(), status: "in-progress", quiz: { durationMinutes: 0 } },
    handleTimerExpired,
  );

  getAdjustedFinishedAtRef.current = timer.getAdjustedFinishedAt;

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
        revealAnswerKey={feedbackPolicy.showImmediateCorrectAnswer}
        timeRemainingSeconds={timer.totalDurationSeconds > 0 ? timer.timeRemainingSeconds : undefined}
        totalDurationSeconds={timer.totalDurationSeconds > 0 ? timer.totalDurationSeconds : undefined}
        isTimerWarning={timer.isWarning}
        isTimerDanger={timer.isDanger}
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
              void completeSession({
                finishedAt: timer.getAdjustedFinishedAt(),
              }).catch((error: unknown) => {
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
