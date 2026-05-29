import {
  buildAssignmentConstraintState,
  toAssignmentConstraintSource,
  type AssignmentProgressStatus,
} from "../../../assignments/assignmentConstraints";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassRecord,
  TeacherClassStudent,
} from "../classes/teacherClassesTypes";
import { normalizeEmail } from "../../../auth/validation";
import type { QuizQuestionRecord } from "../quiz-library/quizLibraryTypes";
import type { SharedAssignedQuizSessionRecord } from "../../../quiz-session/quizSessionTypes";
import { getQuizSessionResultSummary } from "../../../quiz-session/quizSessionUtils";

export const DEFAULT_INTERVENTION_THRESHOLD = 70;

export type TeacherQuizCompletionStatus = AssignmentProgressStatus;
export type TeacherInsightFlag = "Needs Review" | "At Risk";

export interface TeacherStudentTopicPerformance {
  label: string;
  correctCount: number;
  totalCount: number;
  percentage: number;
}

export interface TeacherAttemptAnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TeacherAttemptQuestionResponse {
  questionId: string;
  questionText: string;
  questionType: string;
  questionNumber: number;
  explanation: string;
  selectedAnswerId?: string | null;
  selectedAnswerText?: string | null;
  correctAnswerId?: string | null;
  correctAnswerText?: string | null;
  isCorrect: boolean;
  answerOptions: TeacherAttemptAnswerOption[];
}

export interface TeacherQuizAttemptHistoryItem {
  id: string;
  finishedAt?: string;
  updatedAt: string;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  responsesCount: number;
  durationSeconds: number;
  /** Present only when attempt was recorded from a local quiz session. Absent for backend-derived entries. */
  session?: SharedAssignedQuizSessionRecord;
}

export interface TeacherStudentQuizResultRowData {
  rowId: string;
  student: TeacherClassStudent;
  status: TeacherQuizCompletionStatus;
  latestAttempt: SharedAssignedQuizSessionRecord | null;
  latestCompletedAttempt: SharedAssignedQuizSessionRecord | null;
  latestAttemptId?: string | null;
  attempts: TeacherQuizAttemptHistoryItem[];
  attemptsUsed: number;
  attemptsRemaining: number | null;
  latestScore: number | null;
  bestScore: number | null;
  averageScore: number | null;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  responseCount: number | null;
  responseDetailsAvailable: boolean;
  latestAttemptQuestions: TeacherAttemptQuestionResponse[];
  completionTimestamp?: string;
  recentCompletionTimestamp?: string;
  weakTopics: string[];
  topicPerformance: TeacherStudentTopicPerformance[];
  flags: TeacherInsightFlag[];
  exhaustedAttempts: boolean;
  missedDeadline: boolean;
}

export interface TeacherScoreDistributionBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  studentNames: string[];
}

export interface TeacherQuestionAnalyticsItem {
  questionId: string;
  questionNumber: number;
  prompt: string;
  explanation?: string;
  correctRate: number;
  missRate: number;
  correctCount: number;
  missCount: number;
  attemptCount: number;
  studentNamesMissed: string[];
  tags: string[];
}

export interface TeacherInterventionStudent {
  studentName: string;
  score: number | null;
  status: TeacherQuizCompletionStatus;
  reason: string;
}

export interface TeacherAssignedQuizAnalytics {
  assignedStudents: TeacherClassStudent[];
  rows: TeacherStudentQuizResultRowData[];
  completedStudentsCount: number;
  assignedStudentsCount: number;
  studentsWithAttemptsCount: number;
  missedDeadlineStudentsCount: number;
  exhaustedAttemptsStudentsCount: number;
  averageAttemptsUsed: number;
  expirationRate: number;
  averageScore: number | null;
  completionRate: number;
  latestCompletionTimestamp?: string;
  scoreDistribution: TeacherScoreDistributionBucket[];
  questionAnalytics: TeacherQuestionAnalyticsItem[];
  interventionStudents: TeacherInterventionStudent[];
  averageTimePerQuestionSeconds: number | null;
  numberOfQuestions: number;
}

function getAttemptDurationSeconds(record: SharedAssignedQuizSessionRecord) {
  const start = new Date(record.session.startedAt).getTime();
  const end = new Date(
    record.session.finishedAt ?? record.session.updatedAt,
  ).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }

  return Math.max(0, Math.round((end - start) / 1000));
}

function getQuestionInsightTags(question: QuizQuestionRecord) {
  const tags = Array.isArray(question.tags) ? question.tags : [];
  const unique = new Set<string>();

  return tags.filter((tag) => {
    const normalized = tag.trim().toLowerCase();

    if (!normalized || unique.has(normalized)) {
      return false;
    }

    unique.add(normalized);
    return true;
  });
}

