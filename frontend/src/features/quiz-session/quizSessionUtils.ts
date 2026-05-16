import type { QuizRecord } from "../dashboard/components/quiz-library/quizLibraryTypes";
import { formatCurrentDate } from "../dashboard/settings/settingsPreferences";
import type {
  QuizPlaybackSummary,
  QuizSessionLaunchContext,
  QuizSessionQuestionState,
  QuizSessionRecord,
  QuizSessionResultSummary,
  QuizSessionSnapshot,
  QuizSessionStatus,
} from "./quizSessionTypes";

interface QuizSessionFilter {
  quizId: string;
  viewerRole: "teacher" | "student";
  assignmentId?: string | null;
  status?: QuizSessionStatus;
}

function createQuizSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSessionTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getQuestionCorrectIndexes(question: QuizRecord["questions"][number]) {
  const indexes =
    question.selectionMode === "multiple"
      ? question.correctIndexes?.filter((index) => index >= 0) ?? []
      : [question.correctIndex];

  return indexes.length ? indexes : [Math.max(0, question.correctIndex)];
}

function shuffleQuestionOptions(question: QuizRecord["questions"][number]) {
  if (question.answerOrder !== "shuffle" || question.options.length <= 1) {
    return {
      ...question,
      options: [...question.options],
      optionIds: question.optionIds ? [...question.optionIds] : undefined,
      correctIndexes: question.correctIndexes ? [...question.correctIndexes] : undefined,
    };
  }

  const indexedOptions = question.options.map((label, index) => ({
    label,
    index,
  }));

  for (let currentIndex = indexedOptions.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    const current = indexedOptions[currentIndex];
    indexedOptions[currentIndex] = indexedOptions[randomIndex];
    indexedOptions[randomIndex] = current;
  }

  const indexMap = new Map<number, number>();
  indexedOptions.forEach((item, nextIndex) => {
    indexMap.set(item.index, nextIndex);
  });

  const nextCorrectIndexes = getQuestionCorrectIndexes(question)
    .map((index) => indexMap.get(index))
    .filter((index): index is number => typeof index === "number")
    .sort((left, right) => left - right);

  return {
    ...question,
    options: indexedOptions.map((item) => item.label),
    optionIds: question.optionIds
      ? indexedOptions.map((item) => question.optionIds?.[item.index] ?? "")
      : undefined,
    correctIndex: nextCorrectIndexes[0] ?? 0,
    correctIndexes:
      question.selectionMode === "multiple" ? nextCorrectIndexes : undefined,
  };
}

export function createQuizSessionSnapshot(quiz: QuizRecord): QuizSessionSnapshot {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    language: quiz.language,
    questionCount: quiz.questions.length,
    durationMinutes: quiz.durationMinutes,
    creatorName: quiz.ownerName,
    ownerRole: quiz.ownerRole,
    sourceLabel: quiz.sourceLabel,
    note: quiz.note,
    questions: quiz.questions.map((question) => shuffleQuestionOptions(question)),
  };
}

export function createQuizSessionRecord(
  quiz: QuizRecord,
  context: QuizSessionLaunchContext,
  options?: {
    attemptNumber?: number;
    syncMode?: QuizSessionRecord["syncMode"];
    backendAttemptId?: string;
    quizOverride?: QuizRecord;
  },
): QuizSessionRecord {
  const timestamp = new Date().toISOString();
  const sourceQuiz = options?.quizOverride ?? quiz;

  return {
    id: options?.backendAttemptId ?? createQuizSessionId(),
    quizId: sourceQuiz.id,
    viewerRole: context.viewerRole,
    syncMode: options?.syncMode ?? "local",
    backendAttemptId: options?.backendAttemptId,
    status: "in-progress",
    attemptNumber: Math.max(1, options?.attemptNumber ?? 1),
    startedAt: timestamp,
    updatedAt: timestamp,
    sourceType: context.sourceType,
    sourceLabel: context.sourceLabel ?? sourceQuiz.sourceLabel,
    assignmentContext: context.assignmentContext,
    quiz: createQuizSessionSnapshot(sourceQuiz),
    currentQuestionIndex: 0,
    questionStates: sourceQuiz.questions.map((question) => ({
      questionId: question.id,
      selectedIndex: null,
      selectedIndices: [],
      submitted: false,
    })),
    correctCount: 0,
    earnedPoints: 0,
  };
}

export function sortQuizSessionsByUpdatedAt(sessions: QuizSessionRecord[]) {
  return [...sessions].sort(
    (left, right) =>
      getSessionTimestamp(right.finishedAt ?? right.updatedAt) -
      getSessionTimestamp(left.finishedAt ?? left.updatedAt),
  );
}

