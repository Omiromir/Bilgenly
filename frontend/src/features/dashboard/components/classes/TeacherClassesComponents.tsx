import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Archive,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Mail,
  FolderArchive,
  Layers3,
  MoreVertical,
  PencilLine,
  SearchX,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "../../../../components/ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardButtonVariants,
  dashboardIconTextRowClassName,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardMetaTextClassName,
  dashboardSelectVariants,
  dashboardTextareaVariants,
} from "../DashboardPrimitives";
import type {
  AddStudentsFormValues,
  TeacherClassAssignedQuiz,
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStatus,
  TeacherClassStudent,
  TeacherClassStudentStatus,
} from "./teacherClassesTypes";
import {
  formatTeacherClassDate,
  parseTeacherStudentEmails,
} from "./teacherClassesUtils";
import { normalizeEmail, validateEmail } from "../../../auth/validation";
import { mockStudentUsers } from "../../mock/mockUsers";

const teacherClassStatusToneMap = {
  active: "success",
  archived: "neutral",
} as const;

const emptyTeacherClassFormValues: TeacherClassFormValues = {
  name: "",
  description: "",
  subject: "",
};

const emptyAddStudentsFormValues: AddStudentsFormValues = {
  emails: "",
};

interface TeacherClassStatusBadgeProps {
  status: TeacherClassStatus;
}

export function TeacherClassStatusBadge({
  status,
}: TeacherClassStatusBadgeProps) {
  return (
    <DashboardBadge
      tone={teacherClassStatusToneMap[status]}
      className="capitalize"
    >
      {status}
    </DashboardBadge>
  );
}

interface TeacherClassActionsMenuProps {
  teacherClass: TeacherClassRecord;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

export function TeacherClassActionsMenu({
  teacherClass,
  onEdit,
  onToggleArchive,
  onDelete,
}: TeacherClassActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(dashboardButtonVariants({ variant: "ghost", size: "iconSm" }))}
        aria-label={`Open actions for ${teacherClass.name}`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onClick={onEdit}>
          <PencilLine className="h-4 w-4" />
          Edit class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleArchive}>
          {teacherClass.status === "active" ? (
            <>
              <Archive className="h-4 w-4" />
              Archive class
            </>
          ) : (
            <>
              <FolderArchive className="h-4 w-4" />
              Restore class
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TeacherClassCardProps extends TeacherClassActionsMenuProps {
  onViewDetails: () => void;
  isSelected?: boolean;
}

export function TeacherClassCard({
  teacherClass,
  isSelected = false,
  onViewDetails,
  onEdit,
  onToggleArchive,
  onDelete,
}: TeacherClassCardProps) {
  const summaryRows = [
    {
      icon: Users,
      label: `${teacherClass.studentCount} ${
        teacherClass.studentCount === 1 ? "student" : "students"
      }`,
    },
    {
      icon: BookOpen,
      label: `${teacherClass.quizCount} ${
        teacherClass.quizCount === 1 ? "quiz" : "quizzes"
      }`,
    },
    {
      icon: CalendarDays,
      label: `Created ${formatTeacherClassDate(teacherClass.createdAt)}`,
    },
    {
      icon: Layers3,
      label: `Code ${teacherClass.inviteCode}`,
    },
  ];

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "h-full cursor-pointer border transition",
        isSelected &&
          "border-[var(--dashboard-brand)] shadow-[0_18px_40px_rgba(43,122,243,0.12)]",
      )}
      role="button"
      tabIndex={0}
      onClick={onViewDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewDetails();
        }
      }}
    >
      <article className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <TeacherClassStatusBadge status={teacherClass.status} />
              {teacherClass.subject ? (
                <DashboardBadge tone="info">{teacherClass.subject}</DashboardBadge>
              ) : null}
            </div>

            <div>
              <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
                {teacherClass.name}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {teacherClass.description ||
                  "No class description yet. Add one to explain the purpose, group, or learning focus."}
              </p>
            </div>
          </div>

          <TeacherClassActionsMenu
            teacherClass={teacherClass}
            onEdit={onEdit}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
          />
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {summaryRows.map((row) => {
            const Icon = row.icon;

            return (
              <div key={`${teacherClass.id}-${row.label}`} className={dashboardIconTextRowClassName}>
                <Icon className="h-4 w-4" />
                <span>{row.label}</span>
              </div>
            );
          })}
        </div>
      </article>
    </DashboardSurface>
  );
}

interface TeacherClassFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TeacherClassFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeacherClassFormValues) => void;
}

