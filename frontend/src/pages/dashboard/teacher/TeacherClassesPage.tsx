import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, Trash2, Users } from "../../../components/icons/AppIcons";
import { toast } from "sonner";
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
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import {
  getQuizLibraryItemsForRole,
  useQuizLibrary,
} from "../../../app/providers/QuizLibraryProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  DashboardSurface,
  dashboardMetaTextClassName,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyStateBlock } from "../../../features/dashboard/components/EmptyStateBlock";
import { LoadingCard } from "../../../features/dashboard/components/LoadingCard";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import {
  AddStudentsDialog,
  AssignQuizDialog,
  TeacherClassCard,
  TeacherClassDetailsPanel,
  TeacherClassFilterBar,
  TeacherClassFormDialog,
  TeacherClassesListEmptyState,
  TeacherClassesSearchEmptyState,
} from "../../../features/dashboard/components/classes/TeacherClassesComponents";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStatus,
  TeacherClassStudent,
} from "../../../features/dashboard/components/classes/teacherClassesTypes";
import { isDraftQuiz } from "../../../features/dashboard/components/quiz-library/quizLibraryUtils";
import { matchesTeacherClassSearch } from "../../../features/dashboard/components/classes/teacherClassesUtils";
import { useAssignmentInsights } from "../../../features/dashboard/hooks/useDashboardAnalytics";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { useAuth } from "../../../app/providers/AuthProvider";