function buildAttemptHistory(attempts: SharedAssignedQuizSessionRecord[]) {
  return attempts
    .filter((attempt) => attempt.session.status === "completed")
    .map((attempt) => {
      const result = getQuizSessionResultSummary(attempt.session);

      return {
        id: attempt.id,
        finishedAt: attempt.session.finishedAt,
        updatedAt: attempt.session.updatedAt,
        percentage: result.percentage,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        totalQuestions: result.totalQuestions,
        responsesCount: result.correctCount + result.incorrectCount,
        durationSeconds: getAttemptDurationSeconds(attempt),
        session: attempt,
      } satisfies TeacherQuizAttemptHistoryItem;
    })
    .sort(
      (left, right) =>
        new Date(right.finishedAt ?? right.updatedAt).getTime() -
        new Date(left.finishedAt ?? left.updatedAt).getTime(),
    );
}

function buildTopicPerformance(attempts: SharedAssignedQuizSessionRecord[]) {
  const buckets = new Map<
    string,
    { label: string; correctCount: number; totalCount: number }
  >();

  attempts.forEach((attempt) => {
    if (attempt.session.status !== "completed") {
      return;
    }

    attempt.session.quiz.questions.forEach((question) => {
      const tags = getQuestionInsightTags(question);

      if (!tags.length) {
        return;
      }

      const state = attempt.session.questionStates.find(
        (questionState) => questionState.questionId === question.id,
      );

      if (!state?.submitted) {
        return;
      }

      tags.forEach((tag) => {
        const bucket = buckets.get(tag) ?? {
          label: tag,
          correctCount: 0,
          totalCount: 0,
        };

        bucket.totalCount += 1;
        if (state.isCorrect) {
          bucket.correctCount += 1;
        }

        buckets.set(tag, bucket);
      });
    });
  });

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      percentage: bucket.totalCount
        ? Math.round((bucket.correctCount / bucket.totalCount) * 100)
        : 0,
    }))
    .sort((left, right) => left.percentage - right.percentage);
}

function buildLatestAttemptQuestions(
  latestCompletedAttempt: SharedAssignedQuizSessionRecord | null,
) {
  if (!latestCompletedAttempt) {
    return [] as TeacherAttemptQuestionResponse[];
  }

  return latestCompletedAttempt.session.quiz.questions.map((question, index) => {
    const state = latestCompletedAttempt.session.questionStates.find(
      (questionState) => questionState.questionId === question.id,
    );
    const selectedIndexes = state?.selectedIndices?.length
      ? state.selectedIndices
      : typeof state?.selectedIndex === "number"
        ? [state.selectedIndex]
        : [];
    const selectedAnswerIndex = selectedIndexes[0];
    const correctAnswerIndexes =
      question.selectionMode === "multiple"
        ? question.correctIndexes?.length
          ? question.correctIndexes
          : [question.correctIndex]
        : [question.correctIndex];

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.selectionMode === "multiple" ? "MCQ" : "MCQ",
      questionNumber: index + 1,
      explanation: question.explanation ?? "",
      selectedAnswerText:
        typeof selectedAnswerIndex === "number"
          ? question.options[selectedAnswerIndex] ?? null
          : null,
      correctAnswerText: correctAnswerIndexes
        .map((answerIndex) => question.options[answerIndex] ?? `Option ${answerIndex + 1}`)
        .join(", "),
      isCorrect: Boolean(state?.isCorrect),
      answerOptions: question.options.map((option, optionIndex) => ({
        id: `${question.id}-${optionIndex}`,
        text: option,
        isCorrect: correctAnswerIndexes.includes(optionIndex),
      })),
    } satisfies TeacherAttemptQuestionResponse;
  });
}

function buildFlags(
  latestScore: number | null,
  attempts: TeacherQuizAttemptHistoryItem[],
  threshold: number,
  weakTopics: string[],
) {
  if (latestScore === null) {
    return [] as TeacherInsightFlag[];
  }

  const hasConsecutiveLowScores =
    attempts.length >= 2 &&
    attempts[0].percentage < threshold &&
    attempts[1].percentage < threshold;
  const isAtRisk = latestScore < 50 || hasConsecutiveLowScores;
  const needsReview =
    !isAtRisk && (latestScore < threshold || weakTopics.length > 0);
  const flags: TeacherInsightFlag[] = [];

  if (isAtRisk) {
    flags.push("At Risk");
  } else if (needsReview) {
    flags.push("Needs Review");
  }

  return flags;
}

