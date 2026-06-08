import { useMemo } from "react";
import { useQuizSessions } from "../../app/providers/QuizSessionProvider";
import {
  getCurrentQuestionState,
  getCurrentQuizQuestion,
  getQuizSessionResultSummary,
  getSubmittedQuestionCount,
} from "./quizSessionUtils";
import type { QuizSessionRecord } from "./quizSessionTypes";

type CompleteSessionOptions = {
  completionReason?: QuizSessionRecord["completionReason"];
  finishedAt?: string;
};

export function useQuizSession(sessionId?: string | null) {
  const {
    completeSession,
    getSessionById,
    goToNextQuestion,
    selectAnswer,
    setCurrentQuestion,
    submitAnswer,
  } = useQuizSessions();
  const session = sessionId ? getSessionById(sessionId) : undefined;

  return useMemo(() => {
    if (!session) {
      return {
        session: undefined,
        currentQuestion: undefined,
        currentQuestionState: undefined,
        submittedCount: 0,
        totalQuestions: 0,
        resultSummary: undefined,
        isLastQuestion: false,
        selectAnswer: (_questionId: string, _selectedIndex: number) => undefined,
        submitAnswer: (_questionId: string) => undefined,
        setCurrentQuestion: (_questionIndex: number) => undefined,
        goToNextQuestion: () => undefined,
        completeSession: async (_options?: CompleteSessionOptions) => undefined,
      };
    }

    const currentQuestion = getCurrentQuizQuestion(session);
    const currentQuestionState = getCurrentQuestionState(session);
    const totalQuestions = session.quiz.questions.length;

    return {
      session,
      currentQuestion,
      currentQuestionState,
      submittedCount: getSubmittedQuestionCount(session),
      totalQuestions,
      resultSummary: getQuizSessionResultSummary(session),
      isLastQuestion: session.currentQuestionIndex === totalQuestions - 1,
      setCurrentQuestion: (questionIndex: number) =>
        setCurrentQuestion(session.id, questionIndex),
      selectAnswer: (questionId: string, selectedIndex: number) =>
        selectAnswer(session.id, questionId, selectedIndex),
      submitAnswer: (questionId: string) => submitAnswer(session.id, questionId),
      goToNextQuestion: () => goToNextQuestion(session.id),
      completeSession: (options?: CompleteSessionOptions) =>
        completeSession(session.id, options),
    };
  }, [
    completeSession,
    getSessionById,
    goToNextQuestion,
    selectAnswer,
    session,
    setCurrentQuestion,
    submitAnswer,
  ]);
}