export function TeacherClassFormDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
}: TeacherClassFormDialogProps) {
  const [values, setValues] = useState<TeacherClassFormValues>(
    initialValues ?? emptyTeacherClassFormValues,
  );
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(initialValues ?? emptyTeacherClassFormValues);
    setNameError("");
  }, [initialValues, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.name.trim()) {
      setNameError("Class name is required.");
      return;
    }

    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] border-[var(--dashboard-border-soft)] p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-6 py-5">
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
                {mode === "create" ? "Create class" : "Edit class"}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {mode === "create"
                  ? "Create a real class workspace for students, quizzes, and upcoming activity."
                  : "Update the core class details teachers and students rely on."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Class name
              </span>
              <input
                value={values.name}
                onChange={(event) => {
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                  if (nameError) {
                    setNameError("");
                  }
                }}
                className={dashboardInputVariants({ size: "md" })}
                placeholder="Grade 10 Biology - Section A"
                aria-invalid={Boolean(nameError)}
              />
              {nameError ? (
                <p className="text-sm text-[var(--dashboard-danger)]">{nameError}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Subject or topic
              </span>
              <input
                value={values.subject}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                className={dashboardInputVariants({ size: "md" })}
                placeholder="Biology"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Description
              </span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={dashboardTextareaVariants({ size: "md" })}
                placeholder="Add context for students, learning goals, or how you plan to use this class."
              />
            </label>
          </div>

          <DialogFooter className="border-t border-[var(--dashboard-border-soft)] px-6 py-5 sm:justify-end">
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton type="submit" size="lg">
              {mode === "create" ? "Create class" : "Save changes"}
            </DashboardButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeacherClassesListEmptyState() {
  return (
    <EmptyStateBlock
      title="No classes yet"
      description="Create your first class to start organizing students, class codes, and future quiz assignments in one place."
      icon={Users}
      className="border-dashed"
    />
  );
}

interface TeacherClassesSearchEmptyStateProps {
  searchValue: string;
  statusFilter: "all" | TeacherClassStatus;
  onReset: () => void;
}

export function TeacherClassesSearchEmptyState({
  searchValue,
  statusFilter,
  onReset,
}: TeacherClassesSearchEmptyStateProps) {
  return (
    <EmptyStateBlock
      title="No classes match your filters"
      description={`No classes matched ${
        searchValue.trim() ? `"${searchValue.trim()}"` : "the current search"
      }${statusFilter === "all" ? "" : ` in ${statusFilter} classes`}.`}
      icon={SearchX}
      action={
        <DashboardButton type="button" variant="secondary" size="lg" onClick={onReset}>
          Clear filters
        </DashboardButton>
      }
      className="border-dashed"
    />
  );
}

interface TeacherStudentStatusBadgeProps {
  status: TeacherClassStudentStatus;
}

export function TeacherStudentStatusBadge({
  status,
}: TeacherStudentStatusBadgeProps) {
  const tone =
    status === "active"
      ? "success"
      : status === "declined"
        ? "danger"
        : "warning";
  const label =
    status === "active"
      ? "Active"
      : status === "declined"
        ? "Declined"
        : "Invited";

  return (
    <DashboardBadge tone={tone}>{label}</DashboardBadge>
  );
}

interface TeacherClassStudentActionsMenuProps {
  student: TeacherClassStudent;
  onRemove: () => void;
  onResendInvite: () => void;
}

export function TeacherClassStudentActionsMenu({
  student,
  onRemove,
  onResendInvite,
}: TeacherClassStudentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(dashboardButtonVariants({ variant: "ghost", size: "iconSm" }))}
        aria-label={`Open actions for ${student.fullName}`}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {student.status !== "active" ? (
          <DropdownMenuItem onClick={onResendInvite}>
            <Mail className="h-4 w-4" />
            Resend invite
          </DropdownMenuItem>
        ) : null}
        {student.status !== "active" ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onClick={onRemove} variant="destructive">
          <Trash2 className="h-4 w-4" />
          Remove student
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AddStudentsDialogProps {
  open: boolean;
  teacherClass: TeacherClassRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (emails: string[]) => void;
}

export function AddStudentsDialog({
  open,
  teacherClass,
  onOpenChange,
  onSubmit,
}: AddStudentsDialogProps) {
  const [values, setValues] = useState<AddStudentsFormValues>(
    emptyAddStudentsFormValues,
  );
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(emptyAddStudentsFormValues);
    setErrorMessages([]);
  }, [open, teacherClass?.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedEmails = parseTeacherStudentEmails(values.emails);
    const existingEmails = new Set(
      (teacherClass?.students ?? []).map((student) => normalizeEmail(student.email)),
    );
    const seenEmails = new Set<string>();
    const invalidEmails: string[] = [];
    const duplicateEmails: string[] = [];
    const alreadyAddedEmails: string[] = [];
    const validEmails: string[] = [];

    parsedEmails.forEach((email) => {
      if (validateEmail(email)) {
        invalidEmails.push(email);
        return;
      }

      if (seenEmails.has(email)) {
        duplicateEmails.push(email);
        return;
      }

      seenEmails.add(email);

      if (existingEmails.has(email)) {
        alreadyAddedEmails.push(email);
        return;
      }

      validEmails.push(email);
    });

    const nextErrors: string[] = [];

    if (!parsedEmails.length) {
      nextErrors.push("Add at least one student email to continue.");
    }
    if (invalidEmails.length) {
      nextErrors.push(`Invalid email: ${invalidEmails.join(", ")}.`);
    }
    if (duplicateEmails.length) {
      nextErrors.push(
        `Duplicate emails in this submission: ${Array.from(new Set(duplicateEmails)).join(", ")}.`,
      );
    }
    if (alreadyAddedEmails.length) {
      nextErrors.push(
        `Already in this class: ${alreadyAddedEmails.join(", ")}.`,
      );
    }

    if (nextErrors.length) {
      setErrorMessages(nextErrors);
      return;
    }

    onSubmit(validEmails);
    onOpenChange(false);
  };

  const parsedCount = parseTeacherStudentEmails(values.emails).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[28px] border-[var(--dashboard-border-soft)] p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-6 py-5">
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
                Add students
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                Invite one or more students to {teacherClass?.name ?? "this class"}.
                Paste emails separated by commas, spaces, or new lines.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Student emails
              </span>
              <textarea
                value={values.emails}
                onChange={(event) => {
                  setValues({ emails: event.target.value });
                  if (errorMessages.length) {
                    setErrorMessages([]);
                  }
                }}
                className={dashboardTextareaVariants({ size: "md" })}
                placeholder={"student.one@example.com\nstudent.two@example.com"}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <DashboardBadge tone="info" size="md">
                {parsedCount} {parsedCount === 1 ? "email" : "emails"} detected
              </DashboardBadge>
            </div>

            <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                Mock student emails for testing
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                Invite one of these mock students to see the notification appear in the
                student dashboard.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mockStudentUsers.map((student) => (
                  <DashboardBadge key={student.id} tone="neutral" size="md">
                    {student.email}
                  </DashboardBadge>
                ))}
              </div>
            </div>

            {errorMessages.length ? (
              <div className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3">
                {errorMessages.map((message) => (
                  <p
                    key={message}
                    className="text-sm leading-6 text-[var(--dashboard-danger)]"
                  >
                    {message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-[var(--dashboard-border-soft)] px-6 py-5 sm:justify-end">
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </DashboardButton>
            <DashboardButton type="submit" size="lg">
              Add students
            </DashboardButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TeacherClassFilterBarProps {
  searchValue: string;
  statusFilter: "all" | TeacherClassStatus;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | TeacherClassStatus) => void;
}

export function TeacherClassFilterBar({
  searchValue,
  statusFilter,
  resultCount,
  onSearchChange,
  onStatusFilterChange,
}: TeacherClassFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <DashboardSearchField
          containerClassName="flex-1"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search classes, subjects, descriptions, or invite codes..."
        />

        <label className="sm:w-[180px]">
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as "all" | TeacherClassStatus)
            }
            className={cn(
              dashboardSelectVariants({ size: "md" }),
              "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
            )}
            aria-label="Filter classes by status"
          >
            <option value="all">All classes</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <DashboardBadge tone="info" size="md">
        {resultCount} {resultCount === 1 ? "class" : "classes"}
      </DashboardBadge>
    </div>
  );
}

interface TeacherClassDetailsPanelProps {
  teacherClass: TeacherClassRecord | null;
  hasClasses: boolean;
  membershipFeedback?: string | null;
  onOpenAddStudents: () => void;
  onRemoveStudent: (student: TeacherClassStudent) => void;
  onResendInvite: (student: TeacherClassStudent) => void;
  onRemoveAssignedQuiz: (quiz: TeacherClassAssignedQuiz) => void;
}

export function TeacherClassDetailsPanel({
  teacherClass,
  hasClasses,
  membershipFeedback,
  onOpenAddStudents,
  onRemoveStudent,
  onResendInvite,
  onRemoveAssignedQuiz,
}: TeacherClassDetailsPanelProps) {
  if (!teacherClass) {
    return hasClasses ? (
      <EmptyStateBlock
        title="Select a class"
        description="Choose a class from the list to view its details, manage core settings, and prepare the next teaching steps."
        icon={Users}
        className="h-full"
      />
    ) : (
      <EmptyStateBlock
        title="Your class workspace will appear here"
        description="Once you create a class, this panel becomes the home for members, assigned quizzes, and classroom activity."
        icon={Layers3}
        className="h-full"
      />
    );
  }

  const activityItems = [
    {
      label: "Created",
      value: formatTeacherClassDate(teacherClass.createdAt),
    },
    {
      label: "Last updated",
      value: formatTeacherClassDate(teacherClass.updatedAt),
    },
    {
      label: "Status",
      value:
        teacherClass.status === "active"
          ? "Active and ready for learning activity."
          : "Archived and hidden from active classroom workflows.",
    },
  ];

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <TeacherClassStatusBadge status={teacherClass.status} />
            {teacherClass.subject ? (
              <DashboardBadge tone="info">{teacherClass.subject}</DashboardBadge>
            ) : null}
          </div>

          <div>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[var(--dashboard-text-strong)]">
              {teacherClass.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {teacherClass.description ||
                "No description added yet. Use this area to clarify how this class will be used."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Invite code</p>
          <p className="mt-2 text-lg font-semibold tracking-[0.2em] text-[var(--dashboard-text-strong)]">
            {teacherClass.inviteCode}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Created date</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {formatTeacherClassDate(teacherClass.createdAt)}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Students</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {teacherClass.studentCount}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Assigned quizzes</p>
          <p className="mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]">
            {teacherClass.quizCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
              Students
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              View members, invite more students, and prepare the class for upcoming quiz work.
            </p>
          </div>

          <DashboardButton
            type="button"
            size="lg"
            variant="secondary"
            onClick={onOpenAddStudents}
          >
            <Mail className="h-4 w-4" />
            Add Students
          </DashboardButton>
        </div>

        {membershipFeedback ? (
          <div className="rounded-[18px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/50 px-4 py-3">
            <p className="text-sm leading-6 text-[var(--dashboard-success)]">
              {membershipFeedback}
            </p>
          </div>
        ) : null}

        {teacherClass.students.length ? (
          <div className="space-y-3">
            {teacherClass.students.map((student) => (
              <div
                key={student.id}
                className={cn(
                  dashboardInsetBlockClassName,
                  "flex items-center justify-between gap-4",
                )}
              >
                <div>
                  <p className="font-semibold text-[var(--dashboard-text-strong)]">
                    {student.fullName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                    {student.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TeacherStudentStatusBadge status={student.status} />
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    {student.status === "active"
                      ? "Joined"
                      : student.status === "declined"
                        ? "Declined"
                        : "Invited"}{" "}
                    {formatTeacherClassDate(student.joinedAt)}
                  </p>
                  <TeacherClassStudentActionsMenu
                    student={student}
                    onRemove={() => onRemoveStudent(student)}
                    onResendInvite={() => onResendInvite(student)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No students in this class yet"
            description="This class is ready, but no students have joined yet. Use Add Students to invite members and start building the roster."
            icon={Users}
            className="border-dashed"
          />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
            Assigned Quizzes
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            Quiz assignments connected from the library will appear here for this class.
          </p>
        </div>

        {teacherClass.assignedQuizzes.length ? (
          <div className="space-y-3">
            {teacherClass.assignedQuizzes.map((quiz) => (
              <div
                key={`${teacherClass.id}-${quiz.quizId}`}
                className={cn(
                  dashboardInsetBlockClassName,
                  "flex items-center justify-between gap-4",
                )}
              >
                <div>
                  <p className="font-semibold text-[var(--dashboard-text-strong)]">
                    {quiz.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                    {quiz.topic} · {quiz.questionCount}{" "}
                    {quiz.questionCount === 1 ? "question" : "questions"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    Assigned {formatTeacherClassDate(quiz.assignedAt)}
                  </p>
                  <DashboardButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveAssignedQuiz(quiz)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </DashboardButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No quizzes assigned yet"
            description="Assign a quiz from the Quiz Library to connect this class with real learning activity."
            icon={BookOpen}
            className="border-dashed"
          />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
            Activity
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            Important class events live here so teachers can understand the current state at a glance.
          </p>
        </div>

        <div className="space-y-3">
          {activityItems.map((item) => (
            <div
              key={`${teacherClass.id}-${item.label}`}
              className={cn(
                dashboardInsetBlockClassName,
                "flex items-start justify-between gap-4",
              )}
            >
              <p className="font-medium text-[var(--dashboard-text-strong)]">
                {item.label}
              </p>
              <p className="max-w-[240px] text-right text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardSurface>
  );
}
