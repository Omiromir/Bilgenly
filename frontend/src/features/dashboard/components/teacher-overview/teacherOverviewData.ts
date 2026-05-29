import {
  BarChart3,
  ClipboardList,
  FileText,
  Users,
  type LucideIcon,
} from "../../../../components/icons/AppIcons";
import type { SharedAssignedQuizSessionRecord } from "../../../quiz-session/quizSessionTypes";
import type { QuizQuestionRecord, QuizRecord } from "../quiz-library/quizLibraryTypes";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassRecord,
  TeacherClassStudent,
} from "../classes/teacherClassesTypes";
import {
  DEFAULT_INTERVENTION_THRESHOLD,
  buildTeacherAssignedQuizAnalytics,
} from "../teacher-analytics/teacherQuizAnalyticsUtils";
import { normalizeEmail } from "../../../auth/validation";
import { formatCurrentShortDate } from "../../settings/settingsPreferences";
import type { AssignmentInsightData } from "../../hooks/useDashboardAnalytics";

export interface TeacherOverviewStatItem {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  iconClassName: string;
}

export interface RecentQuizOverviewItem {
  quizId: string;
  title: string;
  questionCount: number;
  classLabel: string;
  subjectLabel: string;
  completionRate: number;
  /** Average score across all completed attempts (0-100), or null when no data yet. */
  avgGrade: number | null;
  assignedStudentsCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  needsReviewCount: number;
  assignmentCount: number;
  latestActivityAt: number;
  latestActivityLabel: string;
  isDraft: boolean;
  viewDetailsTarget?: {
    classId: string;
    assignmentId: string;
  };
}

export interface StrugglingTopicOverviewItem {
  topicLabel: string;
  averageMastery: number;
  studentsTracked: number;
  strugglingStudentsCount: number;
  relatedAssignmentsCount: number;
  primaryTarget?: {
    classId: string;
    assignmentId: string;
  };
}

interface TeacherOverviewInput {
  classes: TeacherClassRecord[];
  quizzes: QuizRecord[];
  sharedAssignedSessions: SharedAssignedQuizSessionRecord[];
  currentTeacherName?: string | null;
  threshold?: number;
  /** Backend analytics keyed by assignmentId. When provided, used as source of
   *  truth for completion counts, average score, and completion rate. */
  backendInsights?: Record<string, AssignmentInsightData>;
}

interface AssignmentAnalyticsSnapshot {
  teacherClass: TeacherClassRecord;
  assignment: TeacherClassAssignedQuiz;
  analytics: ReturnType<typeof buildTeacherAssignedQuizAnalytics>;
}

interface RecentQuizAccumulator {
  quizId: string;
  title: string;
  questionCount: number;
  classNames: Set<string>;
  subjectNames: Set<string>;
  assignedStudentsCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  needsReviewStudents: Set<string>;
  assignmentCount: number;
  /** Sum of per-assignment average scores (for computing overall avg). */
  gradeScoreSum: number;
  /** Number of assignments that contributed a score. */
  gradeScoreCount: number;
  latestActivityAt: number;
  latestActivityLabel: string;
  isDraft: boolean;
  viewDetailsTarget?: {
    classId: string;
    assignmentId: string;
    assignedAt: number;
  };
}

interface TopicStudentAggregate {
  correctCount: number;
  totalCount: number;
}

interface TopicAssignmentAggregate {
  classId: string;
  assignmentId: string;
  assignedAt: number;
  correctCount: number;
  totalCount: number;
}

interface TopicAccumulator {
  topicLabel: string;
  students: Map<string, TopicStudentAggregate>;
  assignments: Map<string, TopicAssignmentAggregate>;
}

function getTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatActivityDate(value?: string) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No recent activity";
  }

  return formatCurrentShortDate(date);
}

function isDraftLikeQuizStatus(status: QuizRecord["status"]) {
  return status === "draft" || status === "generated" || status === "edited";
}

