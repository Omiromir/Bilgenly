import { BookOpen, Medal, Timer } from "../../../components/icons/AppIcons";
import { Link } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
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
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import {
  studentOverviewStats,
  studentResults,
} from "../../../features/dashboard/mock/studentOverview";

const scoreToneClassName = {
  blue: dashboardTextToneClassName.brand,
  emerald: dashboardTextToneClassName.success,
} as const;

export function StudentOverviewPage() {
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = {
    userId: studentViewer?.id,
    email: studentViewer?.email,
  };
  const studentSources = buildStudentQuizLibrarySources(
    classes,
    quizzes,
    studentIdentity,
  );
  const assignedPreview = studentSources.assigned.slice(0, 3);

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your class invitation",
        description:
          "A pending class invite is waiting in Notifications. Accept it to unlock quizzes assigned to that class.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "No class memberships yet",
        description:
          "Assigned quizzes will appear here after you join a class through the invitation flow.",
      };
    }

    return {
      title: "No assigned quizzes yet",
      description:
        "You are already part of a class, but no quiz assignments have been sent to it yet.",
    };
  };

  const assignedEmptyState = getAssignedEmptyState();
  const assignedCount = studentSources.assigned.length;

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title="Welcome back, Student!"
        subtitle="Keep up the great work on your learning journey."
      />

      <CtaPanel
        title="Continue Your Learning"
        description={
          assignedCount
            ? `You have ${assignedCount} class-assigned ${assignedCount === 1 ? "quiz" : "quizzes"} ready. Jump back in and keep your streak going.`
            : "Jump into your quiz library, discover new practice sets, and stay ready for your next class assignment."
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
        {studentOverviewStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className={dashboardSplitGridClassName}>
        <SectionCard title="Assigned Quizzes">
          <div className={dashboardSectionStackClassName}>
            {assignedPreview.length ? (
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
                      <span className="text-sm font-medium text-[var(--dashboard-warning)]">
                        Assigned
                      </span>
                    </div>

                    <DashboardButton asChild type="button" size="lg" className="mt-5 w-full">
                      <Link
                        to="/dashboard/student/classes"
                        state={{ selectedClassId: assignment.assignmentContext.classId }}
                      >
                        {assignment.practiceState === "in-progress"
                          ? "Continue Quiz"
                          : assignment.practiceState === "completed"
                            ? "View Quiz"
                            : "Start Quiz"}
                      </Link>
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
            {studentResults.map((result, index) => (
              <article
                key={result.title}
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
                    <p className="mt-1 text-sm text-slate-500">{result.date}</p>
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
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