function buildDistribution(scores: Array<{ studentName: string; score: number }>) {
  const buckets: TeacherScoreDistributionBucket[] = [
    { label: "85-100", min: 85, max: 100, count: 0, studentNames: [] },
    { label: "70-84", min: 70, max: 84, count: 0, studentNames: [] },
    { label: "50-69", min: 50, max: 69, count: 0, studentNames: [] },
    { label: "0-49", min: 0, max: 49, count: 0, studentNames: [] },
  ];

  scores.forEach(({ score, studentName }) => {
    const bucket = buckets.find(
      (candidate) => score >= candidate.min && score <= candidate.max,
    );

    if (!bucket) {
      return;
    }

    bucket.count += 1;
    bucket.studentNames.push(studentName);
  });

  return buckets;
}

function buildQuestionAnalytics(latestCompletedRows: TeacherStudentQuizResultRowData[]) {
  const buckets = new Map<
    string,
    {
      item: TeacherQuestionAnalyticsItem;
      missedStudents: Set<string>;
    }
  >();

  // Seed buckets from the quiz definition (any attempt suffices — all
  // attempts of one assignment share the same quiz). Without this seed,
  // questions that nobody answered would be missing from analytics, so a
  // 10-question quiz would appear as 8 questions if 2 went unanswered.
  const seedQuiz = latestCompletedRows.find(
    (row) => row.latestCompletedAttempt?.session.quiz.questions.length,
  )?.latestCompletedAttempt?.session.quiz;

  seedQuiz?.questions.forEach((question, index) => {
    buckets.set(question.id, {
      item: {
        questionId: question.id,
        questionNumber: index + 1,
        prompt: question.text,
        explanation: question.explanation,
        correctRate: 0,
        missRate: 0,
        correctCount: 0,
        missCount: 0,
        attemptCount: 0,
        studentNamesMissed: [],
        tags: getQuestionInsightTags(question),
      },
      missedStudents: new Set<string>(),
    });
  });

  latestCompletedRows.forEach((row) => {
    const attempt = row.latestCompletedAttempt;

    if (!attempt) {
      return;
    }

    attempt.session.quiz.questions.forEach((question, index) => {
      const state = attempt.session.questionStates.find(
        (questionState) => questionState.questionId === question.id,
      );

      if (!state?.submitted) {
        return;
      }

      const bucket = buckets.get(question.id) ?? {
        item: {
          questionId: question.id,
          questionNumber: index + 1,
          prompt: question.text,
          explanation: question.explanation,
          correctRate: 0,
          missRate: 0,
          correctCount: 0,
          missCount: 0,
          attemptCount: 0,
          studentNamesMissed: [],
          tags: getQuestionInsightTags(question),
        },
        missedStudents: new Set<string>(),
      };

      bucket.item.attemptCount += 1;
      if (state.isCorrect) {
        bucket.item.correctCount += 1;
      } else {
        bucket.item.missCount += 1;
        bucket.missedStudents.add(row.student.fullName);
      }

      buckets.set(question.id, bucket);
    });
  });

  return Array.from(buckets.values())
    .map(({ item, missedStudents }) => ({
      ...item,
      correctRate: item.attemptCount
        ? Math.round((item.correctCount / item.attemptCount) * 100)
        : 0,
      missRate: item.attemptCount
        ? Math.round((item.missCount / item.attemptCount) * 100)
        : 0,
      studentNamesMissed: Array.from(missedStudents),
    }))
    .sort((left, right) => {
      if (right.missCount !== left.missCount) {
        return right.missCount - left.missCount;
      }

      return left.questionNumber - right.questionNumber;
    });
}

function matchesStudent(student: TeacherClassStudent, record: SharedAssignedQuizSessionRecord) {
  const normalizedStudentEmail = normalizeEmail(student.email);
  const normalizedRecordEmail = normalizeEmail(record.student.email);

  if (normalizedStudentEmail && normalizedStudentEmail === normalizedRecordEmail) {
    return true;
  }

  return student.linkedUserId === record.student.id;
}

function getStatusRank(status: TeacherQuizCompletionStatus) {
  switch (status) {
    case "completed":
      return 2;
    case "in_progress":
      return 3;
    case "expired":
      return 4;
    case "attempts_exhausted":
      return 5;
    case "active":
    default:
      return 6;
  }
}

