import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAssignmentAnalytics,
  getMyAnalytics,
  getQuizAnalytics,
} from "../api/analyticsApi";
import { useAuth } from "../../../app/providers/AuthProvider";
import type {
  AssignmentAnalyticsDto,
  MyAnalyticsDto,
  QuizAnalyticsDto,
  StudentAttemptAnalyticsDto,
  StudentAttemptQuestionResponseDto,
} from "../api/dashboardApiTypes";
import type { TeacherClassAssignedQuiz, TeacherClassRecord, TeacherClassStudent } from "../components/classes/teacherClassesTypes";
import {
  DEFAULT_INTERVENTION_THRESHOLD,
  type TeacherAssignedQuizAnalytics,
  type TeacherAttemptQuestionResponse,
  type TeacherQuestionAnalyticsItem,
  type TeacherQuizAttemptHistoryItem,
  type TeacherStudentQuizResultRowData,
  type TeacherInsightFlag,
} from "../components/teacher-analytics/teacherQuizAnalyticsUtils";
import { getRequestErrorMessage } from "../../../lib/apiClient";

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

function useAsyncResource<T>(
  enabled: boolean,
  deps: ReadonlyArray<unknown>,
  loader: () => Promise<T>,
  fallbackErrorMessage: string,
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        data: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let isCancelled = false;

    setState((current) => ({
      data: current.data,
      isLoading: true,
      error: null,
    }));

    loader()
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setState({
          data,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setState({
          data: null,
          isLoading: false,
          error: getRequestErrorMessage(error, fallbackErrorMessage),
        });
      });

    return () => {
      isCancelled = true;
    };
  }, deps);

  return state;
}

function buildFlags(
  row: Pick<TeacherStudentQuizResultRowData, "latestScore" | "missedDeadline" | "exhaustedAttempts" | "status">,
  threshold: number,
) {
  const flags: TeacherInsightFlag[] = [];

  if (row.latestScore !== null && row.latestScore < 50) {
    flags.push("At Risk");
    return flags;
  }

  if (row.missedDeadline || row.exhaustedAttempts) {
    flags.push("Needs Review");
    return flags;
  }

  if (row.latestScore !== null && row.latestScore < threshold) {
    flags.push("Needs Review");
  }

  return flags;
}

function mapStudentResultStatus(status: string): TeacherStudentQuizResultRowData["status"] {
  switch (status) {
    case "completed":
      return "completed";
    case "in_progress":
      return "in_progress";
    case "expired":
      return "expired";
    case "attempts_exhausted":
      return "attempts_exhausted";
    default:
      return "active";
  }
}

function buildQuestionAnalyticsItems(
  assignmentAnalytics: AssignmentAnalyticsDto,
  quizAnalytics: QuizAnalyticsDto | null,
) {
  const quizQuestionsById = new Map(
    (quizAnalytics?.questions ?? []).map((question, index) => [
      question.questionId,
      { question, index },
    ]),
  );

  return assignmentAnalytics.questionStats.map((question, index) => {
    const fromQuizAnalytics = quizQuestionsById.get(question.questionId);
    const totalAnswered = question.totalAnswered;
    const correctCount = question.correctAnswers;
    const missCount = Math.max(totalAnswered - correctCount, 0);

    return {
      questionId: question.questionId,
      questionNumber: fromQuizAnalytics?.index !== undefined ? fromQuizAnalytics.index + 1 : index + 1,
      prompt: question.questionText || fromQuizAnalytics?.question.questionText || `Question ${index + 1}`,
      explanation: undefined,
      correctRate: Math.round(question.correctPercentage),
      missRate: totalAnswered ? Math.round((missCount / totalAnswered) * 100) : 0,
      correctCount,
      missCount,
      attemptCount: totalAnswered,
      studentNamesMissed: [],
      tags: [],
    } satisfies TeacherQuestionAnalyticsItem;
  });
}