export function TeacherClassesPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const {
    classes,
    isLoading,
    error,
    createClass,
    updateClass,
    setClassStatus,
    addStudentsToClass,
    removeStudentFromClass,
    resendStudentInvite,
    assignQuizToClasses,
    removeQuizFromClass,
    deleteClass,
  } = useTeacherClasses();
  const { quizzes } = useQuizLibrary();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddStudentsDialogOpen, setIsAddStudentsDialogOpen] = useState(false);
  const [isAssignQuizDialogOpen, setIsAssignQuizDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeacherClassRecord | null>(null);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [editDialogError, setEditDialogError] = useState<string | null>(null);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TeacherClassStatus>("all");
  const [classPendingDelete, setClassPendingDelete] =
    useState<TeacherClassRecord | null>(null);
  const [membershipFeedback, setMembershipFeedback] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId(null);
      return;
    }

    if (selectedClassId && classes.some((item) => item.id === selectedClassId)) {
      return;
    }

    setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);

  useEffect(() => {
    setMembershipFeedback(null);
  }, [selectedClassId]);

  const handleCreateClass = async (values: TeacherClassFormValues) => {
    if (isCreatingClass) {
      return;
    }

    try {
      setIsCreatingClass(true);
      setCreateDialogError(null);
      const nextClass = await createClass(values);
      setSelectedClassId(nextClass.id);
      setIsCreateDialogOpen(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to create class.";
      setCreateDialogError(message);
      toast.error(message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleEditClass = async (values: TeacherClassFormValues) => {
    if (!editingClass || isSavingClass) {
      return;
    }

    try {
      setIsSavingClass(true);
      setEditDialogError(null);
      const updatedClass = await updateClass(editingClass.id, values);

      if (updatedClass) {
        setSelectedClassId(updatedClass.id);
      }

      setEditingClass(null);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to update class.";
      setEditDialogError(message);
      toast.error(message);
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleToggleArchive = async (teacherClass: TeacherClassRecord) => {
    try {
      await setClassStatus(
        teacherClass.id,
        teacherClass.status === "active" ? "archived" : "active",
      );
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update class archive status.",
      );
    }
  };

  const handleDeleteClass = async () => {
    if (!classPendingDelete) {
      return;
    }

    try {
      await deleteClass(classPendingDelete.id);
      setClassPendingDelete(null);
    } catch (nextError) {
      toast.error(
        nextError instanceof Error ? nextError.message : "Unable to delete class.",
      );
    }
  };

  const handleAddStudents = (emails: string[]) => {
    if (!selectedClass || selectedClass.status !== "active") {
      return;
    }

    const addedStudents = addStudentsToClass(selectedClass.id, emails);

    if (!addedStudents.length) {
      return;
    }

    setMembershipFeedback(
      `${addedStudents.length} ${
        addedStudents.length === 1
          ? "student now has a class invite"
          : "students now have class invites"
      } for ${selectedClass.name}. In-app notifications were created where preferences allow them.`,
    );
  };

  const handleRemoveAssignedQuiz = async (quiz: TeacherClassAssignedQuiz) => {
    if (!selectedClass || selectedClass.status !== "active") {
      return;
    }

    try {
      await removeQuizFromClass(selectedClass.id, quiz.assignmentId);
      setMembershipFeedback(
        `${quiz.title} is no longer visible to joined members of ${selectedClass.name}.`,
      );
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to remove assigned quiz.",
      );
    }
  };

  const handleRemoveStudentFromClass = (student: TeacherClassStudent) => {
    if (!selectedClass || selectedClass.status !== "active") return;
    removeStudentFromClass(selectedClass.id, student.id);
    setMembershipFeedback(`${student.fullName} was removed from ${selectedClass.name}.`);
  };

  const handleResendStudentInvite = (student: TeacherClassStudent) => {
    if (!selectedClass || selectedClass.status !== "active") return;
    resendStudentInvite(selectedClass.id, student.id);
    setMembershipFeedback(`Class invite refreshed for ${student.fullName}.`);
  };

  const selectedClass =
    classes.find((item) => item.id === selectedClassId) ?? null;
  const isSelectedClassActive = selectedClass?.status === "active";
  const assignmentInsightsState = useAssignmentInsights(
    selectedClass?.assignedQuizzes ?? [],
  );
  const assignableQuizzes = getQuizLibraryItemsForRole(
    quizzes,
    "teacher",
    currentUser?.id,
  ).filter(
    (quiz) => quiz.isOwner && !isDraftQuiz(quiz.status) && quiz.status !== "archived",
  );
  const filteredClasses = classes.filter((teacherClass) => {
    const matchesStatus =
      statusFilter === "all" ? true : teacherClass.status === statusFilter;

    return matchesStatus && matchesTeacherClassSearch(teacherClass, deferredSearch);
  });
  const activeClassesCount = classes.filter(
    (teacherClass) => teacherClass.status === "active",
  ).length;
  const archivedClassesCount = classes.length - activeClassesCount;
  const totalStudentsCount = classes.reduce(
    (total, teacherClass) => total + teacherClass.studentCount,
    0,
  );
  const overviewItems = [
    {
      label: "Total classes",
      value: classes.length,
    },
    {
      label: "Active classes",
      value: activeClassesCount,
    },
    {
      label: "Archived classes",
      value: archivedClassesCount,
      helper: totalStudentsCount
        ? `${totalStudentsCount} student memberships`
        : "",
    },
  ];

  const handleAssignQuiz = async (
    quiz: (typeof assignableQuizzes)[number],
    settings: {
      deadline: string | null;
      maxAttempts: number | null;
      allowLateSubmissions: boolean;
    },
  ) => {
    if (!selectedClass || selectedClass.status !== "active") {
      return;
    }

    try {
      const assignedClassIds = await assignQuizToClasses(
        {
          quizId: quiz.id,
          title: quiz.title,
          topic: quiz.topic,
          questionCount: quiz.questionCount,
        },
        [selectedClass.id],
        settings,
      );

      if (!assignedClassIds.length) {
        setMembershipFeedback(
          `${quiz.title} is already visible to joined members of ${selectedClass.name}.`,
        );
        return;
      }

      setMembershipFeedback(
        `${quiz.title} is now visible to joined members of ${selectedClass.name}.`,
      );
      setIsAssignQuizDialogOpen(false);
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to assign quiz to this class.",
      );
    }
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Classes"}
        subtitle=""
        actions={
          <DashboardButton
            type="button"
            size="lg"
            onClick={() => {
              setCreateDialogError(null);
              setIsCreateDialogOpen(true);
            }}
          >
            <span className="text-lg leading-none">+</span>
            Create Class
          </DashboardButton>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {overviewItems.map((item) => (
          <DashboardSurface
            key={item.label}
            variant="muted"
            radius="lg"
            padding="sm"
            className="space-y-2"
          >
            <p className={dashboardMetaTextClassName}>{item.label}</p>
            <p className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
              {item.value}
            </p>
            {item.helper ? (
              <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {item.helper}
              </p>
            ) : null}
          </DashboardSurface>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.25fr)]">
        <SectionCard
          title="Class List"
          actions={null}
          contentClassName="space-y-5"
        >
          {error ? (
            <EmptyStateBlock
              title="Unable to load classes"
              description={error}
              icon={BookOpen}
              className="border-dashed"
            />
          ) : null}

          <TeacherClassFilterBar
            searchValue={search}
            statusFilter={statusFilter}
            resultCount={filteredClasses.length}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
          />

          {isLoading && classes.length === 0 ? (
            <div className="space-y-3">
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : classes.length === 0 ? (
            <TeacherClassesListEmptyState />
          ) : filteredClasses.length === 0 ? (
            <TeacherClassesSearchEmptyState
              searchValue={search}
              statusFilter={statusFilter}
              onReset={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((teacherClass) => (
                <TeacherClassCard
                  key={teacherClass.id}
                  teacherClass={teacherClass}
                  isSelected={teacherClass.id === selectedClassId}
                  onViewDetails={() => setSelectedClassId(teacherClass.id)}
                  onEdit={() => setEditingClass(teacherClass)}
                  onToggleArchive={() => handleToggleArchive(teacherClass)}
                  onDelete={() => setClassPendingDelete(teacherClass)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <TeacherClassDetailsPanel
          teacherClass={selectedClass}
          hasClasses={classes.length > 0}
          membershipFeedback={membershipFeedback}
          assignmentInsights={assignmentInsightsState.data}
          onOpenAddStudents={
            isSelectedClassActive ? () => setIsAddStudentsDialogOpen(true) : undefined
          }
          onOpenAssignQuiz={
            isSelectedClassActive ? () => setIsAssignQuizDialogOpen(true) : undefined
          }
          onRemoveAssignedQuiz={isSelectedClassActive ? handleRemoveAssignedQuiz : undefined}
          onRemoveStudent={isSelectedClassActive ? handleRemoveStudentFromClass : undefined}
          onResendStudentInvite={isSelectedClassActive ? handleResendStudentInvite : undefined}
        />
      </div>

      <TeacherClassFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setCreateDialogError(null);
          }
        }}
        onSubmit={handleCreateClass}
        isSubmitting={isCreatingClass}
        submitError={createDialogError}
      />

      <TeacherClassFormDialog
        open={Boolean(editingClass)}
        mode="edit"
        initialValues={
          editingClass
            ? {
                name: editingClass.name,
                description: editingClass.description,
                subject: editingClass.subject,
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setEditingClass(null);
            setEditDialogError(null);
          }
        }}
        onSubmit={handleEditClass}
        isSubmitting={isSavingClass}
        submitError={editDialogError}
      />

      <AddStudentsDialog
        open={isAddStudentsDialogOpen}
        teacherClass={isSelectedClassActive ? selectedClass : null}
        onOpenChange={setIsAddStudentsDialogOpen}
        onSubmit={handleAddStudents}
      />

      <AssignQuizDialog
        open={isAssignQuizDialogOpen}
        teacherClass={isSelectedClassActive ? selectedClass : null}
        quizzes={assignableQuizzes}
        onOpenChange={setIsAssignQuizDialogOpen}
        onAssignQuiz={handleAssignQuiz}
      />

      <AlertDialog
        open={Boolean(classPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setClassPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              {classPendingDelete
                ? `Delete "${classPendingDelete.name}" permanently. This removes the class from the current frontend workspace and cannot be undone.`
                : "Delete this class permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--dashboard-danger)] text-white hover:bg-[var(--dashboard-danger)]/90"
              onClick={handleDeleteClass}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
