import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Clock3,
  FilePenLine,
  Layers3,
  Lock,
  Play,
  Rocket,
  SearchCheck,
  Trash2,
  Users,
} from "../../../components/icons/AppIcons";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Dialog,
} from "../../../components/ui/dialog";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import {
  getQuizLibraryItemsForRole,
  useQuizLibrary,
} from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardModalBody,
  DashboardModalContent,
  DashboardModalFooter,
  DashboardModalHeader,
} from "../../../features/dashboard/components/DashboardModal";
import {
  DashboardBadge,
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { cn } from "../../../components/ui/utils";
import { AssignmentSettingsForm } from "../../../features/assignments/AssignmentControls";
import {
  DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  validateAssignmentSettings,
  type AssignmentSettingsFormValues,
} from "../../../features/assignments/assignmentConstraints";
import {
  LibrarySectionHeader,
  LibraryTabs,
  QuizCard,
  QuizFilterBar,
  QuizGrid,
  SearchEmptyState,
} from "../../../features/dashboard/components/quiz-library/QuizLibraryComponents";
import type {
  QuizCardAction,
  QuizCardMetadataItem,
  QuizLibraryItem,
} from "../../../features/dashboard/components/quiz-library/quizLibraryTypes";
import { useQuizLauncher } from "../../../features/quiz-session/useQuizLauncher";
import {
  isDraftQuiz,
  matchesQuizFilters,
  matchesQuizSearch,
} from "../../../features/dashboard/components/quiz-library/quizLibraryUtils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { formatCurrentDate } from "../../../features/dashboard/settings/settingsPreferences";
import { useAuth } from "../../../app/providers/AuthProvider";

type TeacherLibraryTab = "my-quizzes" | "drafts";

export function TeacherQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { classes, assignQuizToClasses } = useTeacherClasses();
  const {
    quizzes,
    deleteQuiz,
    duplicateQuizToLibrary,
    ensureQuizHasBackendId,
  } = useQuizLibrary();
  const { openQuiz } = useQuizLauncher();
  const teacherQuizLibraryItems = getQuizLibraryItemsForRole(
    quizzes,
    "teacher",
    currentUser?.id,
  );
  const initialTab = location.state?.libraryTab as TeacherLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<TeacherLibraryTab>(
    initialTab === "drafts" ? initialTab : "my-quizzes",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [quizPendingAssignment, setQuizPendingAssignment] =
    useState<QuizLibraryItem | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettingsFormValues>(
    DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  );
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentDeadlineError, setAssignmentDeadlineError] = useState("");
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [assignStep, setAssignStep] = useState<"select" | "configure">("select");
  const deferredSearch = useDeferredValue(search);
  const shouldShowStatusFilter = activeTab === "my-quizzes";

  // Quiz IDs that are currently assigned to at least one class — editing
  // these would corrupt existing student attempts and analytics.
  const assignedQuizIds = useMemo(
    () =>
      new Set(
        classes.flatMap((teacherClass) =>
          teacherClass.assignedQuizzes.map((a) => a.quizId),
        ),
      ),
    [classes],
  );

  const activeClasses = useMemo(
    () => classes.filter((teacherClass) => teacherClass.status === "active"),
    [classes],
  );

  const getTeacherItemsForTab = (tab: TeacherLibraryTab) => {
    switch (tab) {
      case "my-quizzes":
        return teacherQuizLibraryItems.filter(
          (item) => item.isOwner && !isDraftQuiz(item.status),
        );
      case "drafts":
        return teacherQuizLibraryItems.filter(
          (item) => item.isOwner && isDraftQuiz(item.status),
        );
      default:
        return teacherQuizLibraryItems;
    }
  };

  const activeTabItems = getTeacherItemsForTab(activeTab);
  const effectiveStatus = shouldShowStatusFilter ? status : "all";
  const filteredItems = activeTabItems.filter(
    (item) => {
      const matchesType =
        effectiveStatus === "all" ? true : item.status === effectiveStatus;

      return (
        matchesType &&
        matchesQuizSearch(item, deferredSearch) &&
        matchesQuizFilters(item, {
          status: "all",
          topic: "all",
          difficulty: "all",
          language: "all",
          creator: "all",
        })
      );
    },
  );

  const tabs = [
    {
      id: "my-quizzes" as const,
      label: "My Quizzes",
      description:
        "Your published quizzes — ready to assign to classes or test-run before sharing them with students.",
      count: getTeacherItemsForTab("my-quizzes").length,
      emptyTitle: "No quizzes in My Quizzes yet",
      emptyDescription:
        "Generate a quiz and publish it to start building your library.",
    },
    {
      id: "drafts" as const,
      label: "Drafts",
      description:
        "Generated and edited work that still needs review before you publish it into your library.",
      count: getTeacherItemsForTab("drafts").length,
      emptyTitle: "No draft quizzes found",
      emptyDescription:
        "Drafts stay separate from your published quizzes so unfinished work doesn't end up in front of students.",
    },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const hasActiveFilters =
    search.trim() !== "" ||
    (shouldShowStatusFilter && status !== "all");

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
  };

  const filterOptions = [
    {
      id: "progress",
      label: "Progress",
      value: status,
      onChange: setStatus,
      options: [
        { label: "All progress", value: "all" },
        { label: "Published", value: "published-private" },
        { label: "Archived", value: "archived" },
      ],
    },
  ];
  const visibleFilterOptions = shouldShowStatusFilter ? filterOptions : [];

  useEffect(() => {
    if (!shouldShowStatusFilter && status !== "all") {
      setStatus("all");
    }
  }, [shouldShowStatusFilter, status]);

  useEffect(() => {
    if (!quizPendingAssignment) {
      setSelectedClassIds([]);
      setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
      setAssignmentError("");
      setAssignmentDeadlineError("");
      setAssignStep("select");
      return;
    }

    setSelectedClassIds([]);
    setAssignmentSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
    setAssignmentError("");
    setAssignmentDeadlineError("");
    setAssignStep("select");
  }, [quizPendingAssignment]);

  const getAssignedClassIdsForQuiz = (quizId: string) =>
    classes
      .filter((teacherClass) =>
        teacherClass.assignedQuizzes.some((assignedQuiz) => assignedQuiz.quizId === quizId),
      )
      .map((teacherClass) => teacherClass.id);

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
      const backendQuizId = await ensureQuizHasBackendId(quizPendingAssignment.id);
      const assignedClassIds = await assignQuizToClasses(
        {
          quizId: backendQuizId,
          title: quizPendingAssignment.title,
          topic: quizPendingAssignment.topic,
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

      setAssignmentFeedback(
        `"${quizPendingAssignment.title}" is now visible to class members in ${assignedClassIds.length} ${
          assignedClassIds.length === 1 ? "class" : "classes"
        }.`,
      );
      setQuizPendingAssignment(null);
    } catch (error) {
      setAssignmentError(
        error instanceof Error ? error.message : "Unable to assign that quiz.",
      );
    }
  };

  const getTeacherMetadata = (item: QuizLibraryItem): QuizCardMetadataItem[] => {
    const base: QuizCardMetadataItem[] = [
      {
        icon: BookOpen,
        label: `${item.questionCount} questions`,
      },
      {
        icon: Clock3,
        label: `${item.durationMinutes} min`,
      },
      {
        icon: Users,
        label: item.isOwner
          ? `${item.learnerCount ?? 0} learners`
          : `${item.saveCount ?? 0} saves`,
      },
      // Updated date is now shown ALWAYS — previously it was hidden whenever
      // an average score existed, which made it impossible to tell when a
      // quiz had been edited last.
      {
        icon: Clock3,
        label: `Updated ${formatCurrentDate(item.updatedAt)}`,
      },
    ];

    if (item.averageScore) {
      base.push({
        icon: SearchCheck,
        label: `Avg score ${item.averageScore}`,
      });
    }

    return base;
  };

  const getTeacherBadge = (item: QuizLibraryItem) => {
    if (item.isOwner && isDraftQuiz(item.status)) {
      return "Mine";
    }

    if (item.isOwner) {
      return "Class-only";
    }

    return undefined;
  };

  const getTeacherPracticeLabel = (item: QuizLibraryItem) => {
    if (item.practiceState === "in-progress") {
      return "Continue Test Run";
    }

    // Teachers can test-run their quiz unlimited times. After a completed
    // run, the label invites another attempt rather than forcing review.
    if (item.practiceState === "completed") {
      return "Test Run Again";
    }

    return "Test Run";
  };

  const openTeacherQuiz = (item: QuizLibraryItem) => {
    openQuiz({
      quizId: item.id,
      viewerRole: "teacher",
      // Don't auto-open a completed session for teachers — they need to be
      // able to start a fresh test run. Only resume in-progress sessions.
      preferredSession:
        item.practiceState === "in-progress" ? "in-progress" : undefined,
      navigationState: {
        launchSourceType: "quiz-library",
        launchSourceLabel: "Teacher quiz library",
        returnToPath: "/dashboard/teacher/quiz-library",
        returnToLabel: "Back to quiz library",
      },
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuiz(quizId, "teacher");
    } catch (nextError) {
      toast.error(
        nextError instanceof Error ? nextError.message : "Unable to delete quiz.",
      );
    }
  };

  const getTeacherActions = (item: QuizLibraryItem): QuizCardAction[] => {
    if (item.status === "archived") {
      return [
        {
          label: "Restore",
          icon: Rocket,
          iconDisplay: "label-only",
        },
        {
          label: "Duplicate",
          icon: Layers3,
          variant: "secondary",
          iconDisplay: "icon-only",
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          iconDisplay: "icon-only",
          onClick: () => void handleDeleteQuiz(item.id),
        },
      ];
    }

    if (isDraftQuiz(item.status)) {
      return [
        {
          label: "Review Draft",
          icon: FilePenLine,
          iconDisplay: "label-only",
          onClick: () =>
            navigate("/dashboard/teacher/generate-quiz", {
              state: { editQuizId: item.id },
            }),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          iconDisplay: "icon-only",
          onClick: () => void handleDeleteQuiz(item.id),
        },
      ];
    }

      // Assigned quizzes must not be structurally edited — doing so corrupts
      // existing student attempts and analytics. Offer Duplicate & Edit instead.
      if (assignedQuizIds.has(item.id)) {
        return [
          {
            label: "Assign quiz",
            icon: Rocket,
            iconDisplay: "label-only",
            onClick: () => setQuizPendingAssignment(item),
          },
          {
            label: getTeacherPracticeLabel(item),
            icon: Play,
            variant: "soft",
            iconDisplay: "icon-only",
            onClick: () => openTeacherQuiz(item),
          },
          {
            label: "Duplicate & Edit",
            icon: Layers3,
            variant: "secondary",
            iconDisplay: "icon-only",
            title: "Quiz is assigned — duplicate it to edit safely",
            onClick: () => {
              const duplicate = duplicateQuizToLibrary(item.id, "teacher");
              if (duplicate) {
                navigate("/dashboard/teacher/generate-quiz", {
                  state: { editQuizId: duplicate.id },
                });
              }
            },
          },
          {
            label: "Edit (locked)",
            icon: Lock,
            variant: "ghost",
            iconDisplay: "icon-only",
            disabled: true,
            title: "Editing is disabled while the quiz is assigned to a class. Use \"Duplicate & Edit\" to make changes safely.",
          },
          {
            label: "Delete",
            icon: Trash2,
            variant: "ghost",
            iconDisplay: "icon-only",
            onClick: () => void handleDeleteQuiz(item.id),
          },
        ];
      }

      return [
        {
          label: "Assign quiz",
          icon: Rocket,
          iconDisplay: "label-only",
          onClick: () => setQuizPendingAssignment(item),
        },
        {
          label: getTeacherPracticeLabel(item),
          icon: Play,
          variant: "soft",
          iconDisplay: "icon-only",
          onClick: () => openTeacherQuiz(item),
        },
        {
          label: "Edit",
          icon: FilePenLine,
          variant: "secondary",
          iconDisplay: "icon-only",
          onClick: () =>
            navigate("/dashboard/teacher/generate-quiz", {
              state: { editQuizId: item.id },
            }),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          iconDisplay: "icon-only",
          onClick: () => void handleDeleteQuiz(item.id),
        },
      ];
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Quiz Library"}
        subtitle="Manage your drafts and published quizzes from one place — keep unfinished work separate from what students see."
        actions={
          <DashboardButton type="button" size="lg">
            <Link to="/dashboard/teacher/generate-quiz">
            Create New Quiz
            </Link>
          </DashboardButton>
        }
      />

      <LibraryTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <QuizFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={visibleFilterOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={resetFilters}
      />

      <section className="space-y-5">
        {assignmentFeedback ? (
          <div className="rounded-[22px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/50 px-5 py-4">
            <p className="text-sm leading-6 text-[var(--dashboard-success)]">
              {assignmentFeedback}
            </p>
          </div>
        ) : null}

        <LibrarySectionHeader
          title={activeTabConfig.label}
          description={activeTabConfig.description}
          resultCount={filteredItems.length}
        />

        {filteredItems.length ? (
          <QuizGrid
            items={filteredItems}
            renderCard={(item) => (
              <QuizCard
                key={item.id}
                item={item}
                metadata={getTeacherMetadata(item)}
                actions={getTeacherActions(item)}
                badgeLabel={getTeacherBadge(item)}
              />
            )}
          />
        ) : (
          <SearchEmptyState
            title={activeTabConfig.emptyTitle}
            description={activeTabConfig.emptyDescription}
          />
        )}
      </section>

      <Dialog
        open={Boolean(quizPendingAssignment)}
        onOpenChange={(open) => {
          if (!open) {
            setQuizPendingAssignment(null);
          }
        }}
      >
        <DashboardModalContent className="max-w-[720px]">
          <div className="flex min-h-0 flex-1 flex-col">

            {/* ── Step indicator ── */}
            <div className="flex items-center gap-3 px-6 pt-8 pr-14 pb-2">
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
                        {quizPendingAssignment.topic} · {quizPendingAssignment.questionCount}{" "}
                        {quizPendingAssignment.questionCount === 1 ? "question" : "questions"}
                      </p>
                    </div>
                  ) : null}

                  {/* Class checkboxes */}
                  <div className="space-y-3">
                    {activeClasses.length ? (
                      activeClasses.map((teacherClass) => {
                        const alreadyAssigned = quizPendingAssignment
                          ? getAssignedClassIdsForQuiz(quizPendingAssignment.id).includes(
                              teacherClass.id,
                            )
                          : false;

                        return (
                          <label
                            key={teacherClass.id}
                            htmlFor={`lib-class-checkbox-${teacherClass.id}`}
                            className="flex items-start justify-between gap-4 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4 shadow-[var(--dashboard-shadow-card)] transition-colors hover:border-[var(--dashboard-brand-soft)]"
                          >
                            <div className="flex items-start gap-4">
                              <input
                                id={`lib-class-checkbox-${teacherClass.id}`}
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
                                  {teacherClass.studentCount === 1 ? "student" : "students"} ·{" "}
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
                      <div className="rounded-[22px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5">
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
                    onClick={() => setQuizPendingAssignment(null)}
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
                        {quizPendingAssignment.topic} · {quizPendingAssignment.questionCount}{" "}
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
                  <DashboardButton
                    type="button"
                    size="lg"
                    onClick={handleAssignQuizToClasses}
                  >
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
