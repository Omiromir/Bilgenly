import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { BookOpen, Hash, Timer } from "../../../components/icons/AppIcons";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../../components/ui/input-otp";
import { cn } from "../../../components/ui/utils";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  getAssignmentStatusTone,
} from "../../../features/assignments/assignmentConstraints";
import { formatTeacherClassDate } from "../../../features/dashboard/components/classes/teacherClassesUtils";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardIconTextRowClassName,
  dashboardPageNarrowClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyAssignedQuizzesState } from "../../../features/dashboard/components/quiz-library/QuizLibraryComponents";
import {
  buildStudentQuizLibrarySources,
  type StudentAssignedQuizLibraryItem,
} from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  QUIZ_JOIN_CODE_LENGTH,
  buildQuizJoinCode,
  formatQuizJoinCode,
  normalizeQuizJoinCode,
} from "../../../features/quiz-session/quizJoinCode";
import { useQuizLauncher } from "../../../features/quiz-session/useQuizLauncher";

type JoinableAssignment = {
  assignment: StudentAssignedQuizLibraryItem;
  joinCode: string;
};

function getAssignedPriority(status: string) {
  if (status === "in_progress") {
    return 0;
  }

  if (status === "active") {
    return 1;
  }

  if (status === "completed") {
    return 2;
  }

  if (status === "expired") {
    return 3;
  }

  return 4;
}

