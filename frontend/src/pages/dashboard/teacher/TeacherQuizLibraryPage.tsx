import { useDeferredValue, useEffect, useState } from "react";
import {
  BookOpen,
  Clock3,
  Eye,
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

type TeacherLibraryTab =
  | "my-quizzes"
  | "drafts"
  | "public-library";

export function TeacherQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { quizzes, deleteQuiz, duplicateQuizToLibrary, toggleSavedQuiz } =
    useQuizLibrary();
  const teacherQuizLibraryItems = getQuizLibraryItemsForRole(quizzes, "teacher");
  const initialTab = location.state?.libraryTab as TeacherLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<TeacherLibraryTab>(
    initialTab === "drafts" ||
      initialTab === "public-library"
      ? initialTab
      : "my-quizzes",
  );
  const [selectedQuiz, setSelectedQuiz] = useState<QuizLibraryItem | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
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
    const previewAction = {
      label: "Preview",
      icon: Eye,
      variant: "secondary" as const,
      onClick: () => setSelectedQuiz(item),
    };

    if (!item.isOwner) {
      return [
        previewAction,
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
        previewAction,
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
        },
        previewAction,
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
      previewAction,
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

      <QuizPreviewDialog
        item={selectedQuiz}
        metadata={selectedQuiz ? getTeacherMetadata(selectedQuiz) : []}
        actions={selectedQuiz ? getTeacherActions(selectedQuiz) : []}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuiz(null);
          }
        }}
      />
    </div>
  );
}
