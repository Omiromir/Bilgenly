import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  BookOpen,
  BookmarkPlus,
  Clock3,
  FilePenLine,
  Layers3,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import {
  AssignedQuizCard,
  EmptyAssignedQuizzesState,
  LibrarySectionHeader,
  LibraryTabs,
  QuizCard,
  QuizFilterBar,
  QuizGrid,
  SearchEmptyState,
} from "../../../features/dashboard/components/quiz-library/QuizLibraryComponents";
import {
  buildStudentQuizLibrarySources,
  type StudentAssignedQuizLibraryItem,
} from "../../../features/dashboard/components/quiz-library/studentQuizLibrarySources";
import type {
  QuizCardAction,
  QuizCardMetadataItem,
  QuizLibraryItem,
} from "../../../features/dashboard/components/quiz-library/quizLibraryTypes";
import {
  matchesQuizFilters,
  matchesQuizSearch,
} from "../../../features/dashboard/components/quiz-library/quizLibraryUtils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

type StudentLibraryTab =
  | "assigned"
  | "discover"
  | "generated"
  | "saved"
  | "history";

export function StudentQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStudent } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes, deleteQuiz, duplicateQuizToLibrary, toggleSavedQuiz } =
    useQuizLibrary();
  const studentSources = useMemo(
    () => buildStudentQuizLibrarySources(classes, quizzes, currentStudent?.id),
    [classes, currentStudent?.id, quizzes],
  );
  const initialTab = location.state?.libraryTab as StudentLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<StudentLibraryTab>(
    initialTab === "assigned" ||
      initialTab === "generated" ||
      initialTab === "saved" ||
      initialTab === "history"
      ? initialTab
      : "assigned",
  );
  const [search, setSearch] = useState("");
  const [practiceState, setPracticeState] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const shouldShowPracticeFilter =
    activeTab === "assigned" || activeTab === "history";

  const getStudentItemsForTab = (tab: StudentLibraryTab) => {
    switch (tab) {
      case "assigned":
        return studentSources.assigned;
      case "discover":
        return studentSources.discover;
      case "generated":
        return studentSources.myGenerated;
      case "saved":
        return studentSources.saved;
      case "history":
        return studentSources.history;
      default:
        return studentSources.discover;
    }
  };

  const activeTabItems = getStudentItemsForTab(activeTab);
  const effectivePracticeState = shouldShowPracticeFilter
    ? practiceState
    : "all";
  const filteredItems = activeTabItems.filter(
    (item) =>
      matchesQuizSearch(item, deferredSearch) &&
      matchesQuizFilters(item, {
        practiceState: effectivePracticeState,
        topic: "all",
        difficulty: "all",
        language: "all",
        creator: "all",
      }),
  );

  const tabs = [
    {
      id: "assigned" as const,
      label: "Assigned",
      description:
        "Quizzes unlocked by the classes you have actually joined, with class context and teacher ownership kept front and center.",
      count: studentSources.assigned.length,
      emptyTitle: "No assigned quizzes yet",
      emptyDescription:
        "Class-assigned quizzes appear here only after you accept the class invitation and become an active member.",
    },
    {
      id: "discover" as const,
      label: "Discover",
      description:
        "Browse the public quiz library without mixing it into teacher-assigned class work.",
      count: studentSources.discover.length,
      emptyTitle: "No public quizzes match this search",
      emptyDescription:
        "Discover only includes shared public quizzes. Clear a filter to widen the library.",
    },
    {
      id: "generated" as const,
      label: "My Generated",
      description:
        "Your own study sets stay in one place, whether they are still drafts or already published.",
      count: studentSources.myGenerated.length,
      emptyTitle: "No generated quizzes yet",
      emptyDescription:
        "Generate a quiz from your notes to start building a personal study library.",
    },
    {
      id: "saved" as const,
      label: "Saved",
      description:
        "Keep interesting public quizzes in a personal shelf without confusing them with your class assignments.",
      count: studentSources.saved.length,
      emptyTitle: "No saved quizzes yet",
      emptyDescription:
        "Save a public quiz from Discover to keep it close for later practice.",
    },
    {
      id: "history" as const,
      label: "History",
      description:
        "Return to active and completed practice sessions across assigned, saved, and self-generated quizzes.",
      count: studentSources.history.length,
      emptyTitle: "No practice history found",
      emptyDescription:
        "Once you begin or finish a quiz, it will appear here for a quick return.",
    },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const hasActiveFilters =
    search.trim() !== "" ||
    (shouldShowPracticeFilter && practiceState !== "all");

  const resetFilters = () => {
    setSearch("");
    setPracticeState("all");
  };

  const filterOptions = [
    {
      id: "practice-state",
      label: "Progress",
      value: practiceState,
      onChange: setPracticeState,
      options: [
        { label: "All progress", value: "all" },
        { label: "Ready", value: "ready" },
        { label: "In progress", value: "in-progress" },
        { label: "Completed", value: "completed" },
      ],
    },
  ];
  const visibleFilterOptions = shouldShowPracticeFilter ? filterOptions : [];

  useEffect(() => {
    if (!shouldShowPracticeFilter && practiceState !== "all") {
      setPracticeState("all");
    }
  }, [practiceState, shouldShowPracticeFilter]);

  const assignedGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        classId: string;
        className: string;
        classSubject: string;
        items: StudentAssignedQuizLibraryItem[];
      }
    >();

    (filteredItems as StudentAssignedQuizLibraryItem[]).forEach((item) => {
      if (!item.assignmentContext) {
        return;
      }

      const existingGroup = grouped.get(item.assignmentContext.classId);

      if (existingGroup) {
        existingGroup.items.push(item);
        return;
      }

      grouped.set(item.assignmentContext.classId, {
        classId: item.assignmentContext.classId,
        className: item.assignmentContext.className,
        classSubject: item.assignmentContext.classSubject,
        items: [item],
      });
    });

    return Array.from(grouped.values());
  }, [filteredItems]);

  const getStudentMetadata = (item: QuizLibraryItem): QuizCardMetadataItem[] => [
    {
      icon: BookOpen,
      label: `${item.questionCount} questions`,
    },
    {
      icon: Clock3,
      label: `${item.durationMinutes} min`,
    },
    {
      icon: UserRound,
      label: `By ${item.creatorName}`,
    },
    {
      icon: Sparkles,
      label:
        item.practiceProgressLabel ??
        (item.practiceState === "completed"
          ? "Completed"
          : item.practiceState === "in-progress"
            ? "In progress"
            : "Ready to start"),
    },
  ];

  const getStudentBadge = (item: QuizLibraryItem) => {
    if (item.sourceType === "generated") {
      if (item.status === "draft" || item.status === "generated" || item.status === "edited") {
        return "Draft";
      }

      return item.visibility === "public" ? "Shared by you" : "My set";
    }

    if (item.sourceType === "saved") {
      return "Saved";
    }

    if (item.sourceType === "history" && item.isAssigned) {
      return "Assigned";
    }

    return item.isRecommended ? "Recommended" : undefined;
  };

  const getPracticeLabel = (item: QuizLibraryItem) => {
    if (item.sourceType === "assigned" || item.isAssigned) {
      if (item.practiceState === "completed") {
        return "View Quiz";
      }

      if (item.practiceState === "in-progress") {
        return "Continue Quiz";
      }

      return "Start Quiz";
    }

    if (item.practiceState === "completed") {
      return "Practice Again";
    }

    if (item.practiceState === "in-progress") {
      return "Continue Practice";
    }

    return "Start Practice";
  };

  const getStudentActions = (item: QuizLibraryItem): QuizCardAction[] => {
    if (activeTab === "history" && item.practiceState === "completed") {
      return [
        {
          label: item.isAssigned ? "View Quiz" : "Practice Again",
          icon: RotateCcw,
        },
        {
          label: "Review Session",
          icon: BookMarked,
          variant: "secondary",
        },
      ];
    }

    if (item.sourceType === "assigned" || item.isAssigned) {
      return [
        {
          label: getPracticeLabel(item),
          icon: Play,
        },
        {
          label: "View Details",
          icon: BookOpen,
          variant: "secondary",
        },
      ];
    }

    if (item.isGeneratedByCurrentUser) {
      return [
        {
          label: getPracticeLabel(item),
          icon: Play,
        },
        {
          label:
            item.status === "draft" || item.status === "generated" || item.status === "edited"
              ? "Review Draft"
              : "Edit Set",
          icon: FilePenLine,
          variant: "secondary",
          onClick: () =>
            navigate("/dashboard/student/generate-quiz", {
              state: { editQuizId: item.id },
            }),
        },
        {
          label: "Delete",
          icon: Trash2,
          variant: "ghost",
          onClick: () => deleteQuiz(item.id, "student"),
        },
      ];
    }

    return [
      {
        label: getPracticeLabel(item),
        icon: Play,
      },
      {
        label: item.isSaved ? "Saved" : "Save",
        icon: item.isSaved ? BookMarked : BookmarkPlus,
        variant: item.isSaved ? "soft" : "ghost",
        onClick: () => toggleSavedQuiz(item.id, "student"),
      },
      {
        label: "Duplicate",
        icon: Layers3,
        variant: "ghost",
        onClick: () => {
          const duplicate = duplicateQuizToLibrary(item.id, "student");

          if (duplicate) {
            navigate("/dashboard/student/generate-quiz", {
              state: { editQuizId: duplicate.id },
            });
          }
        },
      },
    ];
  };

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your class invitation first",
        description:
          "You have pending class invitations. Once you accept them in Notifications, quizzes assigned to those classes will unlock here automatically.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "You have not joined a class yet",
        description:
          "Assigned quizzes are membership-based. Join a class from Notifications to see class work in this section.",
      };
    }

    return {
      title: "Your classes have no assigned quizzes yet",
      description:
        "You are already in at least one class, but your teachers have not assigned quizzes to those classes yet.",
    };
  };

  const renderActiveContent = () => {
    if (activeTab === "assigned") {
      if (assignedGroups.length) {
        return (
          <div className="space-y-6">
            {assignedGroups.map((group) => (
              <section key={group.classId} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
                      {group.className}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      {group.classSubject || "Class assignment feed"} with {group.items.length}{" "}
                      {group.items.length === 1 ? "quiz" : "quizzes"} currently assigned.
                    </p>
                  </div>

                  <DashboardBadge tone="info" size="md">
                    {group.items.length} {group.items.length === 1 ? "quiz" : "quizzes"}
                  </DashboardBadge>
                </div>

                <QuizGrid
                  items={group.items}
                  renderCard={(item) => (
                    <AssignedQuizCard
                      key={item.assignmentContext.assignmentId}
                      item={item}
                      actions={getStudentActions(item)}
                      badgeLabel={group.classSubject || undefined}
                    />
                  )}
                />
              </section>
            ))}
          </div>
        );
      }

      if (hasActiveFilters) {
        return (
          <SearchEmptyState
            title={activeTabConfig.emptyTitle}
            description={activeTabConfig.emptyDescription}
          />
        );
      }

      const assignedEmptyState = getAssignedEmptyState();

      return (
        <EmptyAssignedQuizzesState
          title={assignedEmptyState.title}
          description={assignedEmptyState.description}
        />
      );
    }

    if (filteredItems.length) {
      return (
        <QuizGrid
          items={filteredItems}
          renderCard={(item) => (
            <QuizCard
              key={item.id}
              item={item}
              metadata={getStudentMetadata(item)}
              actions={getStudentActions(item)}
              badgeLabel={getStudentBadge(item)}
            />
          )}
        />
      );
    }

    return (
      <SearchEmptyState
        title={activeTabConfig.emptyTitle}
        description={activeTabConfig.emptyDescription}
      />
    );
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Quiz Library"}
        subtitle="Keep assigned class work separate from discovery and personal study sets, with visibility tied to the classes you have actually joined."
        actions={
          <DashboardButton asChild size="lg">
            <Link to="/dashboard/student/generate-quiz">
              Generate from Notes
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
          activeTab === "assigned"
            ? "Assigned quizzes only appear after invitation acceptance creates an active class membership."
            : undefined
        }
      />

      <section className="space-y-5">
        <LibrarySectionHeader
          title={activeTabConfig.label}
          description={activeTabConfig.description}
          resultCount={filteredItems.length}
        />

        {renderActiveContent()}
      </section>
    </div>
  );
}
