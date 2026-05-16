import type { QuizRecord } from "../../dashboard/components/quiz-library/quizLibraryTypes";
import type { QuizSessionRecord } from "../quizSessionTypes";
import type {
  MyAttemptDto,
  StartAttemptResponseDto,
  SubmitAttemptRequestDto,
  SubmitAttemptResponseDto,
} from "./attemptsApi";
import { createQuizSessionSnapshot } from "../quizSessionUtils";

function normalizeBackendQuestionType(questionType: string) {
  return questionType === "TrueFalse" ? "True/False" : "Multiple choice";
}

function normalizeBackendSelectionMode(correctIndexes: number[]) {
  return correctIndexes.length > 1 ? "multiple" : "single";
}

export function mergeQuizWithStartedAttempt(
  quiz: QuizRecord,
  attempt: StartAttemptResponseDto,
): QuizRecord {
  const questionById = new Map(quiz.questions.map((question) => [question.id, question]));

  return {
    ...quiz,
    questionCount: attempt.questions.length,
    questions: attempt.questions
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((backendQuestion) => {
        const existingQuestion = questionById.get(backendQuestion.id);
        const correctIndexes =
          existingQuestion?.selectionMode === "multiple" && existingQuestion.correctIndexes?.length
            ? existingQuestion.correctIndexes
            : [existingQuestion?.correctIndex ?? 0];

        return {
          id: backendQuestion.id,
          text: backendQuestion.text,
          options: backendQuestion.answers.map((answer) => answer.text),
          optionIds: backendQuestion.answers.map((answer) => answer.id),
          correctIndex: correctIndexes[0] ?? 0,
          correctIndexes,
          tags: existingQuestion?.tags,
          questionType:
            existingQuestion?.questionType ?? normalizeBackendQuestionType(backendQuestion.questionType),
          selectionMode:
            existingQuestion?.selectionMode ?? normalizeBackendSelectionMode(correctIndexes),
          explanation: existingQuestion?.explanation,
          imageEnabled: existingQuestion?.imageEnabled,
          imageUrl: existingQuestion?.imageUrl,
          points: existingQuestion?.points ?? 1,
          estimatedMinutes: existingQuestion?.estimatedMinutes ?? 1,
          answerOrder: existingQuestion?.answerOrder ?? "fixed",
          required: existingQuestion?.required ?? true,
        };
      }),
  };
}

export function canSubmitSessionToBackend(session: QuizSessionRecord) {
  return (
    session.syncMode === "backend" &&
    typeof session.backendAttemptId === "string" &&
    session.quiz.questions.every(
      (question) =>
        Array.isArray(question.optionIds) &&
        question.optionIds.length === question.options.length &&
        question.selectionMode !== "multiple",
    )
  );
}

export function buildSubmitAttemptPayload(
  session: QuizSessionRecord,
): SubmitAttemptRequestDto {
  return {
    answers: session.questionStates.flatMap((questionState) => {
      const question = session.quiz.questions.find(
        (candidate) => candidate.id === questionState.questionId,
      );
      const selectedIndex =
        typeof questionState.selectedIndex === "number"
          ? questionState.selectedIndex
          : questionState.selectedIndices[0];
      const answerId =
        typeof selectedIndex === "number" && selectedIndex >= 0
          ? question?.optionIds?.[selectedIndex]
          : undefined;

      if (!answerId) {
        return [];
      }

      return [
        {
          questionId: questionState.questionId,
          answerId,
        },
      ];
    }),
  };
}