export function buildTeacherAssignedQuizAnalytics(
  teacherClass: TeacherClassRecord,
  assignment: TeacherClassAssignedQuiz,
  records: SharedAssignedQuizSessionRecord[],
  threshold = DEFAULT_INTERVENTION_THRESHOLD,
): TeacherAssignedQuizAnalytics {
  const assignedStudents = teacherClass.students.filter(
    (student) => student.status === "joined",
  );
  const assignmentRecords = records
    .filter(
      (record) =>
        record.assignmentId === assignment.assignmentId &&
        record.classId === teacherClass.id,
    )
    .sort(
      (left, right) =>
        new Date(right.session.finishedAt ?? right.session.updatedAt).getTime() -
        new Date(left.session.finishedAt ?? left.session.updatedAt).getTime(),
    );
  const rows = assignedStudents
    .map((student) => {
      const studentAttempts = assignmentRecords.filter((record) =>
        matchesStudent(student, record),
      );
      const constraintState = buildAssignmentConstraintState(
        toAssignmentConstraintSource(assignment),
        studentAttempts.map((record) => record.session),
        "student",
      );
      const attemptHistory = buildAttemptHistory(studentAttempts);
      const latestAttempt =
        studentAttempts.find(
          (attempt) => attempt.session.id === constraintState?.latestAttempt?.id,
        ) ??
        studentAttempts[0] ??
        null;
      const latestCompletedAttempt =
        studentAttempts.find(
          (attempt) =>
            attempt.session.id === constraintState?.latestCompletedAttempt?.id,
        ) ?? null;
      const latestResult = latestCompletedAttempt
        ? getQuizSessionResultSummary(latestCompletedAttempt.session)
        : null;
      const topicPerformance = buildTopicPerformance(studentAttempts);
      const weakTopics = topicPerformance
        .filter((topic) => topic.percentage < threshold)
        .slice(0, 2)
        .map((topic) => topic.label);
      const latestScore = latestResult?.percentage ?? null;
      const averageScore = attemptHistory.length
        ? Math.round(
            attemptHistory.reduce((total, attempt) => total + attempt.percentage, 0) /
              attemptHistory.length,
          )
        : null;

      return {
        rowId: `${assignment.assignmentId}-${student.id}`,
        student,
        status: constraintState?.status ?? "active",
        latestAttempt,
        latestCompletedAttempt,
        latestAttemptId: latestCompletedAttempt?.session.id ?? null,
        attempts: attemptHistory,
        attemptsUsed: constraintState?.attemptsUsed ?? attemptHistory.length,
        attemptsRemaining: constraintState?.attemptsRemaining ?? assignment.maxAttempts,
        latestScore,
        bestScore: constraintState?.bestScore ?? latestScore,
        averageScore,
        correctCount: latestResult?.correctCount ?? 0,
        incorrectCount: latestResult?.incorrectCount ?? 0,
        totalQuestions: latestResult?.totalQuestions ?? assignment.questionCount,
        responseCount: latestResult
          ? latestResult.correctCount + latestResult.incorrectCount
          : null,
        responseDetailsAvailable: latestCompletedAttempt !== null,
        latestAttemptQuestions: buildLatestAttemptQuestions(latestCompletedAttempt),
        completionTimestamp:
          latestCompletedAttempt?.session.finishedAt ??
          latestCompletedAttempt?.session.updatedAt,
        recentCompletionTimestamp:
          latestCompletedAttempt?.session.finishedAt ??
          latestCompletedAttempt?.session.updatedAt,
        weakTopics,
        topicPerformance,
        flags: buildFlags(latestScore, attemptHistory, threshold, weakTopics),
        exhaustedAttempts: Boolean(constraintState?.exhaustedAttempts),
        missedDeadline: Boolean(constraintState?.missedDeadline),
      } satisfies TeacherStudentQuizResultRowData;
    })
    .sort((left, right) => {
      const leftRiskRank = left.flags.includes("At Risk")
        ? 0
        : left.flags.includes("Needs Review")
          ? 1
          : getStatusRank(left.status);
      const rightRiskRank = right.flags.includes("At Risk")
        ? 0
        : right.flags.includes("Needs Review")
          ? 1
          : getStatusRank(right.status);

      if (leftRiskRank !== rightRiskRank) {
        return leftRiskRank - rightRiskRank;
      }

      if (left.attemptsUsed !== right.attemptsUsed) {
        return right.attemptsUsed - left.attemptsUsed;
      }

      const leftTimestamp = new Date(
        left.completionTimestamp ?? left.student.joinedAt ?? left.student.invitedAt,
      ).getTime();
      const rightTimestamp = new Date(
        right.completionTimestamp ?? right.student.joinedAt ?? right.student.invitedAt,
      ).getTime();

      if (rightTimestamp !== leftTimestamp) {
        return rightTimestamp - leftTimestamp;
      }

      return left.student.fullName.localeCompare(right.student.fullName);
    });

  const completedRows = rows.filter((row) => row.status === "completed");
  const latestCompletedRows = completedRows.filter(
    (row) => row.latestCompletedAttempt !== null,
  );
  const latestScores = latestCompletedRows
    .filter((row) => row.latestScore !== null)
    .map((row) => ({
      studentName: row.student.fullName,
      score: row.latestScore ?? 0,
    }));
  const completedStudentsCount = completedRows.length;
  const assignedStudentsCount = assignedStudents.length;
  const studentsWithAttemptsCount = rows.filter(
    (row) => row.attemptsUsed > 0 || row.status === "in_progress",
  ).length;
  const missedDeadlineStudentsCount = rows.filter((row) => row.missedDeadline).length;
  const exhaustedAttemptsStudentsCount = rows.filter(
    (row) => row.exhaustedAttempts,
  ).length;
  // Average attempts is divided by the number of students who actually
  // ENGAGED with the quiz (made an attempt or are in-progress).  Dividing
  // by the full assigned class made the metric meaningless — a class of 30
  // with only 10 active students would show "0.3 avg attempts" instead of
  // the real "1.0 per active student".
  const averageAttemptsUsed = studentsWithAttemptsCount
    ? Number(
        (
          rows.reduce((total, row) => total + row.attemptsUsed, 0) /
          studentsWithAttemptsCount
        ).toFixed(1),
      )
    : 0;
  const averageScore = latestScores.length
    ? Math.round(
        latestScores.reduce((total, item) => total + item.score, 0) /
          latestScores.length,
      )
    : null;
  const completionRate = assignedStudentsCount
    ? Math.round((completedStudentsCount / assignedStudentsCount) * 100)
    : 0;
  const expirationRate = assignedStudentsCount
    ? Math.round((missedDeadlineStudentsCount / assignedStudentsCount) * 100)
    : 0;
  const latestCompletionTimestamp = latestCompletedRows
    .map((row) => row.completionTimestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const questionAnalytics = buildQuestionAnalytics(latestCompletedRows);
  const averageTimePerQuestionSeconds = latestCompletedRows.length
    ? Math.round(
        latestCompletedRows.reduce((total, row) => {
          const latestAttempt = row.attempts[0];

          if (!latestAttempt || latestAttempt.totalQuestions === 0) {
            return total;
          }

          return total + latestAttempt.durationSeconds / latestAttempt.totalQuestions;
        }, 0) / latestCompletedRows.length,
      )
    : null;
  const interventionStudents = rows
    .filter(
      (row) =>
        row.status !== "completed" ||
        row.flags.length > 0 ||
        (row.latestScore ?? 100) < threshold,
    )
    .map((row) => ({
      studentName: row.student.fullName,
      score: row.latestScore,
      status: row.status,
      reason:
        row.status === "active"
          ? "Has not started the assigned quiz yet."
          : row.status === "in_progress"
            ? "Started the assigned quiz but has not finished."
            : row.status === "expired"
              ? "Missed the submission deadline."
              : row.status === "attempts_exhausted"
                ? "Used every allowed attempt."
                : row.flags.includes("At Risk")
                  ? "Latest score is in the at-risk range."
                  : row.flags.includes("Needs Review")
                    ? "Latest result or topic performance suggests review."
                    : `Latest score is below ${threshold}%.`,
    }))
    .sort((left, right) => {
      if (left.status !== right.status) {
        const rank = {
          active: 0,
          in_progress: 1,
          expired: 2,
          attempts_exhausted: 3,
          completed: 4,
        } satisfies Record<TeacherQuizCompletionStatus, number>;

        return rank[left.status] - rank[right.status];
      }

      return (left.score ?? -1) - (right.score ?? -1);
    });

  return {
    assignedStudents,
    rows,
    completedStudentsCount,
    assignedStudentsCount,
    studentsWithAttemptsCount,
    missedDeadlineStudentsCount,
    exhaustedAttemptsStudentsCount,
    averageAttemptsUsed,
    expirationRate,
    averageScore,
    completionRate,
    latestCompletionTimestamp,
    scoreDistribution: buildDistribution(latestScores),
    questionAnalytics,
    interventionStudents,
    averageTimePerQuestionSeconds,
    numberOfQuestions:
      latestCompletedRows[0]?.latestCompletedAttempt?.session.quiz.questions.length ??
      assignment.questionCount,
  };
}
