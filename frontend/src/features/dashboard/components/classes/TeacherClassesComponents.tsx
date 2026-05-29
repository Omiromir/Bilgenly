import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
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
import {
  AssignmentSettingsForm,
  AttemptsBadge,
  DeadlineBadge,
} from "../../../assignments/AssignmentControls";
import {
  DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  getAssignmentLevelStatus,
  validateAssignmentSettings,
  type AssignmentSettingsFormValues,
} from "../../../assignments/assignmentConstraints";
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
} from "./teacherClassesUtils";
import { normalizeEmail } from "../../../auth/validation";
import { searchStudents, type StudentSearchResult } from "../../api/classesApi";
import type { QuizLibraryItem } from "../quiz-library/quizLibraryTypes";
import {
  buildQuizJoinCode,
  formatQuizJoinCode,
} from "../../../quiz-session/quizJoinCode";
import { useAuth } from "../../../../app/providers/AuthProvider";

const teacherClassStatusToneMap = {
  active: "success",
  archived: "neutral",
} as const;

const emptyTeacherClassFormValues: TeacherClassFormValues = {
  name: "",
  description: "",
  subject: "",
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
    joinedCount > 0
      ? `${joinedCount} ${
          joinedCount === 1 ? "joined student" : "joined students"
        }`
      : null,
    pendingCount > 0
      ? `${pendingCount} ${
          pendingCount === 1 ? "pending class invite" : "pending class invites"
        }`
      : null,
    teacherClass.quizCount > 0
      ? `${teacherClass.quizCount} ${
          teacherClass.quizCount === 1 ? "quiz" : "quizzes"
        }`
      : null,
    `Code ${teacherClass.inviteCode}`,
    `Updated ${formatTeacherClassDate(teacherClass.updatedAt)}`,
  ].filter((item): item is string => Boolean(item));

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
  onSubmit: (values: TeacherClassFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function TeacherClassFormDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  submitError,
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!values.name.trim()) {
      setNameError("Class name is required.");
      return;
    }

    await onSubmit(values);
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
                  "h-14 rounded-[18px] border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)] px-5 text-base",
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

            {submitError ? (
              <div
                className="rounded-[18px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3"
                role="alert"
              >
                <p className="text-sm leading-6 text-[var(--dashboard-danger)]">
                  {submitError}
                </p>
              </div>
            ) : null}
          </DashboardModalBody>

          <DashboardModalFooter>
            <DashboardButton
              type="button"
              size="lg"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </DashboardButton>
            <DashboardButton type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating class..."
                  : "Saving changes..."
                : mode === "create"
                  ? "Create class"
                  : "Save changes"}
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
      description="Create your first class to start organizing students, class invites, and future assigned quizzes in one place."
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
            Resend class invite
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<StudentSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Existing student emails in the class (to prevent re-inviting)
  const existingEmails = useMemo(
    () =>
      new Set(
        (teacherClass?.students ?? [])
          .filter((s) => s.status !== "removed")
          .map((s) => normalizeEmail(s.email)),
      ),
    [teacherClass?.students],
  );

  // Reset on open/class change
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected([]);
    setErrorMessage(null);
    setIsSearching(false);
  }, [open, teacherClass?.id]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchStudents(query.trim());
        // Filter out already-selected and already-in-class students
        const selectedIds = new Set(selected.map((s) => s.id));
        setResults(
          data.filter(
            (u) => !selectedIds.has(u.id) && !existingEmails.has(normalizeEmail(u.email)),
          ),
        );
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected, existingEmails]);

  const handleSelect = (student: StudentSearchResult) => {
    setSelected((prev) => [...prev, student]);
    setResults((prev) => prev.filter((r) => r.id !== student.id));
    setQuery("");
    setErrorMessage(null);
  };

  const handleRemove = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selected.length === 0) {
      setErrorMessage("Select at least one student to invite.");
      return;
    }
    onSubmit(selected.map((s) => s.email));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardModalContent className="max-w-[820px]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DashboardModalHeader
            title="Add students"
            description={
              <>
                Search registered student accounts to invite to{" "}
                <strong>{teacherClass?.name ?? "this class"}</strong>. Only students with a Bilgenly account will appear.
              </>
            }
          />

          <DashboardModalBody className="space-y-4 min-h-[420px]">
            {availableClasses && availableClasses.length > 1 && onSelectedClassChange ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">Class</span>
                <select
                  value={teacherClass?.id ?? ""}
                  onChange={(e) => onSelectedClassChange(e.target.value)}
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
                  )}
                >
                  {availableClasses.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </label>
            ) : null}

            {/* Search input */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Search by name or email
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a name or email..."
                  className={cn(
                    dashboardInputVariants({ size: "md" }),
                    "w-full rounded-[14px] border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)] px-4",
                  )}
                  autoComplete="off"
                />
                {/* Results dropdown */}
                {query.trim().length >= 2 && (
                  <div className="no-scrollbar absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden overflow-y-auto rounded-[14px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)] shadow-lg max-h-[280px]">
                    {isSearching ? (
                      <div className="px-4 py-3 text-sm text-[var(--dashboard-text-muted)]">
                        Searching…
                      </div>
                    ) : results.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--dashboard-text-muted)]">
                        No students found.
                      </div>
                    ) : (
                      results.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelect(student)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--dashboard-surface-muted)] transition-colors"
                        >
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="text-xs">
                              {getTeacherStudentInitials(student.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--dashboard-text-strong)]">
                              {student.username}
                            </p>
                            <p className="truncate text-xs text-[var(--dashboard-text-muted)]">
                              {student.email}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selected students chips */}
            {selected.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                  Selected ({selected.length})
                </span>
                <div className="flex flex-col gap-2 rounded-[14px] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-muted)] px-3 py-3">
                  {selected.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getTeacherStudentInitials(student.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--dashboard-text-strong)]">
                          {student.username}
                        </p>
                        <p className="truncate text-xs text-[var(--dashboard-text-muted)]">
                          {student.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(student.id)}
                        className="shrink-0 text-[var(--dashboard-text-muted)] hover:text-[var(--dashboard-danger)] transition-colors text-lg leading-none"
                        aria-label={`Remove ${student.username}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-[14px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3">
                <p className="text-sm text-[var(--dashboard-danger)]">{errorMessage}</p>
              </div>
            )}
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
            <DashboardButton type="submit" size="lg" disabled={selected.length === 0}>
              Invite {selected.length > 0 ? `${selected.length} student${selected.length > 1 ? "s" : ""}` : "students"}
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
  assignmentInsights?: Record<
    string,
    {
      attemptedStudentsCount: number;
      exhaustedStudentsCount: number;
      missedDeadlineCount: number;
    }
  >;
  onOpenAddStudents?: () => void;
  onOpenAssignQuiz?: () => void;
  onRemoveAssignedQuiz?: (quiz: TeacherClassAssignedQuiz) => void;
  onRemoveStudent?: (student: TeacherClassStudent) => void;
  onResendStudentInvite?: (student: TeacherClassStudent) => void;
}

export function TeacherClassDetailsPanel({
  teacherClass,
  hasClasses,
  membershipFeedback,
  assignmentInsights = {},
  onOpenAddStudents,
  onOpenAssignQuiz,
  onRemoveAssignedQuiz,
  onRemoveStudent,
  onResendStudentInvite,
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
                <div className="flex items-center gap-2">
                  <TeacherStudentStatusBadge status={student.status} />
                  <InvitationStatusBadge status={student.invitationStatus} />
                  <p className="hidden text-sm text-[var(--dashboard-text-soft)] sm:block">
                    {formatTeacherClassDate(getTeacherClassStudentActivityDate(student))}
                  </p>
                  {(onRemoveStudent ?? onResendStudentInvite) ? (
                    <TeacherClassStudentActionsMenu
                      student={student}
                      onRemove={() => onRemoveStudent?.(student)}
                      onResendInvite={() => onResendStudentInvite?.(student)}
                    />
                  ) : null}
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
              Assign quiz
            </DashboardButton>
          ) : null}
        </div>

        {teacherClass.assignedQuizzes.length ? (
          <div className="space-y-3">
            {teacherClass.assignedQuizzes.map((quiz) => (
              <div
                key={`${teacherClass.id}-${quiz.assignmentId}`}
                className={cn(
                  dashboardInsetBlockClassName,
                  "space-y-4",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                  <div className="flex flex-wrap gap-2">
                    <DashboardBadge
                      tone={getAssignmentLevelStatus(quiz) === "expired" ? "danger" : "success"}
                    >
                      {getAssignmentLevelStatus(quiz)}
                    </DashboardBadge>
                    <DeadlineBadge
                      deadline={quiz.deadline}
                      expired={getAssignmentLevelStatus(quiz) === "expired"}
                    />
                    <AttemptsBadge maxAttempts={quiz.maxAttempts} />
                    <DashboardBadge tone="brand">
                      Join code{" "}
                      {formatQuizJoinCode(
                        buildQuizJoinCode({
                          assignmentId: quiz.assignmentId,
                          classId: teacherClass.id,
                          quizId: quiz.quizId,
                        }),
                      )}
                    </DashboardBadge>
                    <DashboardBadge tone="neutral">
                      {assignmentInsights[quiz.assignmentId]?.attemptedStudentsCount ?? 0} students opened the assigned quiz
                    </DashboardBadge>
                  </div>
                  <p className="mt-3 font-semibold text-[var(--dashboard-text-strong)]">
                    {quiz.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                    {quiz.topic} · {quiz.questionCount}{" "}
                    {quiz.questionCount === 1 ? "question" : "questions"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    Assigned quiz added {formatTeacherClassDate(quiz.assignedAt)}
                  </p>
                  <DashboardButton asChild type="button" size="sm" variant="secondary">
                    <Link
                      to={`/dashboard/teacher/analytics?classId=${teacherClass.id}&assignmentId=${quiz.assignmentId}`}
                    >
                      View Results
                    </Link>
                  </DashboardButton>
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
                <div className="flex flex-wrap gap-2">
                  <DashboardBadge tone="info">
                    {assignmentInsights[quiz.assignmentId]?.missedDeadlineCount ?? 0} missed deadline
                  </DashboardBadge>
                  {/* Hide "used all attempts" when attempts are unlimited (maxAttempts === null) */}
                  {quiz.maxAttempts != null && (
                    <DashboardBadge tone="warning">
                      {assignmentInsights[quiz.assignmentId]?.exhaustedStudentsCount ?? 0} used all attempts
                    </DashboardBadge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No assigned quizzes yet"
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
  onAssignQuiz: (
    quiz: QuizLibraryItem,
    settings: {
      deadline: string | null;
      maxAttempts: number | null;
      allowLateSubmissions: boolean;
    },
  ) => void;
}

export function AssignQuizDialog({
  open,
  teacherClass,
  quizzes,
  onOpenChange,
  onAssignQuiz,
}: AssignQuizDialogProps) {
  // Two-step wizard: "select" → "configure"
  const [step, setStep] = useState<"select" | "configure">("select");
  const [search, setSearch] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AssignmentSettingsFormValues>(
    DEFAULT_ASSIGNMENT_SETTINGS_VALUES,
  );
  const [deadlineError, setDeadlineError] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!open) {
      setStep("select");
      setSearch("");
      setSelectedQuizId(null);
      setSettings(DEFAULT_ASSIGNMENT_SETTINGS_VALUES);
      setDeadlineError("");
    }
  }, [open]);

  const assignedQuizIds = useMemo(
    () => new Set((teacherClass?.assignedQuizzes ?? []).map((quiz) => quiz.quizId)),
    [teacherClass],
  );

  const filteredQuizzes = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (!query) return true;
      return [quiz.title, quiz.topic, quiz.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [deferredSearch, quizzes]);

  const isArchivedClass = teacherClass?.status === "archived";
  const selectedQuiz =
    filteredQuizzes.find((quiz) => quiz.id === selectedQuizId) ??
    quizzes.find((quiz) => quiz.id === selectedQuizId) ??
    null;

  const handleNext = () => {
    if (selectedQuiz) {
      setStep("configure");
    }
  };

  const handleBack = () => {
    setStep("select");
    setDeadlineError("");
  };

  const handleAssign = () => {
    if (!selectedQuiz) return;
    const validation = validateAssignmentSettings(settings);
    if (validation.errors.deadline) {
      setDeadlineError(validation.errors.deadline);
      return;
    }
    onAssignQuiz(selectedQuiz, {
      deadline: validation.deadline,
      maxAttempts: validation.maxAttempts,
      allowLateSubmissions: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardModalContent className="max-w-[680px]">
        <div className="flex min-h-0 flex-1 flex-col">

          {/* ── Step indicator ── */}
          <div className="flex items-center gap-3 px-6 pt-8 pr-14 pb-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  step === "select"
                    ? "bg-[var(--dashboard-brand)] text-white"
                    : "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand)]",
                )}
              >
                {step === "configure" ? "✓" : "1"}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step === "select"
                    ? "text-[var(--dashboard-text-strong)]"
                    : "text-[var(--dashboard-text-soft)]",
                )}
              >
                Choose quiz
              </span>
            </div>
            <div className="h-px flex-1 bg-[var(--dashboard-border-soft)]" />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  step === "configure"
                    ? "bg-[var(--dashboard-brand)] text-white"
                    : "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-faint)]",
                )}
              >
                2
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step === "configure"
                    ? "text-[var(--dashboard-text-strong)]"
                    : "text-[var(--dashboard-text-faint)]",
                )}
              >
                Settings
              </span>
            </div>
          </div>

          {/* ── Step 1: Select quiz ── */}
          {step === "select" && (
            <>
              <DashboardModalHeader
                title="Choose a quiz"
                description={
                  teacherClass
                    ? `Select which quiz to assign to ${teacherClass.name}.`
                    : "Select a quiz to assign."
                }
              />
              <DashboardModalBody>
                <DashboardSearchField
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, topic, or description..."
                  inputClassName="h-12 rounded-[16px] border-[var(--dashboard-border)] bg-[var(--dashboard-surface-elevated)]"
                />

                {isArchivedClass ? (
                  <EmptyStateBlock
                    title="Archived classes are read-only"
                    description="Restore this class before assigning more quizzes."
                    icon={Layers3}
                    className="border-dashed"
                  />
                ) : filteredQuizzes.length ? (
                  <div className="no-scrollbar max-h-[380px] space-y-2 overflow-y-auto">
                    {filteredQuizzes.map((quiz) => {
                      const isAlreadyAssigned = assignedQuizIds.has(quiz.id);
                      const isSelected = selectedQuizId === quiz.id;
                      return (
                        <button
                          key={quiz.id}
                          type="button"
                          disabled={isAlreadyAssigned}
                          onClick={() => setSelectedQuizId(quiz.id)}
                          className={cn(
                            "w-full rounded-[18px] border bg-[var(--dashboard-surface-elevated)] px-5 py-4 text-left transition",
                            isAlreadyAssigned
                              ? "cursor-not-allowed opacity-50"
                              : "hover:shadow-[var(--dashboard-shadow-card)]",
                            isSelected
                              ? "border-[var(--dashboard-brand)] ring-1 ring-[var(--dashboard-brand)]"
                              : "border-[var(--dashboard-border-soft)] hover:border-[var(--dashboard-border)]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
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
                                  className="max-w-[200px] truncate px-3 py-1 text-xs font-semibold"
                                >
                                  {quiz.topic}
                                </DashboardBadge>
                              </div>
                              <p className="mt-3 text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                                {quiz.title}
                              </p>
                              <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                                {quiz.questionCount}{" "}
                                {quiz.questionCount === 1 ? "question" : "questions"} · {quiz.updatedAt}
                              </p>
                            </div>
                            {/* Selection indicator */}
                            <span
                              className={cn(
                                "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                                isSelected
                                  ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand)] text-white"
                                  : "border-[var(--dashboard-border)] bg-transparent text-transparent",
                              )}
                            >
                              ✓
                            </span>
                          </div>
                          {isAlreadyAssigned ? (
                            <p className="mt-2 text-xs text-[var(--dashboard-text-faint)]">
                              Already assigned to this class
                            </p>
                          ) : null}
                        </button>
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
                  Cancel
                </DashboardButton>
                {!isArchivedClass ? (
                  <DashboardButton
                    type="button"
                    size="sm"
                    disabled={!selectedQuiz}
                    onClick={handleNext}
                  >
                    Next →
                  </DashboardButton>
                ) : null}
              </DashboardModalFooter>
            </>
          )}

          {/* ── Step 2: Configure settings ── */}
          {step === "configure" && selectedQuiz && (
            <>
              <DashboardModalHeader
                title="Assignment settings"
                description="Set a deadline and attempt limit for this assignment."
              />
              <DashboardModalBody>
                {/* Selected quiz summary */}
                <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--dashboard-brand-soft)] bg-[var(--dashboard-brand-soft-alt)] px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <DashboardBadge tone="info" className="px-3 py-1 text-xs font-semibold">
                        {selectedQuiz.topic}
                      </DashboardBadge>
                    </div>
                    <p className="mt-2 text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                      {selectedQuiz.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--dashboard-text-soft)]">
                      {selectedQuiz.questionCount}{" "}
                      {selectedQuiz.questionCount === 1 ? "question" : "questions"}
                    </p>
                  </div>
                  <DashboardButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-xs"
                    onClick={handleBack}
                  >
                    Change
                  </DashboardButton>
                </div>

                {/* Settings form */}
                <AssignmentSettingsForm
                  values={settings}
                  deadlineError={deadlineError}
                  onChange={(nextValues) => {
                    setSettings(nextValues);
                    if (deadlineError) setDeadlineError("");
                  }}
                />
              </DashboardModalBody>

              <DashboardModalFooter>
                <DashboardButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleBack}
                >
                  ← Back
                </DashboardButton>
                <DashboardButton
                  type="button"
                  size="sm"
                  onClick={handleAssign}
                >
                  Assign quiz
                </DashboardButton>
              </DashboardModalFooter>
            </>
          )}

        </div>
      </DashboardModalContent>
    </Dialog>
  );
}
