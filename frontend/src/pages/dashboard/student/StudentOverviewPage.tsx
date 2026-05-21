import { BookOpen, Medal, Timer } from "../../../components/icons/AppIcons";
import { Link } from "react-router";
import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import logoPng from "../../../assets/logo.png";
import { cn } from "../../../components/ui/utils";
import { CtaPanel } from "../../../features/dashboard/components/CtaPanel";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardIconTextRowClassName,
  dashboardPageClassName,
  dashboardSectionStackClassName,
  dashboardSplitGridClassName,
  dashboardStatsGridClassName,
  dashboardTextToneClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyAssignedQuizzesState } from "../../../features/dashboard/components/quiz-library/QuizLibraryComponents";
import { buildStudentQuizLibrarySources } from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import { useQuizLauncher } from "../../../features/quiz-session/useQuizLauncher";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import {
  buildStudentOverviewData,
} from "../../../features/dashboard/components/student-overview/studentOverviewData";
import { getQuizSessionResultSummary } from "../../../features/quiz-session/quizSessionUtils";

const scoreToneClassName = {
  blue: dashboardTextToneClassName.brand,
  emerald: dashboardTextToneClassName.success,
} as const;

export function StudentOverviewPage() {
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const { sessions, getCompletedSessionsForRole } = useQuizSessions();
  const { openQuiz } = useQuizLauncher();
  const completedSessions = getCompletedSessionsForRole("student");
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
  );
  const {
    attempts: allAttempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useStudentAttempts();

  // Completed attempts from backend, sorted newest first. This is the
  // single source of truth for overview stats — no localStorage dependency.
  const completedAttempts = useMemo(
    () =>
      allAttempts
        .filter((attempt) => attempt.isCompleted)
        .sort(
          (left, right) =>
            new Date(right.dateTaken).getTime() - new Date(left.dateTaken).getTime(),
        ),
    [allAttempts],
  );

  const studentSources = useMemo(
    () =>
      buildStudentQuizLibrarySources(
        classes,
        quizzes,
        studentIdentity,
        sessions,
        allAttempts,
        attemptsLoading,
        attemptsError,
      ),
    [allAttempts, attemptsError, attemptsLoading, classes, quizzes, sessions, studentIdentity],
  );
  // Map backendAttemptId → accurate points-based percentage from local session.
  // Overrides the backend's (correctAnswers/totalQuestions) score with the
  // correct (earnedPoints/totalPoints) value wherever a local session exists.
  const correctedScoreByAttemptId = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of completedSessions) {
      if (session.backendAttemptId) {
        map.set(session.backendAttemptId, getQuizSessionResultSummary(session).percentage);
      }
    }
    return map;
  }, [completedSessions]);

  const overview = useMemo(
    () =>
      buildStudentOverviewData({
        studentSources,
        completedAttempts,
        attemptsLoading,
        correctedScoreByAttemptId,
      }),
    [attemptsLoading, completedAttempts, studentSources, correctedScoreByAttemptId],
  );
  const assignedPreview = useMemo(
    () =>
      [...studentSources.assigned]
        .sort(
          (left, right) =>
            new Date(right.assignmentContext.assignedAt).getTime() -
            new Date(left.assignmentContext.assignedAt).getTime(),
        )
        .slice(0, 3),
    [studentSources.assigned],
  );

  const getAssignedStatusClassName = (status: string) => {
    if (status === "completed") {
      return "text-[var(--dashboard-success)]";
    }

    if (status === "in_progress") {
      return "text-[var(--dashboard-brand)]";
    }

    if (status === "expired") {
      return "text-[var(--dashboard-danger)]";
    }

    if (status === "attempts_exhausted") {
      return "text-[var(--dashboard-text-soft)]";
    }

    return "text-[var(--dashboard-warning)]";
  };

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your class invite",
        description:
          "A pending class invite is waiting in Notifications. Accept it to unlock assigned quizzes for that class.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "No class memberships yet",
        description:
          "Assigned quizzes will appear here after you join a class through the class invite flow.",
      };
    }

    return {
      title: "No assigned quizzes yet",
      description:
        "You are already part of a class, but no assigned quizzes are available there yet.",
    };
  };

  const assignedEmptyState = getAssignedEmptyState();
  const assignedCount = studentSources.assigned.length;
  const actionableAssignedCount = studentSources.assigned.filter(
    (assignment) =>
      assignment.assignmentState.canStart || assignment.assignmentState.canResume,
  ).length;

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title="Welcome back, Student!"
        subtitle="Keep up the great work on your learning journey."
      />

      <CtaPanel
        title="Continue Your Learning"
        description={
          actionableAssignedCount
            ? `You have ${actionableAssignedCount} class-assigned ${actionableAssignedCount === 1 ? "quiz" : "quizzes"} ready. Jump back in and keep your streak going.`
            : assignedCount
              ? "Your assigned quiz results are synced. Open your classes or quiz library to review completed work and check which assignments still have attempts left."
            : "Jump into your quiz library, discover new practice sets, and stay ready for your next assigned quiz."
        }
        variant="gradient"
        actions={
          <>
            <DashboardButton asChild variant="inverse" size="xl">
              <Link to="/dashboard/student/classes">
                Open My Classes
              </Link>
            </DashboardButton>
            <DashboardButton asChild variant="hero" size="xl">
              <Link to="/dashboard/student/quiz-library">
                Open Quiz Library
              </Link>
            </DashboardButton>
          </>
        }
        aside={
          <div className="hidden h-40 w-40 items-center justify-center rounded-[28px] bg-white/12 lg:flex">
            <img
              src={logoPng}
              alt="Bilgenly"
              className="h-20 w-20 object-contain opacity-95"
            />
          </div>
        }
      />

      <div className={dashboardStatsGridClassName}>
        {attemptsLoading
          ? [0, 1, 2, 3].map((i) => (
              <DashboardSurface key={i} asChild radius="xl" padding="md">
                <article>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-4 w-36 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                    </div>
                    <div className="h-11 w-11 animate-pulse rounded-[14px] bg-[var(--dashboard-surface-muted)]" />
                  </div>
                </article>
              </DashboardSurface>
            ))
          : overview.stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
      </div>

      <div className={dashboardSplitGridClassName}>
        <SectionCard title="Assigned Quizzes">
          <div className={dashboardSectionStackClassName}>
            {attemptsLoading ? (
              [0, 1].map((i) => (
                <DashboardSurface key={i} asChild radius="md" padding="sm">
                  <article>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                        <div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                        <div className="mt-1 flex gap-5">
                          <div className="h-4 w-20 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                          <div className="h-4 w-16 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                        </div>
                      </div>
                      <div className="h-4 w-16 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                    </div>
                    <div className="mt-4 h-4 w-36 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                    <div className="mt-5 h-10 w-full animate-pulse rounded-[14px] bg-[var(--dashboard-surface-muted)]" />
                  </article>
                </DashboardSurface>
              ))
            ) : assignedPreview.length ? (
              assignedPreview.map((assignment) => (
                <DashboardSurface
                  asChild
                  key={assignment.assignmentContext.assignmentId}
                  radius="md"
                  padding="sm"
                >
                  <article>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                          {assignment.title}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                          {assignment.assignmentContext.className}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-5 text-sm text-[var(--dashboard-text-soft)]">
                          <span className={dashboardIconTextRowClassName}>
                            <BookOpen className="h-4 w-4" />
                            {assignment.questionCount}{" "}
                            {assignment.questionCount === 1 ? "question" : "questions"}
                          </span>
                          <span className={dashboardIconTextRowClassName}>
                            <Timer className="h-4 w-4" />
                            {assignment.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          getAssignedStatusClassName(assignment.assignmentState.status),
                        )}
                      >
                        {assignment.assignmentState.displayStatusLabel}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-[var(--dashboard-text-soft)]">
                      {assignment.practiceProgressLabel}
                    </p>

                    <DashboardButton
                      type="button"
                      size="lg"
                      className="mt-5 w-full"
                      disabled={
                        assignment.assignmentState.isLoading ||
                        (!assignment.assignmentState.canStart &&
                          !assignment.assignmentState.canResume &&
                          !assignment.assignmentState.canReview)
                      }
                      onClick={() =>
                        openQuiz({
                          quizId: assignment.id,
                          viewerRole: "student",
                          assignmentId: assignment.assignmentContext.assignmentId,
                          preferredSession:
                            assignment.assignmentState.canReview
                              ? "completed"
                              : assignment.assignmentState.canResume
                                ? "in-progress"
                                : undefined,
                          navigationState: {
                            launchSourceType: "overview",
                            launchSourceLabel: "Student overview",
                            returnToPath: "/dashboard/student/overview",
                            returnToLabel: "Back to overview",
                          },
                        })
                      }
                    >
                      {assignment.assignmentState.primaryActionLabel}
                    </DashboardButton>
                  </article>
                </DashboardSurface>
              ))
            ) : (
              <EmptyAssignedQuizzesState
                title={assignedEmptyState.title}
                description={assignedEmptyState.description}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent Results">
          <div className={dashboardSectionStackClassName}>
            {attemptsLoading ? (
              [0, 1, 2].map((i) => (
                <article
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-[18px] px-3 py-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 animate-pulse rounded-full bg-[var(--dashboard-surface-muted)]" />
                    <div className="space-y-2">
                      <div className="h-5 w-40 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-4 w-24 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                    </div>
                  </div>
                  <div className="h-9 w-14 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                </article>
              ))
            ) : overview.recentResults.length ? (
              overview.recentResults.map((result, index) => (
                <article
                  key={`${result.title}-${result.date}`}
                  className="flex items-start justify-between gap-4 rounded-[18px] px-3 py-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-[var(--dashboard-warning)]">
                      {index < 2 ? (
                        <Medal className="h-5 w-5" />
                      ) : (
                        <span className="inline-block h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-[1.12rem] font-semibold text-[var(--dashboard-text-strong)]">
                        {result.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-faint)]">
                        {result.date}
                      </p>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                        {result.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[1.8rem] font-semibold tracking-[-0.03em]",
                      scoreToneClassName[result.scoreTone],
                    )}
                  >
                    {result.score}
                  </span>
                </article>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-6">
                <p className="font-semibold text-[var(--dashboard-text-strong)]">
                  No recent results yet
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                  Finish your first quiz and your latest scores will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