function normalizeTeacherName(name?: string | null) {
  return name?.trim().toLowerCase() ?? "";
}

function getTeacherOwnedQuizzes(
  quizzes: QuizRecord[],
  currentTeacherName?: string | null,
) {
  const normalizedTeacherName = normalizeTeacherName(currentTeacherName);

  return quizzes.filter((quiz) => {
    if (quiz.ownerRole !== "teacher") {
      return false;
    }

    if (!normalizedTeacherName) {
      return true;
    }

    return normalizeTeacherName(quiz.ownerName) === normalizedTeacherName;
  });
}

function getStudentKey(student: TeacherClassStudent) {
  return student.linkedUserId || normalizeEmail(student.email) || student.id;
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

function formatTopicLabel(topic: string) {
  return topic
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function buildLatestAttemptTopicPerformance(
  attempt: SharedAssignedQuizSessionRecord["session"],
) {
  const buckets = new Map<string, { topicLabel: string; correctCount: number; totalCount: number }>();

  attempt.quiz.questions.forEach((question) => {
    const state = attempt.questionStates.find(
      (questionState) => questionState.questionId === question.id,
    );

    if (!state?.submitted) {
      return;
    }

    const tags = getQuestionInsightTags(question);

    if (!tags.length) {
      return;
    }

    tags.forEach((tag) => {
      const bucket = buckets.get(tag) ?? {
        topicLabel: formatTopicLabel(tag),
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

  return Array.from(buckets.values());
}

function buildAssignmentAnalyticsSnapshots(
  classes: TeacherClassRecord[],
  sharedAssignedSessions: SharedAssignedQuizSessionRecord[],
  threshold: number,
) {
  return classes.flatMap((teacherClass) =>
    teacherClass.assignedQuizzes.map((assignment) => ({
      teacherClass,
      assignment,
      analytics: buildTeacherAssignedQuizAnalytics(
        teacherClass,
        assignment,
        sharedAssignedSessions,
        threshold,
      ),
    })),
  );
}

function buildOverviewStats(
  teacherOwnedQuizzes: QuizRecord[],
  activeClasses: TeacherClassRecord[],
  assignmentSnapshots: AssignmentAnalyticsSnapshot[],
  backendInsights?: Record<string, AssignmentInsightData>,
) {
  const draftQuizCount = teacherOwnedQuizzes.filter((quiz) =>
    isDraftLikeQuizStatus(quiz.status),
  ).length;
  const publishedQuizCount = teacherOwnedQuizzes.filter(
    (quiz) =>
      quiz.status === "published-private" || quiz.status === "published-public",
  ).length;
  const joinedStudentsCount = activeClasses.reduce(
    (total, teacherClass) =>
      total +
      teacherClass.students.filter((student) => student.status === "joined").length,
    0,
  );

  // Prefer backend analytics scores (source of truth) over local session scores.
  const latestScores = backendInsights
    ? Object.values(backendInsights)
        .map((insight) => insight.averageScore)
        .filter((score): score is number => score !== null)
    : assignmentSnapshots.flatMap((snapshot) =>
        snapshot.analytics.rows
          .filter((row) => row.latestScore !== null)
          .map((row) => row.latestScore as number),
      );

  const averageStudentAccuracy = latestScores.length
    ? Math.round(
        latestScores.reduce((total, score) => total + score, 0) /
          latestScores.length,
      )
    : 0;

  return [
    {
      title: "Quizzes Created",
      value: String(teacherOwnedQuizzes.length),
      change: publishedQuizCount
        ? `${publishedQuizCount} published and ready to reuse`
        : "Create your first quiz to populate this library",
      icon: FileText,
      iconClassName:
        "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
    },
    {
      title: "Active Classes",
      value: String(activeClasses.length),
      change: joinedStudentsCount
        ? `${joinedStudentsCount} joined students across live rosters`
        : "No joined students in active classes yet",
      icon: Users,
      iconClassName:
        "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
    },
    {
      title: "Avg Student Accuracy",
      value: latestScores.length ? `${averageStudentAccuracy}%` : "--",
      change: latestScores.length
        ? `Based on ${latestScores.length} latest completed submissions`
        : "Waiting for completed assigned-quiz attempts",
      icon: BarChart3,
      iconClassName:
        "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand-strong)]",
    },
    {
      title: "Drafts Needing Review",
      value: String(draftQuizCount),
      change: draftQuizCount
        ? "Review, edit, or assign these unfinished quizzes"
        : "No unfinished quiz drafts right now",
      icon: ClipboardList,
      iconClassName:
        "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
    },
  ] satisfies TeacherOverviewStatItem[];
}

function buildRecentQuizzes(
  teacherOwnedQuizzes: QuizRecord[],
  assignmentSnapshots: AssignmentAnalyticsSnapshot[],
  backendInsights?: Record<string, AssignmentInsightData>,
  limit = 4,
) {
  const recentQuizzes = new Map<string, RecentQuizAccumulator>();

  teacherOwnedQuizzes.forEach((quiz) => {
    recentQuizzes.set(quiz.id, {
      quizId: quiz.id,
      title: quiz.title,
      questionCount: quiz.questions.length || quiz.questionCount,
      classNames: new Set<string>(),
      subjectNames: new Set<string>(quiz.topic ? [quiz.topic] : []),
      assignedStudentsCount: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      needsReviewStudents: new Set<string>(),
      assignmentCount: 0,
      gradeScoreSum: 0,
      gradeScoreCount: 0,
      latestActivityAt: getTimestamp(quiz.updatedAt),
      latestActivityLabel: formatActivityDate(quiz.updatedAt),
      isDraft: isDraftLikeQuizStatus(quiz.status),
    });
  });

  assignmentSnapshots.forEach(({ assignment, teacherClass, analytics }) => {
    const existing = recentQuizzes.get(assignment.quizId);
    const assignedAtTimestamp = getTimestamp(assignment.assignedAt);
    const accumulator =
      existing ??
      ({
        quizId: assignment.quizId,
        title: assignment.title,
        questionCount: assignment.questionCount,
        classNames: new Set<string>(),
        subjectNames: new Set<string>(),
        assignedStudentsCount: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        needsReviewStudents: new Set<string>(),
        assignmentCount: 0,
        gradeScoreSum: 0,
        gradeScoreCount: 0,
        latestActivityAt: assignedAtTimestamp,
        latestActivityLabel: formatActivityDate(assignment.assignedAt),
        isDraft: false,
      } satisfies RecentQuizAccumulator);

    accumulator.classNames.add(teacherClass.name);
    if (teacherClass.subject.trim()) {
      accumulator.subjectNames.add(teacherClass.subject.trim());
    }
    if (assignment.topic.trim()) {
      accumulator.subjectNames.add(assignment.topic.trim());
    }

    accumulator.questionCount = Math.max(
      accumulator.questionCount,
      assignment.questionCount,
    );
    // Prefer backend insight for this assignment when available.
    const insight = backendInsights?.[assignment.assignmentId];
    accumulator.assignmentCount += 1;
    if (insight) {
      accumulator.assignedStudentsCount += insight.totalStudents;
      accumulator.completedCount += insight.completedCount;
      accumulator.inProgressCount += insight.inProgressCount;
      accumulator.notStartedCount += Math.max(
        0,
        insight.totalStudents - insight.completedCount - insight.inProgressCount,
      );
      if (insight.averageScore !== null) {
        accumulator.gradeScoreSum += insight.averageScore;
        accumulator.gradeScoreCount += 1;
      }
    } else {
      accumulator.assignedStudentsCount += analytics.assignedStudentsCount;
      accumulator.completedCount += analytics.completedStudentsCount;
      accumulator.inProgressCount += analytics.rows.filter(
        (row) => row.status === "in-progress",
      ).length;
      accumulator.notStartedCount += analytics.rows.filter(
        (row) => row.status === "not-started",
      ).length;
      const rowScores = analytics.rows
        .filter((row) => row.latestScore !== null)
        .map((row) => row.latestScore as number);
      if (rowScores.length) {
        accumulator.gradeScoreSum += Math.round(
          rowScores.reduce((s, v) => s + v, 0) / rowScores.length,
        );
        accumulator.gradeScoreCount += 1;
      }
      analytics.rows.forEach((row) => {
        if (
          row.status !== "completed" ||
          row.flags.length > 0 ||
          (row.latestScore ?? 100) < DEFAULT_INTERVENTION_THRESHOLD
        ) {
          accumulator.needsReviewStudents.add(getStudentKey(row.student));
        }
      });
    }

    if (assignedAtTimestamp >= accumulator.latestActivityAt) {
      accumulator.latestActivityAt = assignedAtTimestamp;
      accumulator.latestActivityLabel = formatActivityDate(assignment.assignedAt);
      accumulator.viewDetailsTarget = {
        classId: teacherClass.id,
        assignmentId: assignment.id,
        assignedAt: assignedAtTimestamp,
      };
    }

    recentQuizzes.set(assignment.quizId, accumulator);
  });

  return Array.from(recentQuizzes.values())
    .sort((left, right) => right.latestActivityAt - left.latestActivityAt)
    .slice(0, limit)
    .map((quiz) => {
      const classNames = Array.from(quiz.classNames);
      const subjectNames = Array.from(quiz.subjectNames);
      const classLabel = classNames.length
        ? classNames.length === 1
          ? classNames[0]
          : `${classNames[0]} +${classNames.length - 1} more`
        : "Not assigned yet";
      const subjectLabel = subjectNames[0] ?? "General review";

      return {
        quizId: quiz.quizId,
        title: quiz.title,
        questionCount: quiz.questionCount,
        classLabel,
        subjectLabel,
        completionRate: quiz.assignedStudentsCount
          ? Math.round((quiz.completedCount / quiz.assignedStudentsCount) * 100)
          : 0,
        avgGrade: quiz.gradeScoreCount
          ? Math.round(quiz.gradeScoreSum / quiz.gradeScoreCount)
          : null,
        assignedStudentsCount: quiz.assignedStudentsCount,
        completedCount: quiz.completedCount,
        inProgressCount: quiz.inProgressCount,
        notStartedCount: quiz.notStartedCount,
        needsReviewCount: quiz.needsReviewStudents.size,
        assignmentCount: quiz.assignmentCount,
        latestActivityAt: quiz.latestActivityAt,
        latestActivityLabel: quiz.latestActivityLabel,
        isDraft: quiz.isDraft,
        viewDetailsTarget: quiz.viewDetailsTarget
          ? {
              classId: quiz.viewDetailsTarget.classId,
              assignmentId: quiz.viewDetailsTarget.assignmentId,
            }
          : undefined,
      } satisfies RecentQuizOverviewItem;
    });
}

function buildStrugglingTopics(
  assignmentSnapshots: AssignmentAnalyticsSnapshot[],
  threshold: number,
  limit = 5,
) {
  const topicMap = new Map<string, TopicAccumulator>();

  assignmentSnapshots.forEach(({ teacherClass, assignment, analytics }) => {
    analytics.rows.forEach((row) => {
      const latestAttempt = row.latestCompletedAttempt;

      if (!latestAttempt) {
        return;
      }

      const studentKey = getStudentKey(row.student);

      buildLatestAttemptTopicPerformance(latestAttempt.session).forEach(
        ({ topicLabel, correctCount, totalCount }) => {
          const normalizedTopicLabel = topicLabel.trim().toLowerCase();
          const bucket = topicMap.get(normalizedTopicLabel) ?? {
            topicLabel,
            students: new Map<string, TopicStudentAggregate>(),
            assignments: new Map<string, TopicAssignmentAggregate>(),
          };
          const studentAggregate = bucket.students.get(studentKey) ?? {
            correctCount: 0,
            totalCount: 0,
          };
          const assignmentKey = `${teacherClass.id}:${assignment.id}`;
          const assignmentAggregate = bucket.assignments.get(assignmentKey) ?? {
            classId: teacherClass.id,
            assignmentId: assignment.id,
            assignedAt: getTimestamp(assignment.assignedAt),
            correctCount: 0,
            totalCount: 0,
          };

          studentAggregate.correctCount += correctCount;
          studentAggregate.totalCount += totalCount;
          assignmentAggregate.correctCount += correctCount;
          assignmentAggregate.totalCount += totalCount;

          bucket.students.set(studentKey, studentAggregate);
          bucket.assignments.set(assignmentKey, assignmentAggregate);
          topicMap.set(normalizedTopicLabel, bucket);
        },
      );
    });
  });

  return Array.from(topicMap.values())
    .map((topic) => {
      const studentMasteries = Array.from(topic.students.values()).map((student) =>
        student.totalCount
          ? Math.round((student.correctCount / student.totalCount) * 100)
          : 0,
      );
      const averageMastery = studentMasteries.length
        ? Math.round(
            studentMasteries.reduce((total, mastery) => total + mastery, 0) /
              studentMasteries.length,
          )
        : 0;
      const strugglingStudentsCount = studentMasteries.filter(
        (mastery) => mastery < threshold,
      ).length;
      const primaryAssignment = Array.from(topic.assignments.values()).sort(
        (left, right) => {
          const leftMastery = left.totalCount
            ? Math.round((left.correctCount / left.totalCount) * 100)
            : 0;
          const rightMastery = right.totalCount
            ? Math.round((right.correctCount / right.totalCount) * 100)
            : 0;

          if (leftMastery !== rightMastery) {
            return leftMastery - rightMastery;
          }

          return right.assignedAt - left.assignedAt;
        },
      )[0];

      return {
        topicLabel: topic.topicLabel,
        averageMastery,
        studentsTracked: studentMasteries.length,
        strugglingStudentsCount,
        relatedAssignmentsCount: topic.assignments.size,
        primaryTarget: primaryAssignment
          ? {
              classId: primaryAssignment.classId,
              assignmentId: primaryAssignment.assignmentId,
            }
          : undefined,
      } satisfies StrugglingTopicOverviewItem;
    })
    .filter((topic) => topic.studentsTracked > 0)
    .sort((left, right) => {
      if (left.averageMastery !== right.averageMastery) {
        return left.averageMastery - right.averageMastery;
      }

      if (left.strugglingStudentsCount !== right.strugglingStudentsCount) {
        return right.strugglingStudentsCount - left.strugglingStudentsCount;
      }

      return right.studentsTracked - left.studentsTracked;
    })
    .slice(0, limit);
}

export function buildTeacherOverviewData({
  classes,
  quizzes,
  sharedAssignedSessions,
  currentTeacherName,
  threshold = DEFAULT_INTERVENTION_THRESHOLD,
  backendInsights,
}: TeacherOverviewInput) {
  const activeClasses = classes.filter((teacherClass) => teacherClass.status === "active");
  const teacherOwnedQuizzes = getTeacherOwnedQuizzes(quizzes, currentTeacherName);
  // Local session snapshots are still used for struggling-topic analysis (per-question tag data
  // is not yet exposed by the backend). Completion/score fields are overridden by backendInsights.
  const assignmentSnapshots = buildAssignmentAnalyticsSnapshots(
    activeClasses,
    sharedAssignedSessions,
    threshold,
  );

  return {
    stats: buildOverviewStats(teacherOwnedQuizzes, activeClasses, assignmentSnapshots, backendInsights),
    recentQuizzes: buildRecentQuizzes(teacherOwnedQuizzes, assignmentSnapshots, backendInsights),
    strugglingTopics: buildStrugglingTopics(assignmentSnapshots, threshold),
  };
}
