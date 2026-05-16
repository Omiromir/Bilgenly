import type { MyAttemptDto } from "../quiz-session/api/attemptsApi";
import type { QuizSessionRecord } from "../quiz-session/quizSessionTypes";

export type AssignedQuizAvailabilityStatus =
  | "active"
  | "in_progress"
  | "completed"
  | "attempts_exhausted"
  | "expired";

export interface AssignedQuizAvailability {
  status: AssignedQuizAvailabilityStatus;
  displayStatusLabel: string;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  attemptsLeft: number | null;
  maxAttempts: number | null;
  hasAttemptsLeft: boolean;
  hasCompletedAttempt: boolean;
  hasInProgressAttempt: boolean;
  deadlinePassed: boolean;
  isLoading: boolean;
  error: string | null;
  canStart: boolean;
  canResume: boolean;
  canReview: boolean;
  primaryActionLabel: string;
  secondaryActionLabel: string | null;
  latestAttempt: MyAttemptDto | null;
  latestCompletedAttempt: MyAttemptDto | null;
  inProgressAttempt: MyAttemptDto | null;
  activeAttempt: QuizSessionRecord | null;
  latestAttemptSession: QuizSessionRecord | null;
  latestCompletedSession: QuizSessionRecord | null;
}

interface BuildAssignedQuizAvailabilityInput {
  quizId: string;
  assignmentId?: string | null;
  maxAttempts: number | null | undefined;
  deadline?: string | null;
  allowLateSubmissions?: boolean;
  attempts: MyAttemptDto[];
  sessions?: QuizSessionRecord[];
  isLoading?: boolean;
  error?: string | null;
  now?: number;
}

function getTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesAssignmentAttempt(
  attempt: Pick<MyAttemptDto, "quizId" | "assignmentId">,
  quizId: string,
  assignmentId?: string | null,
) {
  if (attempt.quizId !== quizId) {
    return false;
  }

  if (assignmentId && attempt.assignmentId) {
    return attempt.assignmentId === assignmentId;
  }

  return true;
}

function matchesAssignmentSession(
  session: Pick<QuizSessionRecord, "quizId" | "assignmentContext" | "viewerRole">,
  quizId: string,
  assignmentId?: string | null,
) {
  if (session.viewerRole !== "student" || session.quizId !== quizId) {
    return false;
  }

  if (!assignmentId) {
    return true;
  }

  return session.assignmentContext?.assignmentId === assignmentId;
}

function sortAttemptsByDate(attempts: MyAttemptDto[]) {
  return [...attempts].sort(
    (left, right) => getTimestamp(right.dateTaken) - getTimestamp(left.dateTaken),
  );
}

function sortSessionsByDate(sessions: QuizSessionRecord[]) {
  return [...sessions].sort(
    (left, right) =>
      getTimestamp(right.finishedAt ?? right.updatedAt) -
      getTimestamp(left.finishedAt ?? left.updatedAt),
  );
}

function getStatusLabel(
  status: AssignedQuizAvailabilityStatus,
  hasCompletedAttempt: boolean,
  isLoading: boolean,
  error: string | null,
) {
  if (isLoading) {
    return "Checking attempts...";
  }

  if (error && status === "in_progress") {
    return "In Progress";
  }

  if (error && hasCompletedAttempt) {
    return "Completed";
  }

  if (error) {
    return "Unable to verify attempts";
  }

  if (status === "attempts_exhausted" && hasCompletedAttempt) {
    return "Attempts exhausted";
  }

  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "expired":
      return "Expired";
    case "attempts_exhausted":
      return "No attempts left";
    case "active":
    default:
      return "Available";
  }
}

function getPrimaryActionLabel(input: {
  isLoading: boolean;
  error: string | null;
  status: AssignedQuizAvailabilityStatus;
  canResume: boolean;
  canStart: boolean;
  canReview: boolean;
  deadlinePassed: boolean;
}) {
  if (input.isLoading) {
    return "Checking attempts...";
  }

  if (input.canResume) {
    return "Resume Assigned Quiz";
  }

  if (input.canStart) {
    return "Start Assigned Quiz";
  }

  if (input.status === "in_progress") {
    return "Assigned Quiz In Progress";
  }

  if (input.canReview) {
    return "View Result";
  }

  if (input.error) {
    return "Unable to verify attempts";
  }

  if (input.deadlinePassed) {
    return "Deadline Passed";
  }

  return "No Attempts Remaining";
}

