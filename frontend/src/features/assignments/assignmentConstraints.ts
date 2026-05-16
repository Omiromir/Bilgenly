import type { TeacherClassAssignedQuiz } from "../dashboard/components/classes/teacherClassesTypes";
import type { QuizAssignmentContext } from "../dashboard/components/quiz-library/quizLibraryTypes";
import type { QuizSessionRecord } from "../quiz-session/quizSessionTypes";
import { getQuizSessionResultSummary } from "../quiz-session/quizSessionUtils";

export type AssignmentProgressStatus =
  | "active"
  | "in_progress"
  | "completed"
  | "expired"
  | "attempts_exhausted";

export interface AssignmentSettingsFormValues {
  deadlineDate: string;
  deadlineTime: string;
  maxAttempts: "1" | "2" | "3" | "unlimited";
}

export interface AssignmentSettingsValidationResult {
  deadline: string | null;
  maxAttempts: number | null;
  errors: {
    deadline?: string;
  };
}

export interface AssignmentConstraintSource {
  assignmentId: string;
  assignedAt: string;
  deadline: string | null;
  maxAttempts: number | null;
  allowLateSubmissions: boolean;
  status?: "active" | "expired";
}

export interface AssignmentConstraintState {
  assignmentId: string;
  status: AssignmentProgressStatus;
  assignmentStatus: "active" | "expired";
  deadline: string | null;
  deadlineLabel: string;
  deadlinePassed: boolean;
  maxAttempts: number | null;
  hasUnlimitedAttempts: boolean;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  activeAttempt: QuizSessionRecord | null;
  latestAttempt: QuizSessionRecord | null;
  latestCompletedAttempt: QuizSessionRecord | null;
  completedAttempts: QuizSessionRecord[];
  hasCompletedAttempt: boolean;
  hasOnTimeCompletion: boolean;
  studentAttempted: boolean;
  exhaustedAttempts: boolean;
  missedDeadline: boolean;
  canStart: boolean;
  canResume: boolean;
  canRetry: boolean;
  latestScore: number | null;
  bestScore: number | null;
  backendAttemptCount?: number;
}

const assignmentDeadlineFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const DEFAULT_ASSIGNMENT_SETTINGS_VALUES: AssignmentSettingsFormValues = {
  deadlineDate: "",
  deadlineTime: "",
  maxAttempts: "1",
};

function getTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortSessionsByUpdatedAt(sessions: QuizSessionRecord[]) {
  return [...sessions].sort((left, right) => {
    const leftTimestamp = getTimestamp(left.finishedAt ?? left.updatedAt) ?? 0;
    const rightTimestamp = getTimestamp(right.finishedAt ?? right.updatedAt) ?? 0;
    return rightTimestamp - leftTimestamp;
  });
}

function getAssignmentCompletionTimestamp(session: QuizSessionRecord) {
  return session.finishedAt ?? session.updatedAt;
}

export function getAssignmentLevelStatus(
  assignment: Pick<AssignmentConstraintSource, "deadline" | "allowLateSubmissions">,
  now = Date.now(),
) {
  const deadlineTimestamp = getTimestamp(assignment.deadline);

  if (
    deadlineTimestamp !== null &&
    now > deadlineTimestamp &&
    !assignment.allowLateSubmissions
  ) {
    return "expired" as const;
  }

  return "active" as const;
}

export function formatAssignmentDeadline(deadline: string | null | undefined) {
  if (!deadline) {
    return "No deadline";
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "Invalid deadline";
  }

  return assignmentDeadlineFormatter.format(date);
}

export function formatAssignmentAttempts(maxAttempts: number | null | undefined) {
  if (maxAttempts === null || typeof maxAttempts !== "number") {
    return "Unlimited attempts";
  }

  return `${maxAttempts} ${maxAttempts === 1 ? "attempt" : "attempts"}`;
}

