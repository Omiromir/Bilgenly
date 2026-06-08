import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  Clock3,
  FilePenLine,
  Play,
  Sparkles,
  Trash2,
  UserRound,
} from "../../../components/icons/AppIcons";
import { cn } from "../../../components/ui/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { useQuizLibrary } from "../../../app/providers/QuizLibraryProvider";
import { useQuizSessions } from "../../../app/providers/QuizSessionProvider";
import { useStudentAttempts } from "../../../app/providers/StudentAttemptsProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
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
import { useQuizLauncher } from "../../../features/quiz-session/useQuizLauncher";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import {
  isDismissibleAssignment,
  useDismissedAssignments,
} from "../../../features/assignments/useDismissedAssignments";
import { matchesAssignedProgress } from "../../../features/assignments/assignedQuizAvailability";

type StudentLibraryTab = "assigned" | "personal-library";

export function StudentQuizLibraryPage() {
  const meta = useDashboardPageMeta();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classes } = useTeacherClasses();
  const { quizzes, deleteQuiz } = useQuizLibrary();
  const { sessions } = useQuizSessions();
  const { openQuiz } = useQuizLauncher();
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const { dismissed, dismiss } = useDismissedAssignments(studentViewer?.id);
  const studentIdentity = useMemo(
    () => ({
      userId: studentViewer?.id,
      email: studentViewer?.email,
    }),
    [studentViewer?.email, studentViewer?.id],
  );
  const {
    attempts: allAttempts,
    isLoading: attemptsLoading,
    error: attemptsError,
  } = useStudentAttempts();

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
  const initialTab = location.state?.libraryTab as StudentLibraryTab | undefined;
  const [activeTab, setActiveTab] = useState<StudentLibraryTab>(
    initialTab === "personal-library" ? initialTab : "assigned",
  );
  const [search, setSearch] = useState("");
  const [practiceState, setPracticeState] = useState("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [quizPendingDelete, setQuizPendingDelete] = useState<QuizLibraryItem | null>(null);
  const deferredSearch = useDeferredValue(search);

  const toggleGroup = (classId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const confirmDeleteQuiz = async () => {
    if (!quizPendingDelete) {
      return;
    }
    try {
      await deleteQuiz(quizPendingDelete.id, "student");
      setQuizPendingDelete(null);
    } catch (nextError) {
      toast.error(
        nextError instanceof Error ? nextError.message : "Unable to delete quiz.",
      );
    }
  };

  const getStudentItemsForTab = (tab: StudentLibraryTab) => {
    switch (tab) {
      case "assigned":
        return studentSources.assigned;
      case "personal-library":
        return studentSources.personalLibrary;
      default:
        return studentSources.assigned;
    }
  };

  const activeTabItems = getStudentItemsForTab(activeTab);
  const isAssignedTab = activeTab === "assigned";

  const assignedTabFiltered =
    isAssignedTab
      ? activeTabItems.filter((item) => {
          if (item.sourceType !== "assigned" && !("isAssigned" in item && item.isAssigned)) {
            return true;
          }
          const assigned = item as StudentAssignedQuizLibraryItem;
          const state = assigned.assignmentState;
          if (dismissed.has(assigned.assignmentContext.assignmentId)) return false;
          if (!matchesAssignedProgress(state, practiceState)) return false;
          if (practiceState === "all") {
            const isFullyDone = state.canReview && !state.canStart && !state.canResume;
            if (isFullyDone) return false;
          }
          return true;
        })
      : activeTabItems;

  const filteredItems = isAssignedTab
    ? assignedTabFiltered.filter((item) => matchesQuizSearch(item, deferredSearch))
    : assignedTabFiltered.filter(
        (item) =>
          matchesQuizSearch(item, deferredSearch) &&
          matchesQuizFilters(item, {
            practiceState,
            topic: "all",
            difficulty: "all",
            language: "all",
            creator: "all",
          }),
      );

  const visibleAssignedCount = studentSources.assigned.filter((item) => {
    const state = item.assignmentState;
    const isFullyDone = state.canReview && !state.canStart && !state.canResume;
    return !isFullyDone && !dismissed.has(item.assignmentContext.assignmentId);
  }).length;

  const tabs = [
    {
      id: "assigned" as const,
      label: "Assigned",
      description:
        "Assigned quizzes unlocked by joined classes, kept separate from your personal study sets.",
      count: visibleAssignedCount,
      emptyTitle: "No assigned quizzes yet",
      emptyDescription:
        "Assigned quizzes only appear after you accept a class invite and become an active class member.",
    },
    {
      id: "personal-library" as const,
      label: "Personal Library",
      description:
        "Your generated study sets — keep practicing the ones you made and pick up where you left off.",
      count: studentSources.personalLibrary.length,
      emptyTitle: "Your personal library is empty",
      emptyDescription:
        "Generate a study set from your notes to start building your personal library.",
    },
  ];

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const hasActiveFilters = search.trim() !== "" || practiceState !== "all";

  const resetFilters = () => {
    setSearch("");
    setPracticeState("all");
  };

  const visibleFilterOptions = [
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

      return "My set";
    }

    if (item.sourceType === "history") {
      return "Recently used";
    }

    return item.isRecommended ? "Recommended" : undefined;
  };

  const getPracticeLabel = (item: QuizLibraryItem) => {
    if (item.sourceType === "assigned" || item.isAssigned) {
      const assignedItem = item as StudentAssignedQuizLibraryItem;
      return assignedItem.assignmentState.primaryActionLabel;
    }

    if (item.practiceState === "completed") {
      return "Retake Practice";
    }

    if (item.practiceState === "in-progress") {
      return "Continue Practice";
    }

    return "Start Practice";
  };

  const openStudentQuiz = (item: QuizLibraryItem) => {
    openQuiz({
      quizId: item.id,
      viewerRole: "student",
      assignmentId: item.assignmentContext?.assignmentId,
      preferredSession:
        item.sourceType === "assigned" || item.isAssigned
          ? (() => {
              const assignedItem = item as StudentAssignedQuizLibraryItem;

              return assignedItem.assignmentState.canReview
                ? "completed"
                : assignedItem.assignmentState.canResume
                  ? "in-progress"
                  : undefined;
            })()
          : item.practiceState === "in-progress"
            ? "in-progress"
            :
              undefined,
      navigationState: {
        launchSourceType: item.sourceType ?? "quiz-library",
        launchSourceLabel:
          item.sourceType === "assigned"
            ? `${item.assignmentContext?.className ?? "Class"} assignment`
            : item.sourceLabel,
        returnToPath: "/dashboard/student/quiz-library",
        returnToLabel: "Back to quiz library",
      },
    });
  };

  const getStudentActions = (item: QuizLibraryItem): QuizCardAction[] => {
    if (item.sourceType === "assigned" || item.isAssigned) {
      const assignedItem = item as StudentAssignedQuizLibraryItem;

      return [
        {
          label: getPracticeLabel(item),
          icon: Play,
          iconDisplay: "label-only",
          disabled:
            assignedItem.assignmentState.isLoading ||
            (!assignedItem.assignmentState.canStart &&
              !assignedItem.assignmentState.canResume &&
              !assignedItem.assignmentState.canReview),
          onClick: () => openStudentQuiz(item),
        },
      ];
    }

    return [
      {
        label: getPracticeLabel(item),
        icon: Play,
        iconDisplay: "label-only",
        onClick: () => openStudentQuiz(item),
      },
      {
        label:
          item.status === "draft" ||
          item.status === "generated" ||
          item.status === "edited"
            ? "Review Draft"
            : "Edit Set",
        icon: FilePenLine,
        variant: "secondary",
        iconDisplay: "icon-only",
        onClick: () =>
          navigate("/dashboard/student/generate-quiz", {
            state: { editQuizId: item.id },
          }),
      },
      {
        label: "Delete",
        icon: Trash2,
        variant: "ghost",
        iconDisplay: "icon-only",
        onClick: () => setQuizPendingDelete(item),
      },
    ];
  };

  const getAssignedEmptyState = () => {
    if (studentSources.pendingMemberships.length) {
      return {
        title: "Accept your class invite first",
        description:
          "You still have pending class invites. Once you accept them in Notifications, assigned quizzes will unlock here automatically.",
      };
    }

    if (!studentSources.activeMemberships.length) {
      return {
        title: "You have not joined a class yet",
        description:
          "Assigned quizzes are membership-based. Join a class from Notifications to see class quizzes here.",
      };
    }

    return {
        title: "Your classes have no assigned quizzes yet",
        description:
          "You are already in at least one class, but no assigned quizzes are available in those classes yet.",
    };
  };

  const renderActiveContent = () => {
    if (activeTab === "assigned") {
      if (assignedGroups.length) {
        return (
          <div className="space-y-3">
            {assignedGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.classId);
              return (
                <section key={group.classId}>
                  
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.classId)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-4 text-left transition hover:bg-[var(--dashboard-surface-elevated)] active:scale-[0.995]"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[var(--dashboard-text-strong)]">
                        {group.className}
                      </h3>
                      <p className="mt-0.5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                        {group.classSubject || "General"} ·{" "}
                        <span className={cn(isCollapsed && "font-medium text-[var(--dashboard-text-strong)]")}>
                          {group.items.length} {group.items.length === 1 ? "quiz" : "quizzes"}
                        </span>
                        {isCollapsed ? " hidden" : " assigned"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <DashboardButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/dashboard/student/classes", {
                            state: { selectedClassId: group.classId },
                          });
                        }}
                      >
                        Open class
                      </DashboardButton>

                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[var(--dashboard-text-soft)] transition-transform duration-200",
                          isCollapsed ? "rotate-0" : "rotate-180",
                        )}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </div>
                  </button>

                  
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isCollapsed ? "max-h-0 opacity-0" : "max-h-[9999px] opacity-100",
                    )}
                  >
                    <div className="pt-3">
                      <QuizGrid
                        items={group.items}
                        renderCard={(item) => (
                          <AssignedQuizCard
                            key={item.assignmentContext.assignmentId}
                            item={item}
                            actions={getStudentActions(item)}
                            badgeLabel={group.classSubject || undefined}
                            onDismiss={
                              isDismissibleAssignment(item.assignmentState)
                                ? () => dismiss(item.assignmentContext.assignmentId)
                                : undefined
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
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
        subtitle="Class-assigned work stays separate from your personal study sets so each tab has a single, clear purpose."
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
            ? "Assigned quizzes only appear after class invite acceptance creates an active class membership."
            : "Personal Library shows the study sets you generated from your own notes."
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

      <AlertDialog
        open={Boolean(quizPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setQuizPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              {quizPendingDelete
                ? `Delete "${quizPendingDelete.title}" permanently. This removes it from your personal library and cannot be undone.`
                : "Delete this quiz permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--dashboard-danger)] text-white hover:bg-[var(--dashboard-danger)]/90"
              onClick={confirmDeleteQuiz}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
