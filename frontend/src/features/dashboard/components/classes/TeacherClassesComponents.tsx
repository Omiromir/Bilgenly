import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Archive,
  BookOpen,
  FolderArchive,
  Layers3,
  Mail,
  MoreVertical,
  PencilLine,
  Rocket,
  SearchX,
  Trash2,
  Users,
} from "../../../../components/icons/AppIcons";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
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
} from "../../../../components/ui/dialog";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardModalBody,
  DashboardModalContent,
  DashboardModalFooter,
  DashboardModalHeader,
} from "../DashboardModal";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardButtonVariants,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardInvertedInsetBlockClassName,
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
  getTeacherClassStudentActivityDate,
  parseTeacherStudentEmails,
} from "./teacherClassesUtils";
import { normalizeEmail, validateEmail } from "../../../auth/validation";
import type { QuizLibraryItem } from "../quiz-library/quizLibraryTypes";

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

function getTeacherStudentInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
        <DropdownMenuItem
          onClick={onEdit}
          disabled={teacherClass.status === "archived"}
        >
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
  const joinedCount = teacherClass.students.filter(
    (student) => student.status === "joined",
  ).length;
  const pendingCount = teacherClass.students.filter(
    (student) =>
      student.status === "invited" && student.invitationStatus === "pending",
  ).length;
  const summaryRows = [
    `${joinedCount} ${
      joinedCount === 1 ? "joined student" : "joined students"
    }`,
    `${pendingCount} ${
      pendingCount === 1 ? "pending invite" : "pending invites"
    }`,
    `${teacherClass.quizCount} ${
      teacherClass.quizCount === 1 ? "quiz" : "quizzes"
    }`,
    `Code ${teacherClass.inviteCode}`,
    `Updated ${formatTeacherClassDate(teacherClass.updatedAt)}`,
  ];

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "cursor-pointer border transition",
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
      <article className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              <TeacherClassStatusBadge status={teacherClass.status} />
              {teacherClass.subject ? (
                <DashboardBadge tone="info">{teacherClass.subject}</DashboardBadge>
              ) : null}
            </div>

            <div className="space-y-2">
              <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
                {teacherClass.name}
              </h3>
              <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
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

        <div className="flex flex-wrap gap-2">
          {summaryRows.map((item) => (
            <DashboardBadge
              key={`${teacherClass.id}-${item}`}
              tone="neutral"
              size="md"
            >
              {item}
            </DashboardBadge>
          ))}
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
      <DashboardModalContent className="max-w-[720px]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DashboardModalHeader
            title={mode === "create" ? "Create class" : "Edit class"}
            description={
              mode === "create"
                ? "Create a real class workspace for students, quizzes, and upcoming activity."
                : "Update the core class details teachers and students rely on."
            }
          />

          <DashboardModalBody className="space-y-6">
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
                className={cn(
                  dashboardInputVariants({ size: "md" }),
                  "h-14 rounded-[18px] border-[var(--dashboard-border)] bg-white px-5 text-base",
                )}
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
                className={cn(
                  dashboardInputVariants({ size: "md" }),
                  "h-14 rounded-[18px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 text-base",
                )}
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
                className={cn(
                  dashboardTextareaVariants({ size: "md" }),
                  "min-h-[200px] rounded-[22px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-5 text-base leading-8",
                )}
                placeholder="Add context for students, learning goals, or how you plan to use this class."
              />
            </label>
          </DashboardModalBody>

          <DashboardModalFooter>
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
          </DashboardModalFooter>
        </form>
      </DashboardModalContent>
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
    status === "joined"
      ? "success"
      : status === "declined"
        ? "danger"
        : status === "removed"
          ? "neutral"
        : "warning";
  const label =
    status === "joined"
      ? "Joined"
      : status === "declined"
        ? "Declined"
        : status === "removed"
          ? "Removed"
          : "Invited";

  return (
    <DashboardBadge tone={tone}>{label}</DashboardBadge>
  );
}

interface InvitationStatusBadgeProps {
  status: TeacherClassStudent["invitationStatus"];
}