export function splitAssignmentDeadline(deadline: string | null | undefined) {
  if (!deadline) {
    return {
      deadlineDate: "",
      deadlineTime: "",
    } satisfies Pick<
      AssignmentSettingsFormValues,
      "deadlineDate" | "deadlineTime"
    >;
  }

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return {
      deadlineDate: "",
      deadlineTime: "",
    } satisfies Pick<
      AssignmentSettingsFormValues,
      "deadlineDate" | "deadlineTime"
    >;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return {
    deadlineDate: `${year}-${month}-${day}`,
    deadlineTime: `${hours}:${minutes}`,
  } satisfies Pick<
    AssignmentSettingsFormValues,
    "deadlineDate" | "deadlineTime"
  >;
}

export function buildAssignmentSettingsFormValues(
  assignment?: Pick<
    TeacherClassAssignedQuiz,
    "deadline" | "maxAttempts"
  > | null,
): AssignmentSettingsFormValues {
  const deadline = splitAssignmentDeadline(assignment?.deadline);

  return {
    ...deadline,
    maxAttempts:
      assignment?.maxAttempts === null
        ? "unlimited"
        : assignment?.maxAttempts === 2
          ? "2"
          : assignment?.maxAttempts === 3
            ? "3"
            : "1",
  };
}

export function validateAssignmentSettings(
  values: AssignmentSettingsFormValues,
  now = Date.now(),
): AssignmentSettingsValidationResult {
  const hasDeadlineDate = values.deadlineDate.trim().length > 0;
  const hasDeadlineTime = values.deadlineTime.trim().length > 0;
  const errors: AssignmentSettingsValidationResult["errors"] = {};
  let deadline: string | null = null;

  if (hasDeadlineDate || hasDeadlineTime) {
    if (!hasDeadlineDate || !hasDeadlineTime) {
      errors.deadline = "Choose both a deadline date and time, or leave both blank.";
    } else {
      const parsed = new Date(`${values.deadlineDate}T${values.deadlineTime}`);
      const timestamp = parsed.getTime();

      if (Number.isNaN(timestamp)) {
        errors.deadline = "Enter a valid deadline.";
      } else if (timestamp <= now) {
        errors.deadline = "Deadline must be in the future.";
      } else {
        deadline = parsed.toISOString();
      }
    }
  }

  return {
    deadline,
    maxAttempts:
      values.maxAttempts === "unlimited"
        ? null
        : Math.max(1, Number.parseInt(values.maxAttempts, 10) || 1),
    errors,
  };
}

export function getAssignmentRelatedSessions(
  sessions: QuizSessionRecord[],
  assignmentId: string,
  viewerRole: "teacher" | "student" = "student",
) {
  return sortSessionsByUpdatedAt(
    sessions.filter(
      (session) =>
        session.viewerRole === viewerRole &&
        session.assignmentContext?.assignmentId === assignmentId,
    ),
  );
}

function getSessionScore(session: QuizSessionRecord) {
  return getQuizSessionResultSummary(session).percentage;
}

