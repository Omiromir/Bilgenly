import { useDeferredValue, useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  FilePenLine,
  Layers3,
  Play,
  Rocket,
  Save,
  SearchCheck,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import {
  getQuizLibraryItemsForRole,
  useQuizLibrary,
} from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
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
import {
  isDraftQuiz,
  isPublicDiscoveryQuiz,
  matchesQuizFilters,
  matchesQuizSearch,
} from "../../../features/dashboard/components/quiz-library/quizLibraryUtils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

type TeacherLibraryTab =
  | "my-quizzes"
  | "drafts"
  | "public-library";

export function TeacherQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { classes, assignQuizToClasses } = useTeacherClasses();
  const { quizzes, deleteQuiz, duplicateQuizToLibrary, publishQuiz, toggleSavedQuiz } =
    useQuizLibrary();
  const teacherQuizLibraryItems = getQuizLibraryItemsForRole(quizzes, "teacher");
  const initialTab = location.state?.libraryTab as TeacherLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<TeacherLibraryTab>(
    initialTab === "drafts" ||
      initialTab === "public-library"
      ? initialTab
      : "my-quizzes",
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [quizPendingAssignment, setQuizPendingAssignment] =
    useState<QuizLibraryItem | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const shouldShowStatusFilter = activeTab === "my-quizzes";

  const getTeacherItemsForTab = (tab: TeacherLibraryTab) => {
    switch (tab) {
      case "my-quizzes":
        return teacherQuizLibraryItems.filter(
          (item) => (item.isOwner && !isDraftQuiz(item.status)) || item.isSaved,
        );
      case "drafts":
        return teacherQuizLibraryItems.filter(
          (item) => item.isOwner && isDraftQuiz(item.status),
        );
      case "public-library":
        return teacherQuizLibraryItems.filter((item) => isPublicDiscoveryQuiz(item));
      default:
        return teacherQuizLibraryItems;
    }
  };

  const activeTabItems = getTeacherItemsForTab(activeTab);
  const effectiveStatus = shouldShowStatusFilter ? status : "all";
  const filteredItems = activeTabItems.filter(
    (item) => {
      const matchesType =
        effectiveStatus === "all"
          ? true
          : effectiveStatus === "saved"
            ? Boolean(item.isSaved)
            : item.status === effectiveStatus;

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
        "Your published private/public quizzes plus any public quizzes you saved for later reuse or inspiration.",
      count: getTeacherItemsForTab("my-quizzes").length,
      emptyTitle: "No quizzes in My Quizzes yet",
      emptyDescription:
        "Publish a quiz or save one from the public library to build this view.",
    },
    {
      id: "drafts" as const,
      label: "Drafts",
      description:
        "Generated, edited, and still-private work that needs review before it becomes a published classroom or public quiz.",
      count: getTeacherItemsForTab("drafts").length,
      emptyTitle: "No draft quizzes found",
      emptyDescription:
        "Drafts stay separate from public discovery so unfinished work never pollutes the shared library.",
    },
    {
      id: "public-library" as const,
      label: "Public Library",
      description:
        "Discover publicly shared quizzes from other creators, then preview, duplicate, save, or practice them.",
      count: getTeacherItemsForTab("public-library").length,
      emptyTitle: "No public library quizzes found",
      emptyDescription:
        "Only published public quizzes belong in shared discovery. Adjust filters to widen the discovery scope.",
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
        { label: "Published private", value: "published-private" },
        { label: "Published public", value: "published-public" },
        { label: "Saved", value: "saved" },
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
      setAssignmentError("");
      return;
    }

    setSelectedClassIds([]);
    setAssignmentError("");
  }, [quizPendingAssignment]);

  const getAssignedClassIdsForQuiz = (quizId: string) =>
    classes
      .filter((teacherClass) =>
        teacherClass.assignedQuizzes.some((assignedQuiz) => assignedQuiz.quizId === quizId),
      )
      .map((teacherClass) => teacherClass.id);

  const handleAssignQuizToClasses = () => {
    if (!quizPendingAssignment) {
      return;
    }

    if (!selectedClassIds.length) {
      setAssignmentError("Select at least one active class to continue.");
      return;
    }

    const assignedClassIds = assignQuizToClasses(
      {
        quizId: quizPendingAssignment.id,
        title: quizPendingAssignment.title,
        topic: quizPendingAssignment.topic,
        questionCount: quizPendingAssignment.questionCount,
      },
      selectedClassIds,
    );

    if (!assignedClassIds.length) {
      setAssignmentError("That quiz is already assigned to the selected classes.");
      return;
    }

    setAssignmentFeedback(
      `"${quizPendingAssignment.title}" assigned to ${assignedClassIds.length} ${
        assignedClassIds.length === 1 ? "class" : "classes"
      }.`,
    );
    setQuizPendingAssignment(null);
  };

  const getTeacherMetadata = (item: QuizLibraryItem): QuizCardMetadataItem[] => [
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
    {
      icon: SearchCheck,
      label: item.averageScore
        ? `Avg score ${item.averageScore}`
        : `Updated ${item.updatedAt}`,
    },
  ];

  const getTeacherBadge = (item: QuizLibraryItem) => {
    if (item.isOwner && isDraftQuiz(item.status)) {
      return "Mine";
    }

    if (item.isOwner && item.visibility === "public") {
      return "Shared by you";
    }

    if (item.isOwner) {
      return "Class-only";
    }

    if (item.isSaved) {
      return "Saved";
    }

    return undefined;
  };

  const getTeacherActions = (item: QuizLibraryItem): QuizCardAction[] => {
    if (!item.isOwner) {
      return [
        {
          label: item.isSaved ? "Saved Copy" : "Save Copy",
          icon: Save,
          variant: "soft",
          onClick: () => toggleSavedQuiz(item.id, "teacher"),
        },
        {
          label: "Duplicate",
          icon: Layers3,
          variant: "ghost",
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
          label: "Practice",
          icon: Play,
          variant: "ghost",
        },
      ];
    }

    if (item.status === "archived") {
      return [
        {
          label: "Restore",
          icon: Rocket,
        },
        {
          label: "Duplicate",
          icon: Layers3,
          variant: "secondary",
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          onClick: () => deleteQuiz(item.id, "teacher"),
        },
      ];
    }

    if (isDraftQuiz(item.status)) {
      return [
        {
          label: "Review Draft",
          icon: FilePenLine,
          onClick: () =>
            navigate("/dashboard/teacher/generate-quiz", {
              state: { editQuizId: item.id },
            }),
        },
        {
          label: "Publish",
          icon: Send,
          variant: "secondary",
          onClick: () => publishQuiz(item.id, "teacher", item.visibility),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          onClick: () => deleteQuiz(item.id, "teacher"),
        },
      ];
    }

    return [
      {
        label: "Assign Quiz",
        icon: Rocket,
        onClick: () => setQuizPendingAssignment(item),
      },
      {
        label: "Edit",
        icon: FilePenLine,
        variant: "secondary",
        onClick: () =>
          navigate("/dashboard/teacher/generate-quiz", {
            state: { editQuizId: item.id },
          }),
      },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          onClick: () => deleteQuiz(item.id, "teacher"),
        },
    ];
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Quiz Library"}
        subtitle="Manage your own drafts and published quizzes while discovering reusable public content in the same library system."
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
        helperText={
          shouldShowStatusFilter
            ? "Use search to find quizzes fast, then filter by type only when you need to separate saved, private, or public items."
            : undefined
        }
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
        <DialogContent className="max-w-2xl rounded-[28px] border-[var(--dashboard-border-soft)] p-0">
          <div className="border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-6 py-5">
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
                Assign quiz to classes
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {quizPendingAssignment
                  ? `Choose which classes should receive "${quizPendingAssignment.title}".`
                  : "Choose classes for this quiz."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            {quizPendingAssignment ? (
              <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white px-4 py-3">
                <p className="font-semibold text-[var(--dashboard-text-strong)]">
                  {quizPendingAssignment.title}
                </p>
                <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                  {quizPendingAssignment.topic} · {quizPendingAssignment.questionCount}{" "}
                  {quizPendingAssignment.questionCount === 1 ? "question" : "questions"}
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              {classes.length ? (
                classes.map((teacherClass) => {
                  const alreadyAssigned = quizPendingAssignment
                    ? getAssignedClassIdsForQuiz(quizPendingAssignment.id).includes(
                        teacherClass.id,
                      )
                    : false;
                  const isArchived = teacherClass.status === "archived";
                  const isDisabled = alreadyAssigned || isArchived;

                  return (
                    <label
                      key={teacherClass.id}
                      className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(teacherClass.id)}
                          disabled={isDisabled}
                          onChange={(event) => {
                            const { checked } = event.target;

                            setSelectedClassIds((current) =>
                              checked
                                ? [...current, teacherClass.id]
                                : current.filter((item) => item !== teacherClass.id),
                            );
                            if (assignmentError) {
                              setAssignmentError("");
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-[var(--dashboard-border-soft)] text-[var(--dashboard-brand)]"
                        />
                        <div>
                          <p className="font-semibold text-[var(--dashboard-text-strong)]">
                            {teacherClass.name}
                          </p>
                          <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                            {teacherClass.studentCount}{" "}
                            {teacherClass.studentCount === 1 ? "student" : "students"} ·{" "}
                            {teacherClass.quizCount}{" "}
                            {teacherClass.quizCount === 1 ? "quiz" : "quizzes"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {alreadyAssigned ? (
                          <DashboardBadge tone="info">Already assigned</DashboardBadge>
                        ) : null}
                        {isArchived ? (
                          <DashboardBadge tone="neutral">Archived</DashboardBadge>
                        ) : null}
                      </div>
                    </label>
                  );
                })
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
                  <p className="font-semibold text-[var(--dashboard-text-strong)]">
                    No classes available yet
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                    Create a class first, then come back here to assign quizzes to it.
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
          </div>

          <DialogFooter className="border-t border-[var(--dashboard-border-soft)] px-6 py-5 sm:justify-end">
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => setQuizPendingAssignment(null)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton type="button" size="lg" onClick={handleAssignQuizToClasses}>
              Assign to classes
            </DashboardButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
