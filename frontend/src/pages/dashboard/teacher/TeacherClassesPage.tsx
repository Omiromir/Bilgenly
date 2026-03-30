import { useDeferredValue, useEffect, useState } from "react";
import { Archive, BookOpen, Trash2, Users } from "lucide-react";
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
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import {
  AddStudentsDialog,
  TeacherClassCard,
  TeacherClassDetailsPanel,
  TeacherClassFilterBar,
  TeacherClassFormDialog,
  TeacherClassesListEmptyState,
  TeacherClassesSearchEmptyState,
} from "../../../features/dashboard/components/classes/TeacherClassesComponents";
import type {
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStatus,
  TeacherClassStudent,
} from "../../../features/dashboard/components/classes/teacherClassesTypes";
import { matchesTeacherClassSearch } from "../../../features/dashboard/components/classes/teacherClassesUtils";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

export function TeacherClassesPage() {
  const meta = useDashboardPageMeta();
  const {
    classes,
    createClass,
    updateClass,
    setClassStatus,
    addStudentsToClass,
    removeStudentFromClass,
    resendStudentInvite,
    removeQuizFromClass,
    deleteClass,
  } = useTeacherClasses();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddStudentsDialogOpen, setIsAddStudentsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeacherClassRecord | null>(null);
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

  const handleCreateClass = (values: TeacherClassFormValues) => {
    const nextClass = createClass(values);
    setSelectedClassId(nextClass.id);
    setIsCreateDialogOpen(false);
  };

  const handleEditClass = (values: TeacherClassFormValues) => {
    if (!editingClass) {
      return;
    }

    const updatedClass = updateClass(editingClass.id, values);

    if (updatedClass) {
      setSelectedClassId(updatedClass.id);
    }

    setEditingClass(null);
  };

  const handleToggleArchive = (teacherClass: TeacherClassRecord) => {
    setClassStatus(
      teacherClass.id,
      teacherClass.status === "active" ? "archived" : "active",
    );
  };

  const handleDeleteClass = () => {
    if (!classPendingDelete) {
      return;
    }

    deleteClass(classPendingDelete.id);
    setClassPendingDelete(null);
  };

  const handleAddStudents = (emails: string[]) => {
    if (!selectedClass) {
      return;
    }

    const addedStudents = addStudentsToClass(selectedClass.id, emails);

    if (!addedStudents.length) {
      return;
    }

    setMembershipFeedback(
      `${addedStudents.length} ${
        addedStudents.length === 1 ? "student was" : "students were"
      } invited to ${selectedClass.name}. Matching mock students can now see the invitation in Notifications.`,
    );
  };

  const handleRemoveStudent = (student: TeacherClassStudent) => {
    if (!selectedClass) {
      return;
    }

    removeStudentFromClass(selectedClass.id, student.id);
    setMembershipFeedback(`${student.fullName} was removed from ${selectedClass.name}.`);
  };

  const handleResendInvite = (student: TeacherClassStudent) => {
    if (!selectedClass) {
      return;
    }

    resendStudentInvite(selectedClass.id, student.id);
    setMembershipFeedback(
      `Invite resent to ${student.email}. The student notification was refreshed.`,
    );
  };

  const handleRemoveAssignedQuiz = (quiz: { quizId: string; title: string }) => {
    if (!selectedClass) {
      return;
    }

    removeQuizFromClass(selectedClass.id, quiz.quizId);
    setMembershipFeedback(`${quiz.title} was removed from ${selectedClass.name}.`);
  };

  const selectedClass =
    classes.find((item) => item.id === selectedClassId) ?? null;
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

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Classes"}
        subtitle="Create, organize, and manage your real class workspaces with room for students, quizzes, and classroom activity."
        actions={
          <DashboardButton
            type="button"
            size="lg"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <span className="text-lg leading-none">+</span>
            Create Class
          </DashboardButton>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Total Classes"
          value={String(classes.length)}
          change={classes.length ? "Live classroom spaces you manage" : ""}
          icon={Users}
          iconClassName="bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]"
        />
        <StatCard
          title="Active Classes"
          value={String(activeClassesCount)}
          change={activeClassesCount ? "Ready for current learning activity" : ""}
          icon={BookOpen}
          iconClassName="bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]"
        />
        <StatCard
          title="Archived Classes"
          value={String(archivedClassesCount)}
          change={totalStudentsCount ? `${totalStudentsCount} students across all classes` : ""}
          icon={Archive}
          iconClassName="bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <SectionCard
          title="Your Classes"
          description="Manage class setup, quickly find existing groups, and keep one reliable source of truth for classroom organization."
          actions={null}
          contentClassName="space-y-5"
        >
          <TeacherClassFilterBar
            searchValue={search}
            statusFilter={statusFilter}
            resultCount={filteredClasses.length}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
          />

          {classes.length === 0 ? (
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
            <div className="grid gap-5 md:grid-cols-2">
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
          onOpenAddStudents={() => setIsAddStudentsDialogOpen(true)}
          onRemoveStudent={handleRemoveStudent}
          onResendInvite={handleResendInvite}
          onRemoveAssignedQuiz={handleRemoveAssignedQuiz}
        />
      </div>

      <TeacherClassFormDialog
        open={isCreateDialogOpen}
        mode="create"
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateClass}
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
          }
        }}
        onSubmit={handleEditClass}
      />

      <AddStudentsDialog
        open={isAddStudentsDialogOpen}
        teacherClass={selectedClass}
        onOpenChange={setIsAddStudentsDialogOpen}
        onSubmit={handleAddStudents}
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