function buildScoreDistribution(rows: TeacherStudentQuizResultRowData[]) {
  const buckets = [
    { label: "85-100", min: 85, max: 100, count: 0, studentNames: [] as string[] },
    { label: "70-84", min: 70, max: 84, count: 0, studentNames: [] as string[] },
    { label: "50-69", min: 50, max: 69, count: 0, studentNames: [] as string[] },
    { label: "0-49", min: 0, max: 49, count: 0, studentNames: [] as string[] },
  ];

  rows.forEach((row) => {
    if (row.latestScore === null) {
      return;
    }

    const bucket = buckets.find(
      (candidate) => row.latestScore !== null && row.latestScore >= candidate.min && row.latestScore <= candidate.max,
    );

    if (!bucket) {
      return;
    }

    bucket.count += 1;
    bucket.studentNames.push(row.student.fullName);
  });

  return buckets;
}

function mapAttemptHistory(
  attempts: StudentAttemptAnalyticsDto[],
): TeacherQuizAttemptHistoryItem[] {
  return [...attempts]
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    )
    .map((attempt) => ({
      id: attempt.attemptId,
      finishedAt: attempt.submittedAt,
      updatedAt: attempt.submittedAt,
      percentage: attempt.score,
      correctCount: attempt.correctAnswers,
      incorrectCount: attempt.incorrectAnswers,
      totalQuestions: attempt.totalQuestions,
      responsesCount: attempt.responsesCount,
      durationSeconds: 0,
    }));
}

function mapQuestionResponses(
  questions: StudentAttemptQuestionResponseDto[],
): TeacherAttemptQuestionResponse[] {
  return [...questions]
    .sort((left, right) => left.position - right.position)
    .map((question, index) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      questionNumber: question.position > 0 ? question.position : index + 1,
      explanation: question.explanation,
      selectedAnswerId: question.selectedAnswerId,
      selectedAnswerText: question.selectedAnswerText,
      correctAnswerId: question.correctAnswerId,
      correctAnswerText: question.correctAnswerText,
      isCorrect: question.isCorrect,
      answerOptions: question.answerOptions.map((option) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    }));
}