export function buildAssignmentConstraintState(
  assignment: AssignmentConstraintSource | undefined | null,
  sessions: QuizSessionRecord[],
  viewerRole: "teacher" | "student" = "student",
  now = Date.now(),
  backendAttemptCount?: number,
): AssignmentConstraintState | null {
  if (!assignment) {
    return null;
  }

  const relatedSessions = getAssignmentRelatedSessions(
    sessions,
    assignment.assignmentId,
    viewerRole,
  );
  const completedAttempts = relatedSessions.filter(
    (session) => session.status === "completed",
  );
  const activeAttempt =
    relatedSessions.find((session) => session.status === "in-progress") ?? null;
  const latestAttempt = relatedSessions[0] ?? null;
  const latestCompletedAttempt = completedAttempts[0] ?? null;
  // Use backend attempt count as source of truth if provided, otherwise use local session count
  const attemptsUsed =
    typeof backendAttemptCount === "number" ? backendAttemptCount : completedAttempts.length;
  const hasUnlimitedAttempts = assignment.maxAttempts === null;
  const attemptsRemaining = hasUnlimitedAttempts
    ? null
    : Math.max((assignment.maxAttempts ?? 0) - attemptsUsed, 0);
  const deadlineTimestamp = getTimestamp(assignment.deadline);
  const deadlinePassed =
    deadlineTimestamp !== null &&
    now > deadlineTimestamp &&
    !assignment.allowLateSubmissions;
  const assignmentStatus = getAssignmentLevelStatus(assignment, now);
  const exhaustedAttempts =
    assignment.maxAttempts !== null && attemptsUsed >= assignment.maxAttempts;
  const hasOnTimeCompletion = completedAttempts.some((session) => {
    const completionTimestamp = getTimestamp(getAssignmentCompletionTimestamp(session));

    if (completionTimestamp === null) {
      return false;
    }

    if (session.completionReason === "deadline-expired") {
      return false;
    }

    return deadlineTimestamp === null || completionTimestamp <= deadlineTimestamp;
  });
  const hasCompletedAttempt = completedAttempts.length > 0;
  const studentAttempted = hasCompletedAttempt || Boolean(activeAttempt);
  const latestScore = latestCompletedAttempt ? getSessionScore(latestCompletedAttempt) : null;
  const bestScore = completedAttempts.length
    ? Math.max(...completedAttempts.map((session) => getSessionScore(session)))
    : null;
  // Priority: exhausted beats lingering in-progress sessions. Otherwise a
  // forgotten session in localStorage would make a finished quiz read as
  // "In Progress" even after the student has used every available attempt.
  const status: AssignmentProgressStatus = exhaustedAttempts
    ? "attempts_exhausted"
    : deadlinePassed && !hasOnTimeCompletion
      ? "expired"
      : activeAttempt && !deadlinePassed
        ? "in_progress"
        : hasCompletedAttempt
          ? "completed"
          : "active";

  return {
    assignmentId: assignment.assignmentId,
    status,
    assignmentStatus,
    deadline: assignment.deadline,
    deadlineLabel: formatAssignmentDeadline(assignment.deadline),
    deadlinePassed,
    maxAttempts: assignment.maxAttempts,
    hasUnlimitedAttempts,
    attemptsUsed,
    attemptsRemaining,
    activeAttempt,
    latestAttempt,
    latestCompletedAttempt,
    completedAttempts,
    hasCompletedAttempt,
    hasOnTimeCompletion,
    studentAttempted,
    exhaustedAttempts,
    missedDeadline: deadlinePassed && !hasOnTimeCompletion,
    canStart: !activeAttempt && !deadlinePassed && (hasUnlimitedAttempts || attemptsRemaining !== 0),
    canResume: Boolean(activeAttempt) && !deadlinePassed,
    canRetry:
      !activeAttempt &&
      hasCompletedAttempt &&
      !deadlinePassed &&
      (hasUnlimitedAttempts || attemptsRemaining !== 0),
    latestScore,
    bestScore,
    backendAttemptCount,
  };
}

export function getAssignmentStatusLabel(status: AssignmentProgressStatus) {
  switch (status) {
    case "active":
      return "Available";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    case "attempts_exhausted":
      return "Attempts exhausted";
    default:
      return "Available";
  }
}

export function getAssignmentStatusTone(status: AssignmentProgressStatus) {
  switch (status) {
    case "active":
      return "info" as const;
    case "in_progress":
      return "warning" as const;
    case "completed":
      return "success" as const;
    case "expired":
      return "danger" as const;
    case "attempts_exhausted":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

export function toAssignmentConstraintSource(
  assignment:
    | Pick<
        TeacherClassAssignedQuiz,
        "assignmentId" | "assignedAt" | "deadline" | "maxAttempts" | "allowLateSubmissions" | "status"
      >
    | Pick<
        QuizAssignmentContext,
        "assignmentId" | "assignedAt" | "deadline" | "maxAttempts" | "allowLateSubmissions" | "status"
      >,
): AssignmentConstraintSource {
  return {
    assignmentId: assignment.assignmentId,
    assignedAt: assignment.assignedAt,
    deadline: assignment.deadline,
    maxAttempts: assignment.maxAttempts,
    allowLateSubmissions: assignment.allowLateSubmissions,
    status: assignment.status,
  };
}