export function StudentJoinQuizPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const { sessions } = useQuizSessions();
  const {
    attempts: allAttempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useStudentAttempts();
  const { openQuiz } = useQuizLauncher();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
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
  const joinableAssignments = useMemo(
    () =>
      studentSources.assigned
        .map((assignment) => ({
          assignment,
          joinCode: buildQuizJoinCode({
            assignmentId: assignment.assignmentContext.assignmentId,
            classId: assignment.assignmentContext.classId,
            quizId: assignment.id,
          }),
        }))
        .sort((left, right) => {
          const statusDifference =
            getAssignedPriority(left.assignment.assignmentState.status) -
            getAssignedPriority(right.assignment.assignmentState.status);

          if (statusDifference !== 0) {
            return statusDifference;
          }

          return (
            new Date(right.assignment.updatedAt).getTime() -
            new Date(left.assignment.updatedAt).getTime()
          );
        }),
    [studentSources.assigned],
  );
  const normalizedJoinCode = normalizeQuizJoinCode(joinCode);
  const matchedJoinTarget = useMemo(
    () =>
      normalizedJoinCode.length === QUIZ_JOIN_CODE_LENGTH
        ? joinableAssignments.find((item) => item.joinCode === normalizedJoinCode) ?? null
        : null,
    [joinableAssignments, normalizedJoinCode],
  );

  const launchAssignment = (target: JoinableAssignment, launchSourceLabel?: string) => {
    openQuiz({
      quizId: target.assignment.id,
      viewerRole: "student",
      assignmentId: target.assignment.assignmentContext.assignmentId,
      preferredSession:
        target.assignment.assignmentState.canReview
          ? "completed"
          : target.assignment.assignmentState.canResume
            ? "in-progress"
            : undefined,
      navigationState: {
        launchSourceType: "join-quiz",
        launchSourceLabel:
          launchSourceLabel ?? `Join code ${formatQuizJoinCode(target.joinCode)}`,
        returnToPath: "/dashboard/student/classes",
        returnToLabel: "Back to class thread",
        returnToState: {
          selectedClassId: target.assignment.assignmentContext.classId,
        },
      },
    });
  };

  const handleJoinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (normalizedJoinCode.length !== QUIZ_JOIN_CODE_LENGTH) {
      setJoinError(`Enter the full ${QUIZ_JOIN_CODE_LENGTH}-character code.`);
      return;
    }

    if (matchedJoinTarget) {
      if (
        matchedJoinTarget.assignment.assignmentState.isLoading ||
        (!matchedJoinTarget.assignment.assignmentState.canStart &&
          !matchedJoinTarget.assignment.assignmentState.canResume &&
          !matchedJoinTarget.assignment.assignmentState.canReview)
      ) {
        setJoinError("Attempt status is still loading for this assigned quiz.");
        return;
      }

      setJoinError("");
      launchAssignment(matchedJoinTarget);
      return;
    }

    setJoinError(
      "That code doesn't match a class assignment you can join. Check the code with your teacher and try again.",
    );
  };

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your invitation to unlock quiz codes",
        description:
          "You have a pending class invite. Accept it in Notifications and the matching join codes for that class will become active here.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "No joined classes yet",
        description:
          "Class assignment codes become available after you accept an invite and join a class.",
      };
    }

    return {
      title: "No class quizzes available yet",
      description:
        "Your joined classes are active, but there are no assigned quizzes with active join codes yet.",
    };
  };

  const assignedEmptyState = getAssignedEmptyState();

  return (
    <div className={dashboardPageNarrowClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Join a Quiz"}
        subtitle={
          meta?.subtitle ??
          "Enter the code your teacher shared to open the matching class assignment."
        }
        actions={
          <DashboardButton asChild type="button" variant="secondary" size="lg">
            <Link to="/dashboard/student/classes">Open My Classes</Link>
          </DashboardButton>
        }
      />

      <DashboardSurface radius="xl" padding="lg" className="mx-auto max-w-[720px]">
        <div className="mx-auto max-w-[560px] text-center">
          <div
            className={cn(
              dashboardIconChipVariants({ tone: "brand", size: "xl" }),
              "mx-auto rounded-full",
            )}
          >
            <Hash className="h-9 w-9" />
          </div>

          <h2 className="mt-5 text-[1.9rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
            Enter Quiz Code
          </h2>
          <p className="mt-2 text-[1rem] text-[var(--dashboard-text-soft)]">
            Enter the 6-character code your teacher shared to open the matching class assignment.
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleJoinSubmit}>
            <InputOTP
              maxLength={QUIZ_JOIN_CODE_LENGTH}
              value={normalizedJoinCode}
              onChange={(value) => {
                setJoinCode(normalizeQuizJoinCode(value));
                setJoinError("");
              }}
              containerClassName="justify-center"
            >
              <InputOTPGroup className="justify-center gap-2 sm:gap-3">
                {Array.from({ length: QUIZ_JOIN_CODE_LENGTH }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-[56px] w-[56px] rounded-[18px] border bg-[var(--dashboard-surface-elevated)] text-lg font-semibold text-[var(--dashboard-text-strong)] first:rounded-[18px] first:border last:rounded-[18px] last:border data-[active=true]:border-[var(--dashboard-brand)] data-[active=true]:ring-[var(--dashboard-brand)]/20"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <p
              className={cn(
                "min-h-6 text-sm leading-6",
                joinError
                  ? "text-[var(--dashboard-danger)]"
                  : matchedJoinTarget
                    ? "text-[var(--dashboard-brand-strong)]"
                    : "text-[var(--dashboard-text-soft)]",
              )}
            >
              {joinError
                ? joinError
                : matchedJoinTarget
                  ? `${formatQuizJoinCode(matchedJoinTarget.joinCode)} matches ${matchedJoinTarget.assignment.title}.`
                  : "Works with codes for any class assignment you've been invited to."}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <DashboardButton
                type="submit"
                size="lg"
                disabled={
                  matchedJoinTarget
                    ? matchedJoinTarget.assignment.assignmentState.isLoading ||
                      (!matchedJoinTarget.assignment.assignmentState.canStart &&
                        !matchedJoinTarget.assignment.assignmentState.canResume &&
                        !matchedJoinTarget.assignment.assignmentState.canReview)
                    : false
                }
              >
                {matchedJoinTarget
                  ? matchedJoinTarget.assignment.assignmentState.primaryActionLabel
                  : "Open Quiz"}
              </DashboardButton>

              {normalizedJoinCode ? (
                <DashboardButton
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    setJoinCode("");
                    setJoinError("");
                  }}
                >
                  Clear
                </DashboardButton>
              ) : null}
            </div>
          </form>
        </div>

        {matchedJoinTarget ? (
          <div className="mx-auto mt-6 max-w-[560px] rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] p-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardBadge
                tone={getAssignmentStatusTone(
                  matchedJoinTarget.assignment.assignmentState.status,
                )}
              >
                {matchedJoinTarget.assignment.assignmentState.displayStatusLabel}
              </DashboardBadge>
              <DashboardBadge tone="brand">
                Code {formatQuizJoinCode(matchedJoinTarget.joinCode)}
              </DashboardBadge>
            </div>

            <h3 className="mt-3 text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
              {matchedJoinTarget.assignment.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {matchedJoinTarget.assignment.assignmentContext.className} / Assigned quiz{" "}
              {formatTeacherClassDate(
                matchedJoinTarget.assignment.assignmentContext.assignedAt,
              )}
            </p>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-[var(--dashboard-text-soft)]">
              <span className={dashboardIconTextRowClassName}>
                <BookOpen className="h-4 w-4" />
                {matchedJoinTarget.assignment.questionCount}{" "}
                {matchedJoinTarget.assignment.questionCount === 1
                  ? "question"
                  : "questions"}
              </span>
              <span className={dashboardIconTextRowClassName}>
                <Timer className="h-4 w-4" />
                {matchedJoinTarget.assignment.durationMinutes} min
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <DashboardButton
                type="button"
                size="lg"
                disabled={
                  matchedJoinTarget.assignment.assignmentState.isLoading ||
                  (!matchedJoinTarget.assignment.assignmentState.canStart &&
                    !matchedJoinTarget.assignment.assignmentState.canResume &&
                    !matchedJoinTarget.assignment.assignmentState.canReview)
                }
                onClick={() => launchAssignment(matchedJoinTarget)}
              >
                {matchedJoinTarget.assignment.assignmentState.primaryActionLabel}
              </DashboardButton>
              <DashboardButton asChild type="button" size="lg" variant="ghost">
                <Link
                  to="/dashboard/student/classes"
                  state={{
                    selectedClassId:
                      matchedJoinTarget.assignment.assignmentContext.classId,
                  }}
                >
                  Open Class
                </Link>
              </DashboardButton>
            </div>
          </div>
        ) : null}
      </DashboardSurface>

      {studentSources.pendingMemberships.length ? (
        <DashboardSurface
          variant="muted"
          radius="lg"
          padding="md"
          className="mx-auto max-w-[720px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Pending class invites can unlock more quiz codes.
            </p>
            <DashboardButton asChild type="button" size="sm" variant="secondary">
              <Link to="/dashboard/student/notifications">Notifications</Link>
            </DashboardButton>
          </div>
        </DashboardSurface>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
              Your Assigned Quizzes
            </h2>
            <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
              Pick an assigned quiz directly or fill its code into the field above.
            </p>
          </div>
          <DashboardBadge tone="neutral" size="md">
            {joinableAssignments.length}{" "}
            {joinableAssignments.length === 1 ? "assignment" : "assignments"}
          </DashboardBadge>
        </div>

        {joinableAssignments.length ? (
          joinableAssignments.map((target) => {
            const { assignment } = target;
            const isMatched =
              matchedJoinTarget?.assignment.assignmentContext.assignmentId ===
              assignment.assignmentContext.assignmentId;

            return (
              <DashboardSurface
                key={assignment.assignmentContext.assignmentId}
                radius="lg"
                padding="md"
                className={cn(isMatched && "border-[var(--dashboard-brand)]")}
              >
                <article className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <DashboardBadge tone="brand">
                          Code {formatQuizJoinCode(target.joinCode)}
                        </DashboardBadge>
                        <DashboardBadge
                          tone={getAssignmentStatusTone(assignment.assignmentState.status)}
                        >
                          {assignment.assignmentState.displayStatusLabel}
                        </DashboardBadge>
                      </div>

                      <h3 className="mt-3 text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                        {assignment.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                        {assignment.assignmentContext.assignedByName} /{" "}
                        {assignment.assignmentContext.className} / Assigned quiz{" "}
                        {formatTeacherClassDate(assignment.assignmentContext.assignedAt)}
                      </p>
                    </div>

                    <DashboardButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setJoinCode(target.joinCode);
                        setJoinError("");
                      }}
                    >
                      Use Code
                    </DashboardButton>
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-[var(--dashboard-text-soft)]">
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

                  <div className="flex flex-wrap gap-3">
                    <DashboardButton
                      type="button"
                      size="md"
                      disabled={
                        assignment.assignmentState.isLoading ||
                        (!assignment.assignmentState.canStart &&
                          !assignment.assignmentState.canResume &&
                          !assignment.assignmentState.canReview)
                      }
                      onClick={() =>
                        launchAssignment(
                          target,
                          `${assignment.assignmentContext.className} join launcher`,
                        )
                      }
                    >
                      {assignment.assignmentState.primaryActionLabel}
                    </DashboardButton>
                    <DashboardButton
                      type="button"
                      size="md"
                      variant="ghost"
                      onClick={() => {
                        setJoinCode(target.joinCode);
                        setJoinError("");
                      }}
                    >
                      Fill Code
                    </DashboardButton>
                  </div>
                </article>
              </DashboardSurface>
            );
          })
        ) : (
          <EmptyAssignedQuizzesState
            title={assignedEmptyState.title}
            description={assignedEmptyState.description}
          />
        )}
      </div>
    </div>
  );
}