function toTeacherAssignmentAnalytics(
  assignmentAnalytics: AssignmentAnalyticsDto,
  teacherClass: TeacherClassRecord,
  assignment: TeacherClassAssignedQuiz,
  quizAnalytics: QuizAnalyticsDto | null,
  threshold = DEFAULT_INTERVENTION_THRESHOLD,
) {
  const studentsById = new Map(
    teacherClass.students.map((student) => [
      student.linkedUserId || student.id,
      student,
    ]),
  );
  const studentsByEmail = new Map(
    teacherClass.students.map((student) => [student.email.trim().toLowerCase(), student]),
  );
  const rows = assignmentAnalytics.studentResults.map((studentResult) => {
    const matchedStudent =
      studentsById.get(studentResult.studentId) ??
      studentsByEmail.get(studentResult.email.trim().toLowerCase()) ??
      ({
        id: studentResult.studentId,
        fullName: studentResult.studentName,
        email: studentResult.email,
        status: "joined",
        invitationStatus: "accepted",
        invitedAt: studentResult.lastAttemptAt ?? teacherClass.createdAt,
        joinedAt: teacherClass.createdAt,
        linkedUserId: studentResult.studentId,
      } satisfies TeacherClassStudent);
    const status = mapStudentResultStatus(studentResult.status);
    const latestScore = studentResult.latestScore;
    const totalQuestions = studentResult.totalQuestions ?? assignmentAnalytics.questionCount;
    const correctCount =
      studentResult.correctAnswers !== null && studentResult.correctAnswers !== undefined
        ? studentResult.correctAnswers
        : latestScore !== null
          ? Math.round((latestScore / 100) * totalQuestions)
          : 0;
    const incorrectCount =
      studentResult.incorrectAnswers ?? Math.max(totalQuestions - correctCount, 0);
    const exhaustedAttempts = status === "attempts_exhausted";
    const missedDeadline = studentResult.missedDeadline;
    const attemptHistory = mapAttemptHistory(studentResult.attempts ?? []);
    const latestAttemptQuestions = mapQuestionResponses(
      studentResult.latestAttemptQuestions ?? [],
    );
    const hasCompletedAttempt = studentResult.attemptsUsed > 0 && latestScore !== null;
    const responseCount =
      hasCompletedAttempt
        ? studentResult.responsesCount ?? correctCount + incorrectCount
        : null;

    const rowBase = {
      rowId: `${assignment.assignmentId}-${matchedStudent.id}`,
      student: matchedStudent,
      status,
      latestAttempt: null,
      latestCompletedAttempt: null,
      latestAttemptId: studentResult.latestAttemptId,
      attempts: attemptHistory,
      attemptsUsed: studentResult.attemptsUsed,
      attemptsRemaining: studentResult.attemptsRemaining,
      latestScore,
      bestScore: studentResult.bestScore,
      averageScore: studentResult.averageScore,
      correctCount,
      incorrectCount,
      totalQuestions,
      responseCount,
      responseDetailsAvailable:
        Boolean(studentResult.hasDetailedResponses) && latestAttemptQuestions.length > 0,
      latestAttemptQuestions,
      completionTimestamp: studentResult.lastAttemptAt ?? undefined,
      recentCompletionTimestamp: studentResult.lastAttemptAt ?? undefined,
      weakTopics: [],
      topicPerformance: [],
      flags: [] as TeacherInsightFlag[],
      exhaustedAttempts,
      missedDeadline,
    } satisfies TeacherStudentQuizResultRowData;

    return {
      ...rowBase,
      flags: buildFlags(rowBase, threshold),
    } satisfies TeacherStudentQuizResultRowData;
  });
  const questionAnalytics = buildQuestionAnalyticsItems(assignmentAnalytics, quizAnalytics);
  const completedStudentsCount = assignmentAnalytics.completedCount;
  const assignedStudentsCount = assignmentAnalytics.totalStudents;
  const studentsWithAttemptsCount = rows.filter((row) => row.attemptsUsed > 0).length;
  const latestCompletionTimestamp = rows
    .map((row) => row.completionTimestamp)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  // Only surface students who genuinely need teacher action:
  //   • expired          — deadline passed, student never submitted
  //   • attempts_exhausted — used every allowed attempt (possibly still failing)
  //   • At Risk flag     — latest score < 50 %
  //   • Needs Review flag — missed deadline / exhausted / score below threshold
  //   • completed but still below threshold (edge case: threshold changed after submit)
  //
  // "active" (hasn't started) and "in_progress" (still taking) are normal
  // operational states and must NOT appear here — showing them confused teachers
  // into thinking students who were simply working were in trouble.
  const interventionStudents = rows
    .filter(
      (row) =>
        row.status === "expired" ||
        row.status === "attempts_exhausted" ||
        row.flags.length > 0 ||
        (row.status === "completed" && (row.latestScore ?? 100) < threshold),
    )
    .map((row) => ({
      studentName: row.student.fullName,
      score: row.latestScore,
      status: row.status,
      reason:
        row.status === "expired"
          ? "Missed the submission deadline."
          : row.status === "attempts_exhausted"
            ? "Used every allowed attempt without passing."
            : row.flags.includes("At Risk")
              ? "Latest score is below 50% — high-risk of falling behind."
              : row.flags.includes("Needs Review")
                ? "Score is below the intervention threshold."
                : `Completed but scored below ${threshold}%.`,
    }));

  return {
    assignedStudents: teacherClass.students.filter((student) => student.status === "joined"),
    rows,
    completedStudentsCount,
    assignedStudentsCount,
    studentsWithAttemptsCount,
    missedDeadlineStudentsCount: assignmentAnalytics.missedDeadlineCount,
    exhaustedAttemptsStudentsCount: rows.filter((row) => row.exhaustedAttempts).length,
    averageAttemptsUsed: assignmentAnalytics.avgAttemptsUsed,
    expirationRate: assignedStudentsCount
      ? Math.round((assignmentAnalytics.missedDeadlineCount / assignedStudentsCount) * 100)
      : 0,
    averageScore: assignmentAnalytics.averageScore === null ? null : Math.round(assignmentAnalytics.averageScore),
    completionRate: Math.round(assignmentAnalytics.completionRate),
    latestCompletionTimestamp,
    scoreDistribution: buildScoreDistribution(rows),
    questionAnalytics,
    interventionStudents,
    averageTimePerQuestionSeconds: null,
    numberOfQuestions: assignmentAnalytics.questionCount,
  } satisfies TeacherAssignedQuizAnalytics;
}

