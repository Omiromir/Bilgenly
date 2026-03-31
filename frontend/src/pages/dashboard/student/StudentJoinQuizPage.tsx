import { BookOpen, Hash, Timer } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { cn } from "../../../components/ui/utils";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardIconTextRowClassName,
  dashboardInputVariants,
  dashboardPageNarrowClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyAssignedQuizzesState } from "../../../features/dashboard/components/quiz-library/QuizLibraryComponents";
import { buildStudentQuizLibrarySources } from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

function getAssignedActionLabel(practiceState?: string) {
  if (practiceState === "completed") {
    return "View Quiz";
  }

  if (practiceState === "in-progress") {
    return "Continue Quiz";
  }

  return "Start Quiz";
}

export function StudentJoinQuizPage() {
  const meta = useDashboardPageMeta();
  const { currentStudent } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const studentSources = buildStudentQuizLibrarySources(
    classes,
    quizzes,
    currentStudent?.id,
  );

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your invitation to unlock quizzes",
        description:
          "You have a pending class invitation. Accept it in Notifications and the assigned quizzes for that class will appear here.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "No joined classes yet",
        description:
          "Assigned quizzes only appear after you join a class through the invitation flow.",
      };
    }

    return {
      title: "No class quizzes assigned yet",
      description:
        "Your joined classes are connected, but no teacher has assigned a quiz to them yet.",
    };
  };
  const assignedEmptyState = getAssignedEmptyState();

  return (
    <div className={dashboardPageNarrowClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Join a Quiz"}
        subtitle="Enter the quiz code provided by your teacher or launch a quiz assigned through a class you have joined."
        align="center"
      />

      <DashboardSurface asChild radius="xl" padding="lg">
        <section>
          <div className="mx-auto max-w-[420px] text-center">
            <div
              className={cn(
                dashboardIconChipVariants({ tone: "brand", size: "xl" }),
                "mx-auto rounded-full",
              )}
            >
              <Hash className="h-9 w-9" />
            </div>
            <h2 className="mt-5 text-[2rem] font-medium text-[var(--dashboard-text-strong)]">
              Enter Quiz Code
            </h2>
            <p className="mt-2 text-[1rem] text-[var(--dashboard-text-soft)]">
              Your teacher will provide you with a unique code
            </p>

            <div className="mt-7 flex justify-center gap-2.5">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className={dashboardInputVariants({ size: "otp" })}
                />
              ))}
            </div>

            <DashboardButton type="button" size="lg" className="mt-6 w-full">
              Join Quiz
            </DashboardButton>
          </div>
        </section>
      </DashboardSurface>

      <div className="flex items-center gap-4 py-2 text-sm text-[var(--dashboard-text-soft)]">
        <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
        or select from your class assignments
        <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
      </div>

      <div className="space-y-4">
        {studentSources.assigned.length ? (
          studentSources.assigned.map((assignment) => (
            <DashboardSurface
              asChild
              key={assignment.assignmentContext.assignmentId}
              radius="lg"
              padding="md"
            >
              <article>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.25rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {assignment.title}
                    </h3>
                    <p className="mt-2 text-[1rem] text-[var(--dashboard-text-soft)]">
                      {assignment.assignmentContext.assignedByName} ·{" "}
                      {assignment.assignmentContext.className}
                    </p>
                  </div>
                  <DashboardBadge tone="warning" size="md">
                    Assigned
                  </DashboardBadge>
                </div>

                <div className="mt-5 flex flex-wrap gap-6 text-sm text-[var(--dashboard-text-soft)]">
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

                <DashboardButton type="button" size="lg" className="mt-5 w-full">
                  {getAssignedActionLabel(assignment.practiceState)}
                  <span className="text-base">{">"}</span>
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
    </div>
  );
}