export function matchesQuizSession(
  session: QuizSessionRecord,
  filter: QuizSessionFilter,
) {
  if (session.quizId !== filter.quizId || session.viewerRole !== filter.viewerRole) {
    return false;
  }

  if (
    filter.assignmentId &&
    session.assignmentContext?.assignmentId !== filter.assignmentId
  ) {
    return false;
  }

  if (filter.status && session.status !== filter.status) {
    return false;
  }

  return true;
}

export function getLatestQuizSession(
  sessions: QuizSessionRecord[],
  filter: QuizSessionFilter,
) {
  return sortQuizSessionsByUpdatedAt(sessions).find((session) =>
    matchesQuizSession(session, filter),
  );
}

export function getQuestionState(
  session: QuizSessionRecord,
  questionId: string,
): QuizSessionQuestionState | undefined {
  return session.questionStates.find((questionState) => questionState.questionId === questionId);
}

export function getCurrentQuizQuestion(session: QuizSessionRecord) {
  return session.quiz.questions[session.currentQuestionIndex];
}

export function getCurrentQuestionState(session: QuizSessionRecord) {
  const question = getCurrentQuizQuestion(session);

  if (!question) {
    return undefined;
  }

  return getQuestionState(session, question.id);
}

export function getSubmittedQuestionCount(session: QuizSessionRecord) {
  return session.questionStates.filter((questionState) => questionState.submitted).length;
}

export function getQuizSessionResultSummary(
  session: QuizSessionRecord,
): QuizSessionResultSummary {
  const totalQuestions = session.quiz.questions.length;
  const correctCount = session.correctCount;
  const incorrectCount = Math.max(totalQuestions - correctCount, 0);
  const totalPoints = session.quiz.questions.reduce(
    (sum, question) => sum + Math.max(1, Math.round(question.points ?? 1)),
    0,
  );
  const earnedPoints = session.earnedPoints;
  const percentage =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);

  return {
    correctCount,
    totalQuestions,
    incorrectCount,
    percentage,
    earnedPoints,
    totalPoints,
  };
}

export function formatQuizScore(percentage: number) {
  return `${percentage}%`;
}

export function formatQuizPoints(earnedPoints: number, totalPoints: number) {
  return `${earnedPoints}/${totalPoints} pts`;
}

export function formatQuizAttemptDate(value: string) {
  return formatCurrentDate(value);
}

export function formatDurationFromSeconds(
  durationInSeconds: number | null | undefined,
) {
  if (
    durationInSeconds === null ||
    durationInSeconds === undefined ||
    !Number.isFinite(durationInSeconds) ||
    durationInSeconds <= 0
  ) {
    return "--";
  }
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;

  if (minutes === 0) {
    return `${Math.max(seconds, 1)} sec`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
}

export function formatQuizAttemptDuration(session: QuizSessionRecord) {
  const endTimestamp = getSessionTimestamp(session.finishedAt ?? session.updatedAt);
  const startTimestamp = getSessionTimestamp(session.startedAt);
  if (endTimestamp === startTimestamp || startTimestamp === 0) {
    return "--";
  }
  const durationInSeconds = Math.max(
    0,
    Math.round((endTimestamp - startTimestamp) / 1000),
  );
  return formatDurationFromSeconds(durationInSeconds);
}

export function buildQuizPlaybackSummary(
  sessions: QuizSessionRecord[],
  quizId: string,
  viewerRole: "teacher" | "student",
): QuizPlaybackSummary | null {
  const relatedSessions = sortQuizSessionsByUpdatedAt(
    sessions.filter(
      (session) => session.quizId === quizId && session.viewerRole === viewerRole,
    ),
  );

  if (!relatedSessions.length) {
    return null;
  }

  const latestSession = relatedSessions[0];
  const completedSessions = relatedSessions.filter(
    (session) => session.status === "completed",
  );
  const averageScore = completedSessions.length
    ? `${Math.round(
        completedSessions.reduce(
          (total, session) =>
            total + getQuizSessionResultSummary(session).percentage,
          0,
        ) / completedSessions.length,
      )}%`
    : undefined;

  if (latestSession.status === "completed") {
    const latestResult = getQuizSessionResultSummary(latestSession);

    return {
      practiceState: "completed",
      practiceProgressLabel: `Last score ${formatQuizScore(latestResult.percentage)} | ${formatQuizPoints(
        latestResult.earnedPoints,
        latestResult.totalPoints,
      )}`,
      attemptCount: completedSessions.length,
      averageScore,
    };
  }

  const submittedCount = getSubmittedQuestionCount(latestSession);
  const totalQuestions = latestSession.quiz.questions.length;

  return {
    practiceState: "in-progress",
    practiceProgressLabel: `${submittedCount} of ${totalQuestions} answered`,
    attemptCount: completedSessions.length,
    averageScore,
  };
}
