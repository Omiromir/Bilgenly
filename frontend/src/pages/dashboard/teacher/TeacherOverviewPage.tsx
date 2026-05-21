import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "../../../components/ui/utils";
import { Dialog } from "../../../components/ui/dialog";
import logoPng from "../../../assets/logo.png";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useAssignmentInsights } from "../../../features/dashboard/hooks/useDashboardAnalytics";
import { AssignmentSettingsForm } from "../../../features/assignments/AssignmentControls";
import {
  DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  validateAssignmentSettings,
  type AssignmentSettingsFormValues,
} from "../../../features/assignments/assignmentConstraints";
import { CtaPanel } from "../../../features/dashboard/components/CtaPanel";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardPageClassName,
  dashboardSplitGridClassName,
  dashboardStatsGridClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import {
  DashboardModalBody,
  DashboardModalContent,
  DashboardModalFooter,
  DashboardModalHeader,
} from "../../../features/dashboard/components/DashboardModal";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { RecentQuizzesList } from "../../../features/dashboard/components/teacher-overview/RecentQuizzesList";
import { StrugglingTopicsList } from "../../../features/dashboard/components/teacher-overview/StrugglingTopicsList";
import {
  buildTeacherOverviewData,
  type RecentQuizOverviewItem,
  type StrugglingTopicOverviewItem,
} from "../../../features/dashboard/components/teacher-overview/teacherOverviewData";

