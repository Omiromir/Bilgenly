import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import {
  getAssignmentLevelStatus,
} from "../../../features/assignments/assignmentConstraints";
import { buildAssignedQuizAvailability } from "../../../features/assignments/assignedQuizAvailability";
import {
  DashboardButton,
  DashboardSurface,
  dashboardPageNarrowClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { buildCompletedSessionFromAttempt } from "../../../features/quiz-session/api/attemptAdapters";
import { QuizPlayer } from "../../../features/quiz-session/components/QuizPlayer";
import { QuizResultsSummary } from "../../../features/quiz-session/components/QuizResultsSummary";
import { QuizReviewList } from "../../../features/quiz-session/components/QuizReviewList";
import { QuizReviewLockedNotice } from "../../../features/quiz-session/components/QuizReviewLockedNotice";
import { QuizStartScreen } from "../../../features/quiz-session/components/QuizStartScreen";
import { getQuizFeedbackPolicy } from "../../../features/quiz-session/feedbackPolicy";
import {
  buildQuizSessionPath,
  buildQuizSessionSearch,
  type QuizLaunchNavigationState,
} from "../../../features/quiz-session/quizRouting";

interface QuizSessionPageProps {
  viewerRole: "teacher" | "student";
}

function resolveAssignmentContext(
  assignmentId: string | null,
  classes: ReturnType<typeof useTeacherClasses>["classes"],
) {
  if (!assignmentId) {
    return undefined;
  }

  for (const teacherClass of classes) {
    const assignment = teacherClass.assignedQuizzes.find(
      (candidate) => candidate.id === assignmentId,
    );

    if (!assignment) {
      continue;
    }

    return {
      assignmentId: assignment.assignmentId,
      classId: teacherClass.id,
      className: teacherClass.name,
      classSubject: teacherClass.subject,
      assignedAt: assignment.assignedAt,
      deadline: assignment.deadline,
      maxAttempts: assignment.maxAttempts,
      allowLateSubmissions: assignment.allowLateSubmissions,
      assignedBy: assignment.assignedBy,
      assignedByName: assignment.assignedByName,
      visibility: assignment.visibility,
      status: getAssignmentLevelStatus(assignment),
    } as const;
  }

  return undefined;
}

export function QuizSessionPage({ viewerRole }: QuizSessionPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const { classes } = useTeacherClasses();
  const { getQuizById } = useQuizLibrary();
  const {
    createSession,
    getLatestCompletedSession,
    getLatestInProgressSession,
    getSessionById,
    isHydrated,
    sessions,
  } = useQuizSessions();
  const {
    attempts,
    isLoading: attemptsLoading,
    error: attemptsError,
    refreshAttempts,
  } = useStudentAttempts();
  const navigationState = (location.state as QuizLaunchNavigationState | null) ?? null;
  const assignmentId = searchParams.get("assignment");
  const sessionId = searchParams.get("session");
  const quiz = quizId ? getQuizById(quizId) : undefined;
  const assignmentContext = useMemo(
    () => resolveAssignmentContext(assignmentId, classes),
    [assignmentId, classes],
  );
  // Use quizId from URL params directly so this resolves immediately on page
  // refresh, before the quiz library has finished loading from the backend.
  const latestInProgressSession = quizId
    ? getLatestInProgressSession(quizId, viewerRole, assignmentId)
    : undefined;
  const backendAssignmentState = useMemo(
    () =>
      quiz && viewerRole === "student" && assignmentContext
        ? buildAssignedQuizAvailability({
            quizId: quiz.id,
            assignmentId,
            maxAttempts: assignmentContext.maxAttempts,
            deadline: assignmentContext.deadline,
            allowLateSubmissions: assignmentContext.allowLateSubmissions,
            attempts,
            sessions,
            isLoading: attemptsLoading,
            error: attemptsError,
          })
        : null,
    [assignmentContext, assignmentId, attempts, attemptsError, attemptsLoading, quiz, sessions, viewerRole],
  );
  const requestedCompletedAttempt = useMemo(
    () =>
      sessionId && quiz
        ? attempts.find(
            (attempt) =>
              attempt.id === sessionId &&
              attempt.isCompleted &&
              attempt.quizId === quiz.id,
          ) ?? null
        : null,
    [attempts, quiz, sessionId],
  );
  const fallbackCompletedAttempt = useMemo(
    () =>
      backendAssignmentState?.latestCompletedAttempt && quiz
        ? buildCompletedSessionFromAttempt(
            quiz,
            backendAssignmentState.latestCompletedAttempt,
            {
              assignmentContext,
              attemptNumber: backendAssignmentState.attemptsUsed,
              sourceLabel: navigationState?.launchSourceLabel ?? quiz.sourceLabel,
            },
          )
        : null,
    [assignmentContext, backendAssignmentState, navigationState?.launchSourceLabel, quiz],
  );
  const requestedCompletedSession = useMemo(
    () =>
      requestedCompletedAttempt && quiz
        ? buildCompletedSessionFromAttempt(
            quiz,
            requestedCompletedAttempt,
            {
              assignmentContext,
              sourceLabel: navigationState?.launchSourceLabel ?? quiz.sourceLabel,
            },
          )
        : null,
    [assignmentContext, navigationState?.launchSourceLabel, quiz, requestedCompletedAttempt],
  );
  const latestCompletedSession =
    (quiz ? getLatestCompletedSession(quiz.id, viewerRole, assignmentId) : undefined) ??
    fallbackCompletedAttempt ??
    undefined;
  const assignmentConstraints = backendAssignmentState;
  // Do NOT gate on `quiz` here. QuizPlayer is fully self-contained and reads
  // all quiz data from the session snapshot stored in localStorage, so we can
  // resolve an active in-progress session immediately on page refresh before
  // the quiz library has loaded from the backend (Moodle-like seamless resume).
  const activeSession =
    sessionId
      ? (() => {
          const matchingSession = getSessionById(sessionId);

          if (
            matchingSession &&
            matchingSession.viewerRole === viewerRole &&
            (!quiz || matchingSession.quizId === quiz.id)
          ) {
            return matchingSession;
          }

          // requestedCompletedSession requires quiz to be loaded
          return (quiz ? requestedCompletedSession : null) ?? undefined;
        })()
      : undefined;
  const resolvedBackLink = useMemo(() => {
    if (navigationState?.returnToPath && navigationState.returnToLabel) {
      return {
        path: navigationState.returnToPath,
        label: navigationState.returnToLabel,
        state: navigationState.returnToState,
      };
    }

    if (viewerRole === "student" && assignmentContext) {
      return {
        path: "/dashboard/student/classes",
        label: "Back to classes",
        state: undefined,
      };
    }

    return {
      path:
        viewerRole === "teacher"
          ? "/dashboard/teacher/quiz-library"
          : "/dashboard/student/quiz-library",
      label:
        viewerRole === "teacher"
          ? "Back to quiz library"
          : "Back to quiz library",
      state: undefined,
    };
  }, [assignmentContext, navigationState, viewerRole]);

  // Refetch backend attempts when quiz is completed to update attempt counts
  useEffect(() => {
    if (viewerRole === "student" && activeSession?.status === "completed") {
      void refreshAttempts();
    }
  }, [activeSession?.status, activeSession?.finishedAt, refreshAttempts, viewerRole]);

  // Auto-resume: once localStorage is hydrated, if there is an in-progress
  // session but the URL doesn't point at it (e.g. after a page refresh that
  // stripped the ?session= param, or a direct navigation to the quiz page),
  // immediately redirect into that session so the student can't accidentally
  // start a duplicate attempt.
  const [isStarting, setIsStarting] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const autoResumedRef = useRef(false);
  useEffect(() => {
    if (!isHydrated || autoResumedRef.current) {
      return;
    }

    // Only auto-resume when there is no active session already showing
    if (activeSession?.status === "in-progress") {
      return;
    }

    if (!latestInProgressSession || !quizId) {
      return;
    }

    autoResumedRef.current = true;
    navigate(
      `${buildQuizSessionPath(viewerRole, quizId)}${buildQuizSessionSearch({
        sessionId: latestInProgressSession.id,
        assignmentId,
      })}`,
      { replace: true, state: navigationState ?? undefined },
    );
  }, [
    activeSession?.status,
    assignmentId,
    isHydrated,
    latestInProgressSession,
    navigate,
    navigationState,
    quizId,
    viewerRole,
  ]);

  // Block all interaction until localStorage sessions are hydrated.
  // This is the primary guard that prevents the start-button race condition
  // on page refresh (student pressing Start before their in-progress session
  // is visible in the React session list).
  if (!isHydrated) {
    return (
      <div className={dashboardPageNarrowClassName}>
        <DashboardSurface radius="xl" padding="lg">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 rounded-xl bg-[var(--dashboard-surface-muted)]" />
            <div className="h-10 w-2/3 rounded-xl bg-[var(--dashboard-surface-muted)]" />
            <div className="h-4 w-full rounded-xl bg-[var(--dashboard-surface-muted)]" />
            <div className="h-4 w-5/6 rounded-xl bg-[var(--dashboard-surface-muted)]" />
            <div className="mt-6 flex gap-3">
              <div className="h-11 w-36 rounded-xl bg-[var(--dashboard-surface-muted)]" />
              <div className="h-11 w-24 rounded-xl bg-[var(--dashboard-surface-muted)]" />
            </div>
          </div>
        </DashboardSurface>
      </div>
    );
  }

  // Fast-path: if there is an active in-progress session, jump straight into
  // the quiz player without waiting for the quiz library to finish loading.
  // QuizPlayer is self-contained — it reads all quiz data from the session
  // snapshot persisted in localStorage, so no quiz-library data is needed.
  // This gives Moodle-like seamless resume: refresh → instantly back in quiz.
  if (activeSession?.status === "in-progress") {
    return (
      <div className="mx-auto max-w-[1360px] space-y-6">
        <div className="space-y-4">
          <DashboardButton asChild type="button" size="lg" variant="ghost">
            <Link to={resolvedBackLink.path} state={resolvedBackLink.state}>
              Save and exit
            </Link>
          </DashboardButton>
          <QuizPlayer sessionId={activeSession.id} />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={dashboardPageNarrowClassName}>
        <DashboardSurface radius="xl" padding="lg" className="space-y-4">
          <h1 className="text-[2rem] font-semibold text-[var(--dashboard-text-strong)]">
            Quiz not found
          </h1>
          <p className="text-sm leading-7 text-[var(--dashboard-text-soft)]">
            This quiz is no longer available in your current library context.
          </p>
          <DashboardButton asChild type="button" size="lg">
            <Link to={resolvedBackLink.path} state={resolvedBackLink.state}>
              {resolvedBackLink.label}
            </Link>
          </DashboardButton>
        </DashboardSurface>
      </div>
    );
  }

  const launchSourceType =
    navigationState?.launchSourceType ?? (assignmentContext ? "assigned" : "quiz-library");
  const launchSourceLabel =
    navigationState?.launchSourceLabel ??
    (assignmentContext ? `${assignmentContext.className} assignment` : quiz.sourceLabel);

  const openSession = (nextSessionId?: string) => {
    navigate(
      `${buildQuizSessionPath(viewerRole, quiz.id)}${buildQuizSessionSearch({
        sessionId: nextSessionId,
        assignmentId,
      })}`,
      {
        replace: false,
        state: navigationState ?? undefined,
      },
    );
  };

  const handleStart = async () => {
    if (assignmentConstraints && !assignmentConstraints.canStart) {
      if (assignmentConstraints.canResume && latestInProgressSession) {
        openSession(latestInProgressSession.id);
      } else if (assignmentConstraints.status === "attempts_exhausted") {
        toast.error("You have used all attempts for this quiz.");
      } else if (assignmentConstraints.deadlinePassed) {
        toast.error("The deadline for this quiz has passed.");
      }

      return;
    }

    setIsStarting(true);

    try {
      const nextSession = await createSession(quiz, {
        viewerRole,
        sourceType: launchSourceType,
        sourceLabel: launchSourceLabel,
        assignmentContext,
      });

      openSession(nextSession.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start that quiz.",
      );
      if (viewerRole === "student") {
        void refreshAttempts();
      }
      setIsStarting(false);
    }
  };

  const handleResume = () => {
    if (!latestInProgressSession) {
      return;
    }

    setIsResuming(true);
    openSession(latestInProgressSession.id);
  };

  const handleReviewLatest = () => {
    if (!latestCompletedSession) {
      return;
    }

    openSession(latestCompletedSession.id);
  };

  return (
    <div
      className={
        activeSession?.status === "in-progress"
          ? "mx-auto max-w-[1360px] space-y-6"
          : dashboardPageNarrowClassName
      }
    >
      {activeSession?.status === "completed" ? (
        (() => {
          const reviewPolicy = getQuizFeedbackPolicy({
            sourceType: activeSession.sourceType,
            viewerRole: activeSession.viewerRole,
            isAssigned: Boolean(activeSession.assignmentContext),
            attemptsUsed: assignmentConstraints?.attemptsUsed ?? 0,
            maxAttempts: assignmentConstraints?.maxAttempts ?? null,
            hasInProgressAttempt: false,
          });

          return (
            <div className="space-y-6">
              <QuizResultsSummary
                session={activeSession}
                // Personal-library quizzes (no `assignmentConstraints`) have no
                // attempt limit or deadline — let the student retake them freely.
                // For assigned quizzes, defer to the constraint's `canStart` flag.
                onRetake={
                  !assignmentConstraints || assignmentConstraints.canStart
                    ? handleStart
                    : undefined
                }
                returnLink={resolvedBackLink}
                secondaryLink={
                  viewerRole === "student"
                    ? {
                        path: "/dashboard/student/results",
                        label: "Open My Results",
                      }
                    : undefined
                }
              />
              {reviewPolicy.showDetailedReview ? (
                <QuizReviewList session={activeSession} />
              ) : (
                <QuizReviewLockedNotice
                  attemptsUsed={assignmentConstraints?.attemptsUsed ?? 0}
                  maxAttempts={assignmentConstraints?.maxAttempts ?? 0}
                  reason={reviewPolicy.lockReason}
                />
              )}
            </div>
          );
        })()
      ) : activeSession?.status === "in-progress" ? (
        <div className="space-y-4">
          <DashboardButton asChild type="button" size="lg" variant="ghost">
            <Link to={resolvedBackLink.path} state={resolvedBackLink.state}>
              Save and exit
            </Link>
          </DashboardButton>
          <QuizPlayer sessionId={activeSession.id} />
        </div>
      ) : (
        <QuizStartScreen
          quiz={quiz}
          assignmentContext={assignmentContext}
          assignmentConstraints={assignmentConstraints}
          latestInProgressSession={latestInProgressSession}
          latestCompletedSession={latestCompletedSession}
          isStarting={isStarting}
          isResuming={isResuming}
          onStart={assignmentConstraints?.canStart === false ? undefined : handleStart}
          onResume={latestInProgressSession ? handleResume : undefined}
          onReviewLatest={latestCompletedSession ? handleReviewLatest : undefined}
          backLink={resolvedBackLink}
        />
      )}
    </div>
  );
}
