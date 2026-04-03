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
} from "../../../components/icons/AppIcons";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardPageClassName,
  dashboardTabVariants,
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
import { cn } from "../../../components/ui/utils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

type StudentLibraryTab = "assigned" | "discover" | "personal-library";
type PersonalLibraryFilter = "all" | "generated" | "saved" | "recently-used";

export function StudentQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes, deleteQuiz, duplicateQuizToLibrary, toggleSavedQuiz } =
    useQuizLibrary();
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
  );
  const studentSources = useMemo(
    () => buildStudentQuizLibrarySources(classes, quizzes, studentIdentity),
    [classes, quizzes, studentIdentity],
  );
  const initialTab = location.state?.libraryTab as StudentLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<StudentLibraryTab>(
    initialTab === "discover" || initialTab === "personal-library"
      ? initialTab
      : "assigned",
  );
  const [personalFilter, setPersonalFilter] =
    useState<PersonalLibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [practiceState, setPracticeState] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const shouldShowPracticeFilter =
    activeTab === "assigned" ||
    (activeTab === "personal-library" && personalFilter === "recently-used");

  useEffect(() => {
    if (activeTab !== "personal-library" && personalFilter !== "all") {
      setPersonalFilter("all");
    }
  }, [activeTab, personalFilter]);

  useEffect(() => {
    if (!shouldShowPracticeFilter && practiceState !== "all") {
      setPracticeState("all");
    }
  }, [practiceState, shouldShowPracticeFilter]);

  const getStudentItemsForTab = (tab: StudentLibraryTab) => {
    switch (tab) {
      case "assigned":
        return studentSources.assigned;
      case "discover":
        return studentSources.discover;
      case "personal-library":
        switch (personalFilter) {
          case "generated":
            return studentSources.personalGenerated;
          case "saved":
            return studentSources.personalSaved;
          case "recently-used":
            return studentSources.personalRecent;
          case "all":
          default:
            return studentSources.personalLibrary;
        }
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
        "Teacher-assigned quizzes unlocked by classes you have already joined, with class context kept separate from everything else.",
      count: studentSources.assigned.length,
      emptyTitle: "No assigned quizzes yet",
      emptyDescription:
        "Assigned quizzes only appear after you accept the class invitation and become an active class member.",
    },
    {
      id: "discover" as const,
      label: "Discover",
      description:
        "Browse public quizzes without mixing them into teacher-assigned class work or your personal study shelf.",
      count: studentSources.discover.length,
      emptyTitle: "No public quizzes match this view",
      emptyDescription:
        "Discover only shows public quizzes. Clear the current search to widen the library.",
    },
    {
      id: "personal-library" as const,
      label: "Personal Library",
      description:
        "Keep your generated study sets, saved quizzes, and recently used personal practice in one simpler workspace.",
      count: studentSources.personalLibrary.length,
      emptyTitle: "Your personal library is empty",
      emptyDescription:
        "Generate a study set or save a public quiz to start building your personal library.",
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

  const personalLibraryFilters = [
    {
      id: "all" as const,
      label: "All",
      count: studentSources.personalLibrary.length,
    },
    {
      id: "generated" as const,
      label: "Generated",
      count: studentSources.personalGenerated.length,
    },
    {
      id: "saved" as const,
      label: "Saved",
      count: studentSources.personalSaved.length,
    },
    {
      id: "recently-used" as const,
      label: "Recently Used",
      count: studentSources.personalRecent.length,
    },
  ];

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

    if (item.sourceType === "history") {
      return "Recently used";
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
    if (item.sourceType === "assigned" || item.isAssigned) {
      return [
        {
          label: getPracticeLabel(item),
          icon: Play,
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

    if (item.sourceType === "history" && item.practiceState === "completed") {
      return [
        {
          label: "Practice Again",
          icon: RotateCcw,
        },
        {
          label: item.isSaved ? "Saved" : "Save",
          icon: item.isSaved ? BookMarked : BookmarkPlus,
          variant: item.isSaved ? "soft" : "ghost",
          onClick: () => toggleSavedQuiz(item.id, "student"),
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
          "You still have pending class invitations. Once you accept them in Notifications, teacher-assigned quizzes will unlock here automatically.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "You have not joined a class yet",
        description:
          "Assigned quizzes are membership-based. Join a class from Notifications to see class work here.",
      };
    }

    return {
      title: "Your classes have no assigned quizzes yet",
      description:
        "You are already in at least one class, but no teacher has attached quizzes to those classes yet.",
    };
  };

  const getPersonalLibraryEmptyState = () => {
    if (personalFilter === "generated") {
      return {
        title: "No generated study sets yet",
        description:
          "Generate a quiz from your notes to start building your personal study library.",
      };
    }

    if (personalFilter === "saved") {
      return {
        title: "No saved quizzes yet",
        description:
          "Save a public quiz from Discover to keep it in your personal library.",
      };
    }

    if (personalFilter === "recently-used") {
      return {
        title: "No recent personal practice yet",
        description:
          "Once you begin or finish a quiz from your personal library, it will appear here for quick return.",
      };
    }

    return {
      title: activeTabConfig.emptyTitle,
      description: activeTabConfig.emptyDescription,
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

                  <DashboardButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate("/dashboard/student/classes", {
                        state: { selectedClassId: group.classId },
                      })
                    }
                  >
                    Open class
                  </DashboardButton>
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

    if (activeTab === "personal-library" && !filteredItems.length) {
      const emptyState = getPersonalLibraryEmptyState();

      return (
        <SearchEmptyState
          title={emptyState.title}
          description={emptyState.description}
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
        subtitle="Keep class-assigned work separate from public discovery and your personal study shelf, with fewer overlapping categories."
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

      {activeTab === "personal-library" ? (
        <DashboardSurface radius="lg" padding="sm">
          <div className="flex flex-wrap gap-2">
            {personalLibraryFilters.map((filter) => {
              const isActive = filter.id === personalFilter;

              return (
                <button
                  key={filter.id}
                  type="button"
                  className={cn(
                    dashboardTabVariants({ active: isActive }),
                    "w-auto min-w-[152px] justify-between px-4 py-3 text-sm",
                  )}
                  onClick={() => setPersonalFilter(filter.id)}
                >
                  <span>{filter.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      isActive
                        ? "bg-white/16 text-white"
                        : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]",
                    )}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </DashboardSurface>
      ) : null}

      <QuizFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        filters={visibleFilterOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        helperText={
          activeTab === "assigned"
            ? "Assigned quizzes only appear after invitation acceptance creates an active class membership."
            : activeTab === "personal-library"
              ? "Personal Library combines your generated study sets, saved quizzes, and recent personal practice in one clearer place."
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