export function getAttemptsForAssignment(
  attempts: MyAttemptDto[],
  quizId: string,
  assignmentId?: string | null,
) {
  return sortAttemptsByDate(
    attempts.filter((attempt) => matchesAssignmentAttempt(attempt, quizId, assignmentId)),
  );
}

export function buildAssignedQuizAvailability({
  quizId,
  assignmentId,
  maxAttempts,
  deadline,
  allowLateSubmissions = false,
  attempts,
  sessions = [],
  isLoading = false,
  error = null,
  now = Date.now(),
}: BuildAssignedQuizAvailabilityInput): AssignedQuizAvailability {
  const relatedAttempts = getAttemptsForAssignment(attempts, quizId, assignmentId);
  const completedAttempts = relatedAttempts.filter((attempt) => attempt.isCompleted);
  const inProgressAttempt =
    relatedAttempts.find((attempt) => !attempt.isCompleted) ?? null;
  const relatedSessions = sortSessionsByDate(
    sessions.filter((session) => matchesAssignmentSession(session, quizId, assignmentId)),
  );
  const activeAttempt =
    relatedSessions.find((session) => session.status === "in-progress") ?? null;
  const latestCompletedSession =
    relatedSessions.find((session) => session.status === "completed") ?? null;
  const latestAttemptSession = relatedSessions[0] ?? null;
  const latestAttempt = relatedAttempts[0] ?? null;
  const latestCompletedAttempt = completedAttempts[0] ?? null;
  const attemptsUsed = completedAttempts.length;
  const normalizedMaxAttempts =
    typeof maxAttempts === "number" && maxAttempts > 0 ? maxAttempts : null;
  const attemptsRemaining =
    normalizedMaxAttempts === null
      ? null
      : Math.max(normalizedMaxAttempts - attemptsUsed, 0);
  const deadlinePassed =
    Boolean(deadline) &&
    !allowLateSubmissions &&
    getTimestamp(deadline) > 0 &&
    now > getTimestamp(deadline);
  const hasCompletedAttempt = completedAttempts.length > 0;
  // hasInProgressAttempt reflects any in-progress state (local or backend) for display/chips
  const hasInProgressAttempt = Boolean(activeAttempt || inProgressAttempt);
  const hasAttemptsLeft =
    normalizedMaxAttempts === null || (attemptsRemaining ?? 0) > 0;
  const exhaustedAttempts = normalizedMaxAttempts !== null && !hasAttemptsLeft;
  const canResume = Boolean(activeAttempt) && !deadlinePassed && !isLoading;
  const canResolveNewAttempt = !isLoading && !error;
  // Only a LOCAL in-progress session blocks canStart — orphaned backend attempts do not,
  // because partial answers live only in localStorage and can't be recovered without a local session.
  const canStart =
    canResolveNewAttempt &&
    !deadlinePassed &&
    !activeAttempt &&
    hasAttemptsLeft;
  const canReview =
    Boolean(latestCompletedSession) ||
    Boolean(latestCompletedAttempt?.questions?.length);

  let status: AssignedQuizAvailabilityStatus;
  // Priority: exhausted/completed beats lingering in-progress flags. A stale
  // backend in-progress attempt should never make a finished quiz read as
  // "In Progress" — the student has used all their attempts (or has completed
  // it) and that is the truth we surface in the UI.
  if (exhaustedAttempts) {
    status = "attempts_exhausted";
  } else if (deadlinePassed && !hasCompletedAttempt) {
    status = "expired";
  } else if (hasInProgressAttempt && !deadlinePassed) {
    status = "in_progress";
  } else if (hasCompletedAttempt) {
    status = "completed";
  } else {
    status = "active";
  }

  return {
    status,
    displayStatusLabel: getStatusLabel(status, hasCompletedAttempt, isLoading, error),
    attemptsUsed,
    attemptsRemaining,
    attemptsLeft: attemptsRemaining,
    maxAttempts: normalizedMaxAttempts,
    hasAttemptsLeft,
    hasCompletedAttempt,
    hasInProgressAttempt,
    deadlinePassed,
    isLoading,
    error,
    canStart,
    canResume,
    canReview,
    primaryActionLabel: getPrimaryActionLabel({
      isLoading,
      error,
      status,
      canResume,
      canStart,
      canReview,
      deadlinePassed,
    }),
    secondaryActionLabel: canReview && canStart ? "View Result" : null,
    latestAttempt,
    latestCompletedAttempt,
    inProgressAttempt,
    activeAttempt,
    latestAttemptSession,
    latestCompletedSession,
  };
}

export const resolveAssignedQuizAvailability = buildAssignedQuizAvailability;