export function applyBackendAttemptResult(
  session: QuizSessionRecord,
  result: SubmitAttemptResponseDto,
  finishedAt = new Date().toISOString(),
): QuizSessionRecord {
  const resultByQuestionId = new Map(
    result.questions.map((questionResult) => [questionResult.questionId, questionResult]),
  );

  const earnedPoints = session.quiz.questions.reduce((total, question) => {
    const questionResult = resultByQuestionId.get(question.id);
    const isCorrect = questionResult?.isCorrect ?? false;
    return total + (isCorrect ? Math.max(1, Math.round(question.points ?? 1)) : 0);
  }, 0);

  return {
    ...session,
    status: "completed",
    updatedAt: finishedAt,
    finishedAt,
    completionReason: "submitted",
    correctCount: result.correctAnswers,
    earnedPoints,
    backendSubmitResult: result,
    questionStates: session.questionStates.map((questionState) => {
      const questionResult = resultByQuestionId.get(questionState.questionId);

      return {
        ...questionState,
        submitted:
          questionState.submitted || typeof questionState.selectedIndex === "number",
        submittedAt: questionState.submittedAt ?? finishedAt,
        isCorrect: questionResult?.isCorrect ?? false,
      };
    }),
  };
}

export function buildCompletedSessionFromAttempt(
  quiz: QuizRecord,
  attempt: MyAttemptDto,
  options?: {
    assignmentContext?: QuizSessionRecord["assignmentContext"];
    attemptNumber?: number;
    sourceType?: QuizSessionRecord["sourceType"];
    sourceLabel?: string;
  },
): QuizSessionRecord {
  const quizSnapshot = createQuizSessionSnapshot(quiz);
  const backendSubmitResult: SubmitAttemptResponseDto = {
    attemptId: attempt.id,
    quizTitle: attempt.quizTitle,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctAnswers: attempt.correctAnswers,
    questions: attempt.questions.map((question) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      selectedAnswer: question.selectedAnswerText ?? "No answer selected",
      correctAnswer: question.correctAnswerText ?? "",
      isCorrect: question.isCorrect,
    })),
  };
  const questionReviewById = new Map(
    attempt.questions.map((question) => [question.questionId, question]),
  );
  const correctCount = attempt.correctAnswers;
  const earnedPoints = quiz.questions.reduce((total, question) => {
    const review = questionReviewById.get(question.id);
    return total + (review?.isCorrect ? Math.max(1, Math.round(question.points ?? 1)) : 0);
  }, 0);

  return {
    id: attempt.id,
    quizId: attempt.quizId,
    viewerRole: "student",
    syncMode: "backend",
    backendAttemptId: attempt.id,
    status: "completed",
    attemptNumber: Math.max(1, options?.attemptNumber ?? 1),
    startedAt: attempt.dateTaken,
    updatedAt: attempt.finishedAt ?? attempt.dateTaken,
    finishedAt: attempt.finishedAt ?? attempt.dateTaken,
    completionReason: "submitted",
    sourceType: options?.sourceType ?? (options?.assignmentContext ? "assigned" : "history"),
    sourceLabel: options?.sourceLabel ?? quiz.sourceLabel,
    assignmentContext: options?.assignmentContext,
    quiz: quizSnapshot,
    currentQuestionIndex: 0,
    questionStates: quizSnapshot.questions.map((question) => {
      const review = questionReviewById.get(question.id);
      const selectedIndexById =
        review?.selectedAnswerId && Array.isArray(question.optionIds)
          ? question.optionIds.findIndex((optionId) => optionId === review.selectedAnswerId)
          : -1;
      const selectedIndexByText =
        selectedIndexById >= 0 || !review?.selectedAnswerText
          ? selectedIndexById
          : question.options.findIndex((option) => option === review.selectedAnswerText);
      const selectedIndex = selectedIndexByText >= 0 ? selectedIndexByText : null;

      return {
        questionId: question.id,
        selectedIndex,
        selectedIndices: typeof selectedIndex === "number" ? [selectedIndex] : [],
        submitted: Boolean(review),
        submittedAt: attempt.dateTaken,
        isCorrect: review?.isCorrect ?? false,
      };
    }),
    correctCount,
    earnedPoints,
    backendSubmitResult,
  };
}
