import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Download,
  Mail,
  MoreHorizontal,
  SearchX,
  UserPlus,
  Users,
} from "../../../components/icons/AppIcons";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import {
  DashboardButton,
  dashboardPageClassName,
  dashboardSelectVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyStateBlock } from "../../../features/dashboard/components/EmptyStateBlock";
import {
  AddStudentsDialog,
  InvitationStatusBadge,
  TeacherStudentStatusBadge,
} from "../../../features/dashboard/components/classes/TeacherClassesComponents";
import type {
  TeacherClassRecord,
  TeacherClassStudent,
  TeacherClassStudentStatus,
} from "../../../features/dashboard/components/classes/teacherClassesTypes";
import {
  formatTeacherClassDate,
  getTeacherClassStudentActivityDate,
} from "../../../features/dashboard/components/classes/teacherClassesUtils";

interface TeacherStudentRosterRow {
  rowId: string;
  classId: string;
  className: string;
  classSubject: string;
  inviteCode: string;
  quizCount: number;
  student: TeacherClassStudent;
  derivedId: number;
  gender: "Male" | "Female";
  age: number;
  averageGrade: number;
  missingDays: number;
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function escapeCsvValue(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function deriveStudentMetrics(
  teacherClass: TeacherClassRecord,
  student: TeacherClassStudent,
) {
  const seed = hashString(`${teacherClass.id}-${student.id}-${student.email}`);

  return {
    derivedId: 100 + (seed % 900),
    gender: seed % 2 === 0 ? "Male" : "Female",
    age: 6 + (seed % 13),
    averageGrade: Number((5 + ((seed >> 3) % 51) / 10).toFixed(1)),
    missingDays: (seed >> 5) % 21,
  } satisfies Pick<
    TeacherStudentRosterRow,
    "derivedId" | "gender" | "age" | "averageGrade" | "missingDays"
  >;
}

export function TeacherStudentsPage() {
  const {
    classes,
    addStudentsToClass,
    removeStudentFromClass,
    resendStudentInvite,
  } = useTeacherClasses();
  const activeClasses = useMemo(
    () => classes.filter((teacherClass) => teacherClass.status === "active"),
    [classes],
  );
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] =
    useState<"all" | TeacherClassStudentStatus>("all");
  const [ageFilter, setAgeFilter] = useState<"all" | "6-10" | "11-14" | "15-18">(
    "all",
  );
  const [gradeFilter, setGradeFilter] =
    useState<"all" | "high" | "mid" | "needs-attention">("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAddStudentsDialogOpen, setIsAddStudentsDialogOpen] = useState(false);
  const [addTargetClassId, setAddTargetClassId] = useState<string>("");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const deferredClassFilter = useDeferredValue(classFilter);

  const rosterRows = useMemo<TeacherStudentRosterRow[]>(
    () =>
      classes.flatMap((teacherClass) =>
        teacherClass.students.map((student) => {
          const derived = deriveStudentMetrics(teacherClass, student);

          return {
            rowId: `${teacherClass.id}-${student.id}`,
            classId: teacherClass.id,
            className: teacherClass.name,
            classSubject: teacherClass.subject,
            inviteCode: teacherClass.inviteCode,
            quizCount: teacherClass.quizCount,
            student,
            ...derived,
          };
        }),
      ),
    [classes],
  );

  const filteredRows = useMemo(() => {
    return rosterRows.filter((row) => {
      const matchesClass =
        deferredClassFilter === "all" ? true : row.classId === deferredClassFilter;
      const matchesStatus =
        statusFilter === "all" ? true : row.student.status === statusFilter;
      const matchesAge =
        ageFilter === "all"
          ? true
          : ageFilter === "6-10"
            ? row.age >= 6 && row.age <= 10
            : ageFilter === "11-14"
              ? row.age >= 11 && row.age <= 14
              : row.age >= 15 && row.age <= 18;
      const matchesGrade =
        gradeFilter === "all"
          ? true
          : gradeFilter === "high"
            ? row.averageGrade >= 8.5
            : gradeFilter === "mid"
              ? row.averageGrade >= 7 && row.averageGrade < 8.5
              : row.averageGrade < 7;

      return matchesClass && matchesStatus && matchesAge && matchesGrade;
    });
  }, [ageFilter, deferredClassFilter, gradeFilter, rosterRows, statusFilter]);

  const totalStudentsLabel = new Set(
    rosterRows.map((row) => row.student.email.trim().toLowerCase()),
  ).size;

  const addTargetClass =
    activeClasses.find((teacherClass) => teacherClass.id === addTargetClassId) ?? null;

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedRowIds.includes(row.rowId));

  const openAddStudentsDialog = () => {
    const fallbackClassId =
      classFilter !== "all" &&
      activeClasses.some((teacherClass) => teacherClass.id === classFilter)
        ? classFilter
        : activeClasses[0]?.id ??
          "";

    if (!fallbackClassId) {
      return;
    }

    setAddTargetClassId(fallbackClassId);
    setIsAddStudentsDialogOpen(true);
  };

  const handleAddStudents = (emails: string[]) => {
    if (!addTargetClass) {
      return;
    }

    const addedStudents = addStudentsToClass(addTargetClass.id, emails);

    if (!addedStudents.length) {
      return;
    }

    setFeedback(
      `${addedStudents.length} ${
        addedStudents.length === 1 ? "student was" : "students were"
      } invited to ${addTargetClass.name}.`,
    );
  };

  const handleRemoveStudent = (row: TeacherStudentRosterRow) => {
    removeStudentFromClass(row.classId, row.student.id);
    setSelectedRowIds((current) => current.filter((item) => item !== row.rowId));
    setFeedback(`${row.student.fullName} was removed from ${row.className}.`);
  };

  const handleResendInvite = (row: TeacherStudentRosterRow) => {
    resendStudentInvite(row.classId, row.student.id);
    setFeedback(`Invite resent to ${row.student.email}.`);
  };

  const handleExportCsv = () => {
    if (!filteredRows.length) {
      return;
    }

    const csv = [
      [
        "ID",
        "Student",
        "Email",
        "Gender",
        "Age",
        "Class",
        "Subject",
        "Avg Grade",
        "Missing Days",
        "Status",
        "Joined",
      ].join(","),
      ...filteredRows.map((row) =>
        [
          escapeCsvValue(row.derivedId),
          escapeCsvValue(row.student.fullName),
          escapeCsvValue(row.student.email),
          escapeCsvValue(row.gender),
          escapeCsvValue(row.age),
          escapeCsvValue(row.className),
          escapeCsvValue(row.classSubject || "General"),
          escapeCsvValue(row.averageGrade),
          escapeCsvValue(row.missingDays),
          escapeCsvValue(row.student.status),
          escapeCsvValue(
            formatTeacherClassDate(getTeacherClassStudentActivityDate(row.student)),
          ),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "teacher-students.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const emptyState = !classes.length ? (
    <EmptyStateBlock
      title="Create a class before managing students"
      description="Once classes exist, this page becomes your dedicated roster workspace."
      icon={Users}
      action={
        <DashboardButton asChild size="lg">
          <Link to="/dashboard/teacher/classes">Go to classes</Link>
        </DashboardButton>
      }
      className="border-dashed"
    />
  ) : rosterRows.length === 0 ? (
    <EmptyStateBlock
      title="No students yet"
      description="Your classes are ready, but nobody has been invited or joined yet."
      icon={UserPlus}
      action={
        <DashboardButton
          type="button"
          size="lg"
          onClick={openAddStudentsDialog}
          disabled={!activeClasses.length}
        >
          <Mail className="h-4 w-4" />
          Add student
        </DashboardButton>
      }
      className="border-dashed"
    />
  ) : (
    <EmptyStateBlock
      title="No students match these filters"
      description="Try resetting the quick filters to bring the roster back."
      icon={SearchX}
      action={
        <DashboardButton
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => {
            setClassFilter("all");
            setStatusFilter("all");
            setAgeFilter("all");
            setGradeFilter("all");
          }}
        >
          Clear filters
        </DashboardButton>
      }
      className="border-dashed"
    />
  );

  return (
    <div className={dashboardPageClassName}>
      <section className="rounded-[28px] border border-[var(--dashboard-border-soft)] bg-[rgba(255,255,255,0.95)] px-5 py-5 shadow-[var(--dashboard-shadow-card)] sm:px-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--dashboard-text-strong)]">
                Students
              </h1>
              <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                Total: {totalStudentsLabel.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <DashboardButton
                type="button"
                size="lg"
                variant="secondary"
                onClick={handleExportCsv}
                disabled={!filteredRows.length}
                className="h-11 rounded-[14px] px-4 text-sm"
              >
                <Download className="h-4 w-4" />
                Export data
              </DashboardButton>
              <DashboardButton
                type="button"
                size="lg"
                onClick={openAddStudentsDialog}
                disabled={!activeClasses.length}
                className="h-11 rounded-[14px] px-4 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Add student
              </DashboardButton>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-2">
              <label>
                <select
                  value={classFilter}
                  onChange={(event) => setClassFilter(event.target.value)}
                  className={`${dashboardSelectVariants({ size: "md" })} h-10 min-w-[120px] rounded-[12px] border-[var(--dashboard-border-soft)] bg-white px-3 text-sm`}
                  aria-label="Filter students by class"
                >
                  <option value="all">Classes</option>
                  {classes.map((teacherClass) => (
                    <option key={teacherClass.id} value={teacherClass.id}>
                      {teacherClass.name}
                      {teacherClass.status === "archived" ? " (Archived)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <select
                  value={ageFilter}
                  onChange={(event) =>
                    setAgeFilter(
                      event.target.value as "all" | "6-10" | "11-14" | "15-18",
                    )
                  }
                  className={`${dashboardSelectVariants({ size: "md" })} h-10 min-w-[90px] rounded-[12px] border-[var(--dashboard-border-soft)] bg-white px-3 text-sm`}
                  aria-label="Filter students by age"
                >
                  <option value="all">Age</option>
                  <option value="6-10">6-10</option>
                  <option value="11-14">11-14</option>
                  <option value="15-18">15-18</option>
                </select>
              </label>

              <label>
                <select
                  value={gradeFilter}
                  onChange={(event) =>
                    setGradeFilter(
                      event.target.value as "all" | "high" | "mid" | "needs-attention",
                    )
                  }
                  className={`${dashboardSelectVariants({ size: "md" })} h-10 min-w-[130px] rounded-[12px] border-[var(--dashboard-border-soft)] bg-white px-3 text-sm`}
                  aria-label="Filter students by average grade"
                >
                  <option value="all">Avg. grade</option>
                  <option value="high">8.5 and up</option>
                  <option value="mid">7.0 to 8.4</option>
                  <option value="needs-attention">Below 7.0</option>
                </select>
              </label>

              <label>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | TeacherClassStudentStatus,
                    )
                  }
                  className={`${dashboardSelectVariants({ size: "md" })} h-10 min-w-[120px] rounded-[12px] border-[var(--dashboard-border-soft)] bg-white px-3 text-sm`}
                  aria-label="Filter students by status"
                >
                  <option value="all">All filters</option>
                  <option value="joined">Joined</option>
                  <option value="invited">Invited</option>
                  <option value="declined">Declined</option>
                </select>
              </label>
            </div>

            <div className="text-sm text-[var(--dashboard-text-soft)]">
              {filteredRows.length} of {rosterRows.length} rows
            </div>
          </div>

          {feedback ? (
            <div className="rounded-[16px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/60 px-4 py-3 text-sm text-[var(--dashboard-success)]">
              {feedback}
            </div>
          ) : null}

          {!filteredRows.length ? (
            emptyState
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-[var(--dashboard-border-soft)] bg-white">
              <Table className="min-w-[1100px]">
                <TableHeader className="bg-[var(--dashboard-surface-muted)]">
                  <TableRow className="border-[var(--dashboard-border-soft)] hover:bg-[var(--dashboard-surface-muted)]">
                    <TableHead className="h-12 w-[48px] px-4">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRowIds(filteredRows.map((row) => row.rowId));
                            return;
                          }

                          setSelectedRowIds([]);
                        }}
                        aria-label="Select all students"
                      />
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      ID
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Student
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Gender
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Age
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Class
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Avg. grade
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Missing days
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Member
                    </TableHead>
                    <TableHead className="h-12 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Invite
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRows.map((row, index) => {
                    const isSelected = selectedRowIds.includes(row.rowId);
                    const isArchivedClass = classes.some(
                      (teacherClass) =>
                        teacherClass.id === row.classId &&
                        teacherClass.status === "archived",
                    );

                    return (
                      <TableRow
                        key={row.rowId}
                        data-state={isSelected ? "selected" : undefined}
                        className="border-[var(--dashboard-border-soft)] bg-white hover:bg-[var(--dashboard-surface-muted)]/70"
                      >
                        <TableCell className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedRowIds((current) =>
                                checked
                                  ? [...new Set([...current, row.rowId])]
                                  : current.filter((item) => item !== row.rowId),
                              );
                            }}
                            aria-label={`Select ${row.student.fullName}`}
                          />
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm font-medium text-[var(--dashboard-text-soft)]">
                          {row.derivedId}
                        </TableCell>

                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-brand-soft-alt)]">
                              <AvatarFallback className="bg-[var(--dashboard-brand-soft-alt)] text-xs font-semibold text-[var(--dashboard-brand)]">
                                {getInitials(row.student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--dashboard-text-strong)]">
                                {row.student.fullName}
                              </p>
                              <p className="truncate text-xs text-[var(--dashboard-text-soft)]">
                                {row.student.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm text-[var(--dashboard-text-soft)]">
                          {row.gender}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm text-[var(--dashboard-text-soft)]">
                          {row.age}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm text-[var(--dashboard-text-soft)]">
                          {row.className}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm font-semibold text-[var(--dashboard-text-strong)]">
                          {row.averageGrade}
                        </TableCell>

                        <TableCell className="px-3 py-3 text-sm text-[var(--dashboard-text-soft)]">
                          {row.missingDays}
                        </TableCell>

                        <TableCell className="px-3 py-3">
                          <TeacherStudentStatusBadge status={row.student.status} />
                        </TableCell>

                        <TableCell className="px-3 py-3">
                          <InvitationStatusBadge status={row.student.invitationStatus} />
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleResendInvite(row)}
                              disabled={isArchivedClass || row.student.status === "joined"}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dashboard-border-soft)] text-[var(--dashboard-text-soft)] transition hover:bg-[var(--dashboard-surface-muted)] hover:text-[var(--dashboard-text-strong)]"
                              aria-label={`Email ${row.student.fullName}`}
                            >
                              <Mail className="h-4 w-4" />
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dashboard-border-soft)] text-[var(--dashboard-text-soft)] transition hover:bg-[var(--dashboard-surface-muted)] hover:text-[var(--dashboard-text-strong)]"
                                aria-label={`Open actions for ${row.student.fullName}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() => handleResendInvite(row)}
                                  disabled={isArchivedClass || row.student.status === "joined"}
                                >
                                  <Mail className="h-4 w-4" />
                                  Resend invite
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleRemoveStudent(row)}
                                  variant="destructive"
                                  disabled={isArchivedClass}
                                >
                                  <Users className="h-4 w-4" />
                                  Remove student
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredRows.length ? (
            <div className="flex flex-col gap-3 text-sm text-[var(--dashboard-text-soft)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                1 to {filteredRows.length} of {rosterRows.length}
              </p>
              <p>
                Page 1 of 1
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <AddStudentsDialog
        open={isAddStudentsDialogOpen}
        teacherClass={addTargetClass}
        availableClasses={activeClasses}
        onSelectedClassChange={setAddTargetClassId}
        onOpenChange={setIsAddStudentsDialogOpen}
        onSubmit={handleAddStudents}
      />
    </div>
  );
}
