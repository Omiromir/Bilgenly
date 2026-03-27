import { useDeferredValue, useEffect, useState } from "react";
import {
  BookMarked,
  BookOpen,
  BookmarkPlus,
  Clock3,
  Trash2,
  Eye,
  FilePenLine,
  Layers3,
  Play,
  RotateCcw,
  Star,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  getQuizLibraryItemsForRole,
  useQuizLibrary,
} from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import {
  LibrarySectionHeader,
  LibraryTabs,
  QuizCard,
  QuizFilterBar,
  QuizGrid,
  QuizPreviewDialog,
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

type StudentLibraryTab =
  | "discover"
  | "my-quizzes"
  | "drafts"
  | "assigned"
  | "history";

export function StudentQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { quizzes, deleteQuiz, duplicateQuizToLibrary, toggleSavedQuiz } =
    useQuizLibrary();
  const studentQuizLibraryItems = getQuizLibraryItemsForRole(quizzes, "student");
  const initialTab = location.state?.libraryTab as StudentLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<StudentLibraryTab>(
    initialTab === "my-quizzes" ||
      initialTab === "drafts" ||
      initialTab === "assigned" ||
      initialTab === "history"
      ? initialTab
      : "discover",
  );
  const [selectedQuiz, setSelectedQuiz] = useState<QuizLibraryItem | null>(null);
  const [search, setSearch] = useState("");
  const [practiceState, setPracticeState] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const shouldShowPracticeFilter =
    activeTab === "assigned" || activeTab === "history";

  const getStudentItemsForTab = (tab: StudentLibraryTab) => {
    switch (tab) {
      case "discover":
        return studentQuizLibraryItems.filter((item) => isPublicDiscoveryQuiz(item));
      case "my-quizzes":
        return studentQuizLibraryItems.filter(
          (item) =>
            (item.isGeneratedByCurrentUser && !isDraftQuiz(item.status)) ||
            item.isSaved,
        );
      case "drafts":
        return studentQuizLibraryItems.filter(
          (item) => item.isGeneratedByCurrentUser && isDraftQuiz(item.status),
        );
      case "assigned":
        return studentQuizLibraryItems.filter((item) => item.isAssigned);
      case "history":
        return studentQuizLibraryItems.filter(
          (item) =>
            item.practiceState === "in-progress" ||
            item.practiceState === "completed",
        );
      default:
        return studentQuizLibraryItems;
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
      id: "discover" as const,
      label: "Discover",
      description:
        "Browse the shared public quiz library to find something worth practicing right now.",
      count: getStudentItemsForTab("discover").length,
      emptyTitle: "No public quizzes match this search",
      emptyDescription:
        "Discover is reserved for published public quizzes. Clear a filter to widen the shared library view.",
    },
    {
      id: "my-quizzes" as const,
      label: "My Quizzes",
      description:
        "Your published private/public quizzes plus any public quizzes you saved for later practice.",
      count: getStudentItemsForTab("my-quizzes").length,
      emptyTitle: "No quizzes in your library yet",
      emptyDescription:
        "Publish one of your quizzes or save a public quiz to start filling this view.",
    },
    {
      id: "drafts" as const,
      label: "Drafts",
      description:
        "Private study sets you saved before publishing, so you can come back and refine them later.",
      count: getStudentItemsForTab("drafts").length,
      emptyTitle: "No draft study sets found",
      emptyDescription:
        "Save a generated quiz as a draft to keep reviewing and editing it before you publish it.",
    },
    {
      id: "assigned" as const,
      label: "Assigned",
      description:
        "Teacher-assigned quizzes that belong in your learning flow, while practice still stays the main action once you open them.",
      count: getStudentItemsForTab("assigned").length,
      emptyTitle: "No assigned quizzes yet",
      emptyDescription:
        "Assigned quizzes will appear here when a teacher sends one to you, keeping assigned work distinct from broader library discovery.",
    },
    {
      id: "history" as const,
      label: "History",
      description:
        "Return to in-progress and completed practice sessions without leaving the library experience.",
      count: getStudentItemsForTab("history").length,
      emptyTitle: "No practice history found",
      emptyDescription:
        "Once you begin or finish practice sessions, they will surface here for quick return and review.",
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
      icon: Star,
      label:
        item.practiceProgressLabel ??
        `${item.attemptCount ?? 0} ${item.attemptCount === 1 ? "attempt" : "attempts"}`,
    },
  ];

  const getStudentBadge = (item: QuizLibraryItem) => {
    if (item.isGeneratedByCurrentUser) {
      if (isDraftQuiz(item.status)) {
        return "My draft";
      }

      return item.visibility === "public" ? "Shared by you" : "My set";
    }

    if (item.isAssigned) {
      return "Assigned";
    }

    if (item.isRecommended) {
      return "Recommended";
    }

    if (item.isSaved) {
      return "Saved";
    }

    return undefined;
  };

  const getPracticeLabel = (item: QuizLibraryItem) => {
    if (item.practiceState === "completed") {
      return "Practice Again";
    }

    if (item.practiceState === "in-progress") {
      return "Continue Practice";
    }

    return "Start Practice";
  };

  const getStudentActions = (item: QuizLibraryItem): QuizCardAction[] => {
    const previewAction = {
      label: "Preview",
      icon: Eye,
      variant: "secondary" as const,
      onClick: () => setSelectedQuiz(item),
    };

    if (activeTab === "history" && item.practiceState === "completed") {
      return [
        {
          label: "Practice Again",
          icon: RotateCcw,
        },
        {
          label: "Review Session",
          icon: BookMarked,
          variant: "secondary",
        },
        previewAction,
      ];
    }

    if (item.isGeneratedByCurrentUser) {
      return [
        {
          label: getPracticeLabel(item),
          icon: Play,
        },
        {
          label: isDraftQuiz(item.status) ? "Review Draft" : "Edit Set",
          icon: FilePenLine,
          variant: "secondary",
          onClick: () =>
            navigate("/dashboard/student/generate-quiz", {
              state: { editQuizId: item.id },
            }),
        },
        previewAction,
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
      previewAction,
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

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Quiz Library"}
        subtitle="Browse public quizzes, keep your own generated study sets close, and start self-paced practice from the library when you are ready."
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
      />

      <section className="space-y-5">
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
                metadata={getStudentMetadata(item)}
                actions={getStudentActions(item)}
                badgeLabel={getStudentBadge(item)}
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

      <QuizPreviewDialog
        item={selectedQuiz}
        metadata={selectedQuiz ? getStudentMetadata(selectedQuiz) : []}
        actions={selectedQuiz ? getStudentActions(selectedQuiz) : []}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuiz(null);
          }
        }}
      />
    </div>
  );
}