export function useAssignmentAnalytics(
  teacherClass: TeacherClassRecord | null,
  assignment: TeacherClassAssignedQuiz | null,
  threshold = DEFAULT_INTERVENTION_THRESHOLD,
) {
  const assignmentState = useAsyncResource<AssignmentAnalyticsDto>(
    Boolean(assignment?.assignmentId),
    [assignment?.assignmentId],
    () => getAssignmentAnalytics(assignment!.assignmentId),
    "Unable to load assignment analytics.",
  );
  const quizState = useAsyncResource<QuizAnalyticsDto>(
    Boolean(assignment?.quizId),
    [assignment?.quizId],
    () => getQuizAnalytics(assignment!.quizId),
    "Unable to load quiz analytics.",
  );

  const data = useMemo(() => {
    if (!teacherClass || !assignment || !assignmentState.data) {
      return null;
    }

    return toTeacherAssignmentAnalytics(
      assignmentState.data,
      teacherClass,
      assignment,
      quizState.data,
      threshold,
    );
  }, [assignment, assignmentState.data, quizState.data, teacherClass, threshold]);

  return {
    data,
    isLoading: assignmentState.isLoading || quizState.isLoading,
    error: assignmentState.error ?? quizState.error,
    rawAssignmentAnalytics: assignmentState.data,
    rawQuizAnalytics: quizState.data,
  };
}

export function useQuizAnalytics(quizId: string | null) {
  return useAsyncResource<QuizAnalyticsDto>(
    Boolean(quizId),
    [quizId],
    () => getQuizAnalytics(quizId!),
    "Unable to load quiz analytics.",
  );
}

// useMyAnalytics uses React Query so the result is shared across all consumers
// (StudentResultsPage + useProfile) — navigating between them hits the cache
// rather than issuing a second network request.
// The userId is included in the cache key so switching accounts never leaks data.
export function useMyAnalytics(enabled = true) {
  const { currentUser, token } = useAuth();
  const userId = currentUser?.id ?? null;

  const query = useQuery({
    queryKey: ["myAnalytics", userId],
    queryFn: getMyAnalytics,
    enabled: enabled && Boolean(token && userId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? getRequestErrorMessage(query.error, "Unable to load student analytics.")
      : null,
  };
}

export interface AssignmentInsightData {
  attemptedStudentsCount: number;
  exhaustedStudentsCount: number;
  missedDeadlineCount: number;
  completedCount: number;
  totalStudents: number;
  averageScore: number | null;
  completionRate: number;
  inProgressCount: number;
}

export function useAssignmentInsights(assignments: TeacherClassAssignedQuiz[]) {
  const [data, setData] = useState<Record<string, AssignmentInsightData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignmentIds = useMemo(
    () => assignments.map((assignment) => assignment.assignmentId).join("|"),
    [assignments],
  );

  useEffect(() => {
    if (!assignmentIds) {
      setData({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    const requestIds = assignmentIds.split("|").filter(Boolean);

    setIsLoading(true);
    setError(null);

    Promise.all(
      requestIds.map(async (assignmentId) => {
        const analytics = await getAssignmentAnalytics(assignmentId);
        return [
          assignmentId,
          {
            attemptedStudentsCount: analytics.studentResults.filter(
              (student) => student.attemptsUsed > 0,
            ).length,
            exhaustedStudentsCount: analytics.studentResults.filter(
              (student) => student.status === "attempts_exhausted",
            ).length,
            missedDeadlineCount: analytics.missedDeadlineCount,
            completedCount: analytics.completedCount,
            totalStudents: analytics.totalStudents,
            averageScore: analytics.averageScore,
            completionRate: analytics.completionRate,
            inProgressCount: analytics.inProgressCount,
          } satisfies AssignmentInsightData,
        ] as const;
      }),
    )
      .then((entries) => {
        if (isCancelled) {
          return;
        }

        setData(Object.fromEntries(entries));
        setIsLoading(false);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setError(getRequestErrorMessage(error, "Unable to load class assignment insights."));
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [assignmentIds]);

  return { data, isLoading, error };
}