export function InvitationStatusBadge({
  status,
}: InvitationStatusBadgeProps) {
  const tone =
    status === "accepted"
      ? "success"
      : status === "declined"
        ? "danger"
        : status === "removed"
          ? "neutral"
          : "warning";
  const label =
    status === "accepted"
      ? "Accepted"
      : status === "declined"
        ? "Declined"
        : status === "removed"
          ? "Removed"
          : "Pending";

  return <DashboardBadge tone={tone}>{label}</DashboardBadge>;
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
        {student.status !== "joined" ? (
          <DropdownMenuItem onClick={onResendInvite}>
            <Mail className="h-4 w-4" />
            Resend invite
          </DropdownMenuItem>
        ) : null}
        {student.status !== "joined" ? <DropdownMenuSeparator /> : null}
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
  availableClasses?: TeacherClassRecord[];
  onSelectedClassChange?: (classId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (emails: string[]) => void;
}

export function AddStudentsDialog({
  open,
  teacherClass,
  availableClasses,
  onSelectedClassChange,
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
      (teacherClass?.students ?? [])
        .filter((student) => student.status !== "removed")
        .map((student) => normalizeEmail(student.email)),
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
      <DashboardModalContent className="max-w-[720px]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DashboardModalHeader
            title="Add students"
            description={
              <>
                Invite one or more students to {teacherClass?.name ?? "this class"}.
                {" "}Paste emails separated by commas, spaces, or new lines.
              </>
            }
          />

          <DashboardModalBody className="space-y-5">
            {availableClasses && availableClasses.length > 1 && onSelectedClassChange ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                  Class
                </span>
                <select
                  value={teacherClass?.id ?? ""}
                  onChange={(event) => onSelectedClassChange(event.target.value)}
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
                  )}
                >
                  {availableClasses.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

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
                className={cn(
                  dashboardTextareaVariants({ size: "md" }),
                  "min-h-[198px] rounded-[22px] border-[var(--dashboard-border)] bg-white px-5 py-5 text-base leading-8",
                )}
                placeholder={"student.one@example.com\nstudent.two@example.com"}
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <DashboardBadge
                tone="info"
                size="md"
                className="rounded-full px-4 py-2 font-semibold"
              >
                {parsedCount} {parsedCount === 1 ? "email" : "emails"} detected
              </DashboardBadge>
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
          </DashboardModalBody>

          <DashboardModalFooter>
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
          </DashboardModalFooter>
        </form>
      </DashboardModalContent>
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
  onOpenAddStudents?: () => void;
  onOpenAssignQuiz?: () => void;
  onRemoveAssignedQuiz?: (quiz: TeacherClassAssignedQuiz) => void;
}

export function TeacherClassDetailsPanel({
  teacherClass,
  hasClasses,
  membershipFeedback,
  onOpenAddStudents,
  onOpenAssignQuiz,
  onRemoveAssignedQuiz,
}: TeacherClassDetailsPanelProps) {
  if (!teacherClass) {
    return hasClasses ? (
      <EmptyStateBlock
        title="Select a class"
        icon={Users}
        className="h-full"
      />
    ) : (
      <EmptyStateBlock
        title="Your class workspace will appear here"
        icon={Layers3}
        className="h-full"
      />
    );
  }

  const quickStats = [
    {
      label: "Invite code",
      value: teacherClass.inviteCode,
      emphasizeWideTracking: true,
    },
    {
      label: "Joined",
      value: String(
        teacherClass.students.filter((student) => student.status === "joined").length,
      ),
    },
    {
      label: "Pending invites",
      value: String(
        teacherClass.students.filter(
          (student) =>
            student.status === "invited" && student.invitationStatus === "pending",
        ).length,
      ),
    },
    {
      label: "Last updated",
      value: formatTeacherClassDate(teacherClass.updatedAt),
    },
  ];
  const studentPreview = teacherClass.students.slice(0, 4);

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-6">
      <div className="space-y-4">
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
            {teacherClass.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {teacherClass.description}
              </p>
            ) : null}
          </div>
        </div>

        {membershipFeedback ? (
          <div className="rounded-[18px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/50 px-4 py-3">
            <p className="text-sm leading-6 text-[var(--dashboard-success)]">
              {membershipFeedback}
            </p>
          </div>
        ) : null}

        {teacherClass.status === "archived" ? (
          <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-3">
            <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
              This class is archived. Any actions are disabled until you restore it.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {quickStats.map((item) => (
          <div key={`${teacherClass.id}-${item.label}`} className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>{item.label}</p>
            <p
              className={cn(
                "mt-2 text-lg font-semibold text-[var(--dashboard-text-strong)]",
                item.emphasizeWideTracking ? "tracking-[0.18em]" : undefined,
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
              Student Snapshot
            </h3>
          </div>
          {onOpenAddStudents ? (
            <DashboardButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={onOpenAddStudents}
            >
              <Mail className="h-4 w-4" />
              Add Students
            </DashboardButton>
          ) : null}
        </div>

        {studentPreview.length ? (
          <div className="space-y-3">
            {studentPreview.map((student) => (
              <div
                key={student.id}
                className={cn(
                  dashboardInsetBlockClassName,
                  "flex items-center justify-between gap-4",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-brand-soft-alt)]">
                    <AvatarFallback className="bg-[var(--dashboard-brand-soft-alt)] text-sm font-semibold text-[var(--dashboard-brand)]">
                      {getTeacherStudentInitials(student.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--dashboard-text-strong)]">
                      {student.fullName}
                    </p>
                    <p className="truncate text-sm text-[var(--dashboard-text-soft)]">
                      {student.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TeacherStudentStatusBadge status={student.status} />
                  <InvitationStatusBadge status={student.invitationStatus} />
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    {formatTeacherClassDate(getTeacherClassStudentActivityDate(student))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No students in this class yet"
            icon={Users}
            className="border-dashed"
          />
        )}

        {teacherClass.students.length > studentPreview.length ? (
          <p className="text-sm text-[var(--dashboard-text-soft)]">
            {teacherClass.students.length - studentPreview.length} more{" "}
            {teacherClass.students.length - studentPreview.length === 1
              ? "student is"
              : "students are"}{" "}
            available on the full Students page.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
              Assigned Quizzes
            </h3>
          </div>
          {onOpenAssignQuiz ? (
            <DashboardButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={onOpenAssignQuiz}
            >
              <Rocket className="h-4 w-4" />
              Assign Quiz
            </DashboardButton>
          ) : null}
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
                  {onRemoveAssignedQuiz ? (
                    <DashboardButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveAssignedQuiz(quiz)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </DashboardButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No quizzes assigned yet"
            icon={BookOpen}
            className="border-dashed"
          />
        )}
      </div>

    </DashboardSurface>
  );
}

interface AssignQuizDialogProps {
  open: boolean;
  teacherClass: TeacherClassRecord | null;
  quizzes: QuizLibraryItem[];
  onOpenChange: (open: boolean) => void;
  onAssignQuiz: (quiz: QuizLibraryItem) => void;
}

export function AssignQuizDialog({
  open,
  teacherClass,
  quizzes,
  onOpenChange,
  onAssignQuiz,
}: AssignQuizDialogProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const assignedQuizIds = useMemo(
    () => new Set((teacherClass?.assignedQuizzes ?? []).map((quiz) => quiz.quizId)),
    [teacherClass],
  );

  const filteredQuizzes = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      if (!query) {
        return true;
      }

      return [quiz.title, quiz.topic, quiz.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [deferredSearch, quizzes]);
  const isArchivedClass = teacherClass?.status === "archived";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardModalContent className="max-w-[720px]">
        <div className="flex min-h-0 flex-1 flex-col">
        <DashboardModalHeader
          title="Assign quiz"
          description={
            teacherClass
              ? `Choose a quiz for ${teacherClass.name}.`
              : "Choose a quiz for this class."
          }
        />

        <DashboardModalBody>
          <DashboardSearchField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quizzes by title, topic, or description..."
            inputClassName="h-12 rounded-[16px] border-[var(--dashboard-border)] bg-white"
          />

          {isArchivedClass ? (
            <EmptyStateBlock
              title="Archived classes are read-only"
              description="Restore this class before assigning more quizzes."
              icon={Layers3}
              className="border-dashed"
            />
          ) : filteredQuizzes.length ? (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {filteredQuizzes.map((quiz) => {
                const isAlreadyAssigned = assignedQuizIds.has(quiz.id);

                return (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white px-5 py-4 transition hover:border-[var(--dashboard-border)] hover:shadow-[0_10px_30px_rgba(18,32,58,0.06)]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <DashboardBadge
                          tone="neutral"
                          className="px-3 py-1 text-xs font-semibold capitalize"
                        >
                          {quiz.status.replace("-", " ")}
                        </DashboardBadge>
                        <DashboardBadge
                          tone="info"
                          className="max-w-[220px] truncate px-3 py-1 text-xs font-semibold"
                        >
                          {quiz.topic}
                        </DashboardBadge>
                      </div>
                      <p className="mt-3 text-[1.1rem] font-semibold text-[var(--dashboard-text-strong)]">
                        {quiz.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                        {quiz.questionCount}{" "}
                        {quiz.questionCount === 1 ? "question" : "questions"} ·{" "}
                        {quiz.updatedAt}
                      </p>
                    </div>

                    <DashboardButton
                      type="button"
                      size="sm"
                      variant={isAlreadyAssigned ? "ghost" : "secondary"}
                      className="min-w-[96px] rounded-[16px] px-5"
                      disabled={isAlreadyAssigned}
                      onClick={() => onAssignQuiz(quiz)}
                    >
                      {isAlreadyAssigned ? "Assigned" : "Assign"}
                    </DashboardButton>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyStateBlock
              title="No quizzes available"
              description={
                quizzes.length
                  ? "No quizzes match the current search."
                  : "Create or publish a quiz first, then assign it from here."
              }
              icon={BookOpen}
              className="border-dashed"
            />
          )}
        </DashboardModalBody>

        <DashboardModalFooter>
          <DashboardButton
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </DashboardButton>
        </DashboardModalFooter>
        </div>
      </DashboardModalContent>
    </Dialog>
  );
}