export function TeacherOverviewPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { quizzes } = useQuizLibrary();
  const { classes, assignQuizToClasses } = useTeacherClasses();
  const { sharedAssignedSessions } = useQuizSessions();

  // All assignments across active teacher classes — used to batch-fetch backend insights.
  const allAssignments = useMemo(
    () =>
      classes
        .filter((teacherClass) => teacherClass.status === "active")
        .flatMap((teacherClass) => teacherClass.assignedQuizzes),
    [classes],
  );
  const {
    data: backendInsights,
    isLoading: insightsLoading,
  } = useAssignmentInsights(allAssignments);

  const [quizPendingAssignment, setQuizPendingAssignment] =
    useState<RecentQuizOverviewItem | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettingsFormValues>(
    DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  );
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentDeadlineError, setAssignmentDeadlineError] = useState("");
  const [assignStep, setAssignStep] = useState<"select" | "configure">("select");

  const activeClasses = useMemo(
    () => classes.filter((teacherClass) => teacherClass.status === "active"),
    [classes],
  );
  const overview = useMemo(
    () =>
      buildTeacherOverviewData({
        classes,
        quizzes,
        sharedAssignedSessions,
        currentTeacherName: currentUser?.fullName,
        backendInsights,
      }),
    [backendInsights, classes, currentUser?.fullName, quizzes, sharedAssignedSessions],
  );

  const getAssignedClassIdsForQuiz = (quizId: string) =>
    activeClasses
      .filter((teacherClass) =>
        teacherClass.assignedQuizzes.some((assignedQuiz) => assignedQuiz.quizId === quizId),
      )
      .map((teacherClass) => teacherClass.id);

  const handleViewQuizDetails = (quiz: RecentQuizOverviewItem) => {
    if (quiz.viewDetailsTarget) {
      navigate(
        `/dashboard/teacher/analytics?classId=${quiz.viewDetailsTarget.classId}&assignmentId=${quiz.viewDetailsTarget.assignmentId}`,
      );
      return;
    }

    navigate("/dashboard/teacher/quiz-library", {
      state: { libraryTab: quiz.isDraft ? "drafts" : "my-quizzes" },
    });
  };

  const handleEditQuiz = (quiz: RecentQuizOverviewItem) => {
    navigate("/dashboard/teacher/generate-quiz", {
      state: { editQuizId: quiz.quizId },
    });
  };

  const handleOpenAssignQuiz = (quiz: RecentQuizOverviewItem) => {
    setQuizPendingAssignment(quiz);
    setSelectedClassIds([]);
    setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
    setAssignmentError("");
    setAssignmentDeadlineError("");
    setAssignStep("select");
  };

  const handleAssignQuizToClasses = async () => {
    if (!quizPendingAssignment) {
      return;
    }

    if (!selectedClassIds.length) {
      setAssignmentError("Select at least one active class to continue.");
      return;
    }

    const validation = validateAssignmentSettings(assignmentSettings);

    if (validation.errors.deadline) {
      setAssignmentDeadlineError(validation.errors.deadline);
      return;
    }

    try {
      const assignedClassIds = await assignQuizToClasses(
        {
          quizId: quizPendingAssignment.quizId,
          title: quizPendingAssignment.title,
          topic: quizPendingAssignment.subjectLabel,
          questionCount: quizPendingAssignment.questionCount,
        },
        selectedClassIds,
        {
          deadline: validation.deadline,
          maxAttempts: validation.maxAttempts,
          allowLateSubmissions: false,
        },
      );

      if (!assignedClassIds.length) {
        setAssignmentError(
          "That assigned quiz is already visible to the selected classes.",
        );
        return;
      }

      toast.success(
        `"${quizPendingAssignment.title}" is now visible to class members in ${assignedClassIds.length} ${
          assignedClassIds.length === 1 ? "class" : "classes"
        }.`,
      );
      setQuizPendingAssignment(null);
      setSelectedClassIds([]);
      setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
      setAssignmentError("");
      setAssignmentDeadlineError("");
    } catch (error) {
      setAssignmentError(
        error instanceof Error ? error.message : "Unable to assign that quiz.",
      );
    }
  };

  const handleViewTopicAnalytics = (topic: StrugglingTopicOverviewItem) => {
    if (topic.primaryTarget) {
      navigate(
        `/dashboard/teacher/analytics?classId=${topic.primaryTarget.classId}&assignmentId=${topic.primaryTarget.assignmentId}`,
      );
      return;
    }

    navigate("/dashboard/teacher/analytics");
  };

  const handleCreateRemedialQuiz = (topic: StrugglingTopicOverviewItem) => {
    navigate("/dashboard/teacher/generate-quiz", {
      state: {
        presetFocus: topic.topicLabel,
        presetTitle: `${topic.topicLabel} Remedial Review`,
        presetContext: `Create a targeted remedial quiz for students who are still struggling with ${topic.topicLabel}.`,
      },
    });
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title="Welcome back, Professor!"
        subtitle="Here's what's happening with your classes today."
      />

      <CtaPanel
        title="Generate a New Quiz with AI"
        description="Upload your lecture materials or paste text content. Our AI will generate comprehensive quiz questions in under a minute."
        variant="gradient"
        actions={
          <DashboardButton asChild variant="inverse" size="xl">
            <Link to="/dashboard/teacher/generate-quiz">
              Create Quiz from PDF
            </Link>
          </DashboardButton>
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
        {insightsLoading && allAssignments.length > 0
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
        <SectionCard
          title="Recent Quizzes"
          description="The latest quizzes you've created or turned into assigned quizzes, with live completion and intervention signals from real class activity."
        >
          {insightsLoading && allAssignments.length > 0 ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <DashboardSurface key={i} asChild radius="md" padding="sm">
                  <article className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="h-5 w-48 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                        <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--dashboard-surface-muted)]" />
                      </div>
                      <div className="flex gap-5">
                        <div className="h-4 w-28 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                        <div className="h-4 w-24 animate-pulse rounded-lg bg-[var(--dashboard-surface-muted)]" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[0, 1, 2].map((j) => (
                        <div
                          key={j}
                          className="h-16 w-32 animate-pulse rounded-[16px] bg-[var(--dashboard-surface-muted)]"
                        />
                      ))}
                    </div>
                    <div className="flex gap-2.5 border-t border-[var(--dashboard-border-soft)] pt-4">
                      <div className="h-10 flex-1 animate-pulse rounded-[14px] bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-10 w-10 animate-pulse rounded-[14px] bg-[var(--dashboard-surface-muted)]" />
                      <div className="h-10 w-28 animate-pulse rounded-[14px] bg-[var(--dashboard-surface-muted)]" />
                    </div>
                  </article>
                </DashboardSurface>
              ))}
            </div>
          ) : (
            <RecentQuizzesList
              quizzes={overview.recentQuizzes}
              onViewDetails={handleViewQuizDetails}
              onEdit={handleEditQuiz}
              onAssign={handleOpenAssignQuiz}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Topics Students Struggle With"
          description="Lowest-mastery concepts are calculated from real assigned-quiz results, so you can move straight into reteaching or remediation."
        >
          <StrugglingTopicsList
            topics={overview.strugglingTopics}
            onViewAnalytics={handleViewTopicAnalytics}
            onCreateRemedialQuiz={handleCreateRemedialQuiz}
          />
        </SectionCard>
      </div>

      <Dialog
        open={Boolean(quizPendingAssignment)}
        onOpenChange={(open) => {
          if (!open) {
            setQuizPendingAssignment(null);
            setSelectedClassIds([]);
            setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
            setAssignmentError("");
            setAssignmentDeadlineError("");
            setAssignStep("select");
          }
        }}
      >
        <DashboardModalContent className="max-w-[720px]">
          <div className="flex min-h-0 flex-1 flex-col">

            {/* ── Step indicator ── */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    assignStep === "select"
                      ? "bg-[var(--dashboard-brand)] text-white"
                      : "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand)]",
                  )}
                >
                  {assignStep === "configure" ? "✓" : "1"}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    assignStep === "select"
                      ? "text-[var(--dashboard-text-strong)]"
                      : "text-[var(--dashboard-text-soft)]",
                  )}
                >
                  Select classes
                </span>
              </div>
              <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    assignStep === "configure"
                      ? "bg-[var(--dashboard-brand)] text-white"
                      : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-faint)]",
                  )}
                >
                  2
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    assignStep === "configure"
                      ? "text-[var(--dashboard-text-strong)]"
                      : "text-[var(--dashboard-text-faint)]",
                  )}
                >
                  Settings
                </span>
              </div>
            </div>

            {/* ── Step 1: Select classes ── */}
            {assignStep === "select" && (
              <>
                <DashboardModalHeader
                  title="Select classes"
                  description={
                    quizPendingAssignment
                      ? `Choose which classes should see "${quizPendingAssignment.title}".`
                      : "Choose classes for this quiz."
                  }
                />
                <DashboardModalBody className="space-y-5">
                  {/* Quiz summary */}
                  {quizPendingAssignment ? (
                    <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
                      <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--dashboard-text-strong)]">
                        {quizPendingAssignment.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                        {quizPendingAssignment.subjectLabel} · {quizPendingAssignment.questionCount}{" "}
                        {quizPendingAssignment.questionCount === 1 ? "question" : "questions"}
                      </p>
                    </div>
                  ) : null}

                  {/* Class checkboxes */}
                  <div className="space-y-3">
                    {activeClasses.length ? (
                      activeClasses.map((teacherClass) => {
                        const alreadyAssigned = quizPendingAssignment
                          ? getAssignedClassIdsForQuiz(quizPendingAssignment.quizId).includes(
                              teacherClass.id,
                            )
                          : false;

                        return (
                          <label
                            key={teacherClass.id}
                            htmlFor={`ov-class-checkbox-${teacherClass.id}`}
                            className="flex items-start justify-between gap-4 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4 shadow-[var(--dashboard-shadow-card)] transition-colors hover:border-[var(--dashboard-brand-soft)]"
                          >
                            <div className="flex items-start gap-4">
                              <input
                                id={`ov-class-checkbox-${teacherClass.id}`}
                                name={`ov-class-${teacherClass.id}`}
                                type="checkbox"
                                checked={selectedClassIds.includes(teacherClass.id)}
                                disabled={alreadyAssigned}
                                onChange={(event) => {
                                  const { checked } = event.target;
                                  setSelectedClassIds((current) =>
                                    checked
                                      ? [...current, teacherClass.id]
                                      : current.filter((item) => item !== teacherClass.id),
                                  );
                                  if (assignmentError) setAssignmentError("");
                                }}
                                className="mt-1 h-5 w-5 rounded border-[var(--dashboard-border-soft)] text-[var(--dashboard-brand)] focus-visible:ring-2 focus-visible:ring-[var(--dashboard-brand)] focus-visible:ring-offset-2"
                              />
                              <div>
                                <p className="text-[1.125rem] font-semibold tracking-[-0.02em] text-[var(--dashboard-text-strong)]">
                                  {teacherClass.name}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                                  {teacherClass.studentCount}{" "}
                                  {teacherClass.studentCount === 1 ? "student" : "students"} |{" "}
                                  {teacherClass.quizCount}{" "}
                                  {teacherClass.quizCount === 1 ? "quiz" : "quizzes"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 pt-0.5">
                              {alreadyAssigned ? (
                                <DashboardBadge tone="info">Already an assigned quiz</DashboardBadge>
                              ) : null}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5">
                        <p className="font-semibold text-[var(--dashboard-text-strong)]">
                          No active classes available
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          Create a class or restore an archived one, then come back here to assign quizzes to it.
                        </p>
                      </div>
                    )}
                  </div>

                  {assignmentError ? (
                    <div className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3">
                      <p className="text-sm leading-6 text-[var(--dashboard-danger)]">
                        {assignmentError}
                      </p>
                    </div>
                  ) : null}
                </DashboardModalBody>

                <DashboardModalFooter>
                  <DashboardButton
                    type="button"
                    size="lg"
                    variant="ghost"
                    onClick={() => {
                      setQuizPendingAssignment(null);
                      setSelectedClassIds([]);
                      setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
                      setAssignmentError("");
                      setAssignmentDeadlineError("");
                      setAssignStep("select");
                    }}
                  >
                    Cancel
                  </DashboardButton>
                  <DashboardButton
                    type="button"
                    size="lg"
                    disabled={!selectedClassIds.length}
                    onClick={() => {
                      if (!selectedClassIds.length) {
                        setAssignmentError("Select at least one active class to continue.");
                        return;
                      }
                      setAssignmentError("");
                      setAssignStep("configure");
                    }}
                  >
                    Next →
                  </DashboardButton>
                </DashboardModalFooter>
              </>
            )}

            {/* ── Step 2: Settings ── */}
            {assignStep === "configure" && (
              <>
                <DashboardModalHeader
                  title="Assignment settings"
                  description="Configure deadline, attempts, and other options for this assignment."
                />
                <DashboardModalBody className="space-y-5">
                  {/* Quiz summary */}
                  {quizPendingAssignment ? (
                    <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4">
                      <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--dashboard-text-strong)]">
                        {quizPendingAssignment.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                        {quizPendingAssignment.subjectLabel} · {quizPendingAssignment.questionCount}{" "}
                        {quizPendingAssignment.questionCount === 1 ? "question" : "questions"}
                      </p>
                    </div>
                  ) : null}

                  {/* Selected classes summary */}
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    Assigning to{" "}
                    <span className="font-semibold text-[var(--dashboard-text-strong)]">
                      {selectedClassIds.length}{" "}
                      {selectedClassIds.length === 1 ? "class" : "classes"}
                    </span>
                  </p>

                  <AssignmentSettingsForm
                    values={assignmentSettings}
                    deadlineError={assignmentDeadlineError}
                    onChange={(nextValues) => {
                      setAssignmentSettings(nextValues);
                      if (assignmentDeadlineError) setAssignmentDeadlineError("");
                    }}
                  />

                  {assignmentError ? (
                    <div className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3">
                      <p className="text-sm leading-6 text-[var(--dashboard-danger)]">
                        {assignmentError}
                      </p>
                    </div>
                  ) : null}
                </DashboardModalBody>

                <DashboardModalFooter>
                  <DashboardButton
                    type="button"
                    size="lg"
                    variant="ghost"
                    onClick={() => {
                      setAssignStep("select");
                      setAssignmentError("");
                      setAssignmentDeadlineError("");
                    }}
                  >
                    ← Back
                  </DashboardButton>
                  <DashboardButton type="button" size="lg" onClick={handleAssignQuizToClasses}>
                    Assign quiz
                  </DashboardButton>
                </DashboardModalFooter>
              </>
            )}

          </div>
        </DashboardModalContent>
      </Dialog>
    </div>
  );
}
