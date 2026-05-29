import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Users,
} from "../../../components/icons/AppIcons";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { cn } from "../../../components/ui/utils";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardPageClassName,
  dashboardSelectVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { EmptyStateBlock } from "../../../features/dashboard/components/EmptyStateBlock";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import {
  ActionMenu,
  ClassQuizAnalyticsCard,
  InterventionPanel,
  QuestionAnalyticsPanel,
  QuizSummaryPanel,
  ScoreDistributionPanel,
  StudentQuizInsightsPanel,
  StudentQuizResultRow,
} from "../../../features/dashboard/components/teacher-analytics/TeacherQuizAnalyticsComponents";
import {
  DEFAULT_INTERVENTION_THRESHOLD,
  type TeacherStudentQuizResultRowData,
} from "../../../features/dashboard/components/teacher-analytics/teacherQuizAnalyticsUtils";
import { LoadingCard } from "../../../features/dashboard/components/LoadingCard";
import { useAssignmentAnalytics } from "../../../features/dashboard/hooks/useDashboardAnalytics";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";
import { formatCurrentShortDate } from "../../../features/dashboard/settings/settingsPreferences";
import { grantExtraAttempt } from "../../../features/dashboard/api/classesApi";

function escapeCsvValue(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// ─── Action cooldown helpers ──────────────────────────────────────────────────
//
// Prevents teachers from hammering the same follow-up action repeatedly.
// State is persisted in localStorage so a page refresh doesn't reset it.
//
// Cooldown windows (intentionally different per action severity):
//   • Notification nudges  — 10 min per student × assignment × kind
//   • Grant extra attempt  —  3 min per assignment (mutates DB for all students)

const COOLDOWN_MS: Record<string, number> = {
  needs_review: 10 * 60_000,
  follow_up_practice: 10 * 60_000,
  grant_attempt: 3 * 60_000,
};

const COOLDOWN_STORAGE_PREFIX = "bilgenly:teacher:cooldown:";

function buildCooldownKey(
  kind: string,
  assignmentId: string,
  studentId?: string,
): string {
  return studentId
    ? `${COOLDOWN_STORAGE_PREFIX}${kind}:${assignmentId}:${studentId}`
    : `${COOLDOWN_STORAGE_PREFIX}${kind}:${assignmentId}`;
}

/** Returns milliseconds remaining on a cooldown, or 0 if the action is allowed. */
function getCooldownRemaining(key: string, cooldownMs: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const elapsed = Date.now() - parseInt(raw, 10);
    return Math.max(0, cooldownMs - elapsed);
  } catch {
    return 0;
  }
}

function stampCooldown(key: string): void {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // localStorage unavailable — just allow the action
  }
}

function formatCooldownRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} min`;
}

function matchesScoreRange(
  row: TeacherStudentQuizResultRowData,
  scoreRange: string,
) {
  if (scoreRange === "all") {
    return true;
  }

  if (scoreRange === "missing") {
    return row.latestScore === null;
  }

  if (row.latestScore === null) {
    return false;
  }

  if (scoreRange === "85-100") {
    return row.latestScore >= 85;
  }

  if (scoreRange === "70-84") {
    return row.latestScore >= 70 && row.latestScore <= 84;
  }

  return row.latestScore < 70;
}

function getFollowUpToastCopy(
  followUpKind: "needs_review" | "reassign_quiz" | "follow_up_practice",
  studentName: string,
  wasCreated: boolean,
) {
  if (wasCreated) {
    switch (followUpKind) {
      case "reassign_quiz":
        return `Sent ${studentName} a nudge to retake the quiz.`;
      case "follow_up_practice":
        return `Sent ${studentName} a practice suggestion.`;
      case "needs_review":
      default:
        return `Sent ${studentName} a review reminder.`;
    }
  }

  switch (followUpKind) {
    case "reassign_quiz":
      return `${studentName} has retake nudges disabled — no notification was sent.`;
    case "follow_up_practice":
      return `${studentName} has practice suggestions disabled — no notification was sent.`;
    case "needs_review":
    default:
      return `${studentName} has review reminders disabled — no notification was sent.`;
  }
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full bg-[var(--dashboard-surface-muted)]" />
        <div className="h-8 w-8 rounded-xl bg-[var(--dashboard-surface-muted)]" />
      </div>
      <div className="h-9 w-20 rounded-lg bg-[var(--dashboard-surface-muted)]" />
      <div className="h-3 w-40 rounded-full bg-[var(--dashboard-surface-muted)]" />
    </div>
  );
}

function TableBodySkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr
          key={i}
          className="animate-pulse border-b border-[var(--dashboard-border-soft)]"
        >
          <td className="px-4 py-3.5">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded-full bg-[var(--dashboard-surface-muted)]" />
              <div className="h-3 w-36 rounded-full bg-[var(--dashboard-surface-muted)] opacity-60" />
            </div>
          </td>
          <td className="px-3 py-3.5">
            <div className="h-5 w-16 rounded-full bg-[var(--dashboard-surface-muted)]" />
          </td>
          <td className="px-3 py-3.5">
            <div className="h-3.5 w-12 rounded-full bg-[var(--dashboard-surface-muted)]" />
          </td>
          <td className="px-3 py-3.5">
            <div className="h-3.5 w-10 rounded-full bg-[var(--dashboard-surface-muted)]" />
          </td>
          <td className="px-3 py-3.5">
            <div className="h-3.5 w-20 rounded-full bg-[var(--dashboard-surface-muted)]" />
          </td>
          <td className="px-3 py-3.5">
            <div className="h-3.5 w-16 rounded-full bg-[var(--dashboard-surface-muted)]" />
          </td>
          <td className="px-4 py-3.5 text-right">
            <div className="ml-auto h-7 w-7 rounded-lg bg-[var(--dashboard-surface-muted)]" />
          </td>
        </tr>
      ))}
    </>
  );
}

function AnalyticsContentSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-4"
          >
            <div className="h-3 w-16 rounded-full bg-[var(--dashboard-surface-muted)]" />
            <div className="h-6 w-10 rounded-lg bg-[var(--dashboard-surface-muted)]" />
          </div>
        ))}
      </div>
      <div className="h-40 rounded-xl bg-[var(--dashboard-surface-muted)]" />
      <div className="space-y-2.5">
        {[70, 55, 40].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-[var(--dashboard-surface-muted)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function InsightsPanelSkeleton() {
  return (
    <div className="animate-pulse space-y-5 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] p-5">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded-full bg-[var(--dashboard-surface-muted)]" />
        <div className="h-3 w-48 rounded-full bg-[var(--dashboard-surface-muted)]" />
      </div>
      <div className="h-20 rounded-xl bg-[var(--dashboard-surface-muted)]" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-[var(--dashboard-surface-muted)]" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function TeacherAnalyticsPage() {
  const meta = useDashboardPageMeta();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { classes, error: classesError, isLoading: isClassesLoading } = useTeacherClasses();
  const { sendQuizFollowUpNotification } = useNotifications();
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "in_progress" | "expired" | "attempts_exhausted"
  >("all");
  const [scoreRange, setScoreRange] = useState<
    "all" | "85-100" | "70-84" | "below-70" | "missing"
  >("all");
  const [analyticsView, setAnalyticsView] = useState<
    "summary" | "questions" | "distribution" | "interventions"
  >("summary");
  const [selectedStudentRowId, setSelectedStudentRowId] = useState<string | null>(null);

  const classOptions = useMemo(
    () =>
      classes.filter((teacherClass) => teacherClass.assignedQuizzes.length > 0),
    [classes],
  );
  const requestedClassId = searchParams.get("classId");
  const requestedAssignmentId = searchParams.get("assignmentId");
  const selectedClass =
    classOptions.find((teacherClass) => teacherClass.id === requestedClassId) ??
    classOptions[0] ??
    null;
  const selectedAssignment =
    selectedClass?.assignedQuizzes.find(
      (assignment) => assignment.assignmentId === requestedAssignmentId,
    ) ??
    selectedClass?.assignedQuizzes[0] ??
    null;
  const assignmentAnalyticsState = useAssignmentAnalytics(
    selectedClass,
    selectedAssignment,
    DEFAULT_INTERVENTION_THRESHOLD,
  );

  useEffect(() => {
    if (!selectedClass || !selectedAssignment) {
      return;
    }

    if (
      requestedClassId === selectedClass.id &&
      requestedAssignmentId === selectedAssignment.assignmentId
    ) {
      return;
    }

    setSearchParams({
      classId: selectedClass.id,
      assignmentId: selectedAssignment.assignmentId,
    });
  }, [
    requestedAssignmentId,
    requestedClassId,
    selectedAssignment,
    selectedClass,
    setSearchParams,
  ]);

  const analytics = assignmentAnalyticsState.data;

  // Track which assignment's data is currently rendered so we can detect when
  // the selection has moved ahead of the loaded data.
  //
  // IMPORTANT: selectedAssignment?.assignmentId is intentionally NOT in the
  // deps array. If it were included, the effect would fire the moment the user
  // switches selection — at that instant isLoading is still false and data is
  // still the old payload, so the ref would jump to the new ID before loading
  // even starts, making isSwitchingAnalytics always evaluate to false.
  // We only want the ref to advance when a fetch actually completes.
  const loadedAssignmentIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (assignmentAnalyticsState.data && !assignmentAnalyticsState.isLoading) {
      // At this point selectedAssignment?.assignmentId is the assignment whose
      // data just arrived — correct to record as "loaded".
      loadedAssignmentIdRef.current = selectedAssignment?.assignmentId ?? null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentAnalyticsState.data, assignmentAnalyticsState.isLoading]);

  const isSwitchingAnalytics =
    assignmentAnalyticsState.isLoading &&
    loadedAssignmentIdRef.current !== (selectedAssignment?.assignmentId ?? null);

  const filteredRows = useMemo(() => {
    if (!analytics) {
      return [];
    }

    const query = studentSearch.trim().toLowerCase();

    return analytics.rows.filter((row) => {
      const matchesSearch = !query
        ? true
        : [row.student.fullName, row.student.email].join(" ").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      return matchesSearch && matchesStatus && matchesScoreRange(row, scoreRange);
    });
  }, [analytics, scoreRange, statusFilter, studentSearch]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedStudentRowId(null);
      return;
    }

    if (selectedStudentRowId && filteredRows.some((row) => row.rowId === selectedStudentRowId)) {
      return;
    }

    setSelectedStudentRowId(filteredRows[0].rowId);
  }, [filteredRows, selectedStudentRowId]);

  const selectedRow =
    analytics?.rows.find((row) => row.rowId === selectedStudentRowId) ?? null;

  const handleClassChange = (classId: string) => {
    const nextClass = classOptions.find((teacherClass) => teacherClass.id === classId);

    if (!nextClass?.assignedQuizzes.length) {
      return;
    }

    setSearchParams({
      classId: nextClass.id,
      assignmentId: nextClass.assignedQuizzes[0].assignmentId,
    });
  };

  const handleAssignmentChange = (assignmentId: string) => {
    if (!selectedClass) {
      return;
    }

    setSearchParams({
      classId: selectedClass.id,
      assignmentId,
    });
  };

  const handleTeacherFollowUp = (
    row: TeacherStudentQuizResultRowData,
    followUpKind: "needs_review" | "reassign_quiz" | "follow_up_practice",
  ) => {
    if (!selectedClass || !selectedAssignment || !currentUser) {
      return;
    }

    const cooldownKey = buildCooldownKey(
      followUpKind,
      selectedAssignment.assignmentId,
      row.student.id,
    );
    const remaining = getCooldownRemaining(cooldownKey, COOLDOWN_MS[followUpKind] ?? 600_000);
    if (remaining > 0) {
      toast(`${row.student.fullName} was already nudged recently. Try again in ${formatCooldownRemaining(remaining)}.`);
      return;
    }

    const recipientUserId = row.student.linkedUserId ?? row.student.id;
    if (!recipientUserId) {
      toast.error("This student is missing a linked account, so no in-app notification was created.");
      return;
    }

    const notification = sendQuizFollowUpNotification({
      recipientUserId,
      recipientEmail: row.student.email,
      relatedClassId: selectedClass.id,
      relatedClassName: selectedClass.name,
      senderName: currentUser.fullName,
      senderEmail: currentUser.email,
      studentId: row.student.id,
      studentName: row.student.fullName,
      studentEmail: row.student.email,
      quizId: selectedAssignment.quizId,
      quizTitle: selectedAssignment.title,
      assignmentId: selectedAssignment.assignmentId,
      attemptId: row.latestAttemptId ?? undefined,
      followUpKind,
    });

    const toastMessage = getFollowUpToastCopy(
      followUpKind,
      row.student.fullName,
      Boolean(notification),
    );

    if (notification) {
      stampCooldown(cooldownKey);
      toast.success(toastMessage);
      return;
    }

    // Even when the student has notifications disabled we still stamp the
    // cooldown — the teacher has "acted" and we shouldn't let them try again
    // immediately in case the student re-enables notifications.
    stampCooldown(cooldownKey);
    toast(toastMessage);
  };

  // Grants one extra attempt on the assignment (increments MaxAttempts by 1
  // server-side so the student can actually start a new attempt), then also
  // sends them an in-app notification so they know the door is open again.
  const handleGrantAttempt = async (row: TeacherStudentQuizResultRowData) => {
    if (!selectedClass || !selectedAssignment || !currentUser) {
      return;
    }

    // Cooldown is per-assignment (not per-student) because this action changes
    // the DB cap for ALL students — rapid re-clicks would increment it multiple
    // times unintentionally.
    const cooldownKey = buildCooldownKey("grant_attempt", selectedAssignment.assignmentId);
    const remaining = getCooldownRemaining(cooldownKey, COOLDOWN_MS.grant_attempt);
    if (remaining > 0) {
      toast(`Extra attempt was granted recently for this quiz. You can grant another in ${formatCooldownRemaining(remaining)}.`);
      return;
    }

    try {
      const result = await grantExtraAttempt(
        selectedClass.id,
        selectedAssignment.assignmentId,
      );

      const recipientUserId = row.student.linkedUserId ?? row.student.id;
      if (recipientUserId) {
        sendQuizFollowUpNotification({
          recipientUserId,
          recipientEmail: row.student.email,
          relatedClassId: selectedClass.id,
          relatedClassName: selectedClass.name,
          senderName: currentUser.fullName,
          senderEmail: currentUser.email,
          studentId: row.student.id,
          studentName: row.student.fullName,
          studentEmail: row.student.email,
          quizId: selectedAssignment.quizId,
          quizTitle: selectedAssignment.title,
          assignmentId: selectedAssignment.assignmentId,
          attemptId: row.latestAttemptId ?? undefined,
          followUpKind: "reassign_quiz",
        });
      }

      stampCooldown(cooldownKey);

      if (result.unlimited) {
        toast.success(`Attempts are already unlimited for "${selectedAssignment.title}" — ${row.student.fullName} can retake anytime.`);
      } else {
        toast.success(
          `Granted one extra attempt for "${selectedAssignment.title}". New cap: ${result.maxAttempts} attempts. ${row.student.fullName} has been notified.`,
        );
      }
    } catch {
      toast.error("Could not grant the extra attempt. Please try again.");
    }
  };

  const handleExportCsv = () => {
    if (!analytics || !selectedClass || !selectedAssignment || !filteredRows.length) {
      return;
    }

    const csv = [
      [
        "Class",
        "Quiz",
        "Student",
        "Email",
        "Status",
        "Attempts Used",
        "Latest Score",
        "Best Score",
        "Average Score",
        "Correct",
        "Incorrect",
        "Completion Timestamp",
        "Missed Deadline",
        "Weak Topics",
        "Flags",
      ].join(","),
      ...filteredRows.map((row) =>
        [
          escapeCsvValue(selectedClass.name),
          escapeCsvValue(selectedAssignment.title),
          escapeCsvValue(row.student.fullName),
          escapeCsvValue(row.student.email),
          escapeCsvValue(row.status),
          escapeCsvValue(row.attemptsUsed),
          escapeCsvValue(row.latestScore ?? "--"),
          escapeCsvValue(row.bestScore ?? "--"),
          escapeCsvValue(row.averageScore ?? "--"),
          escapeCsvValue(row.correctCount),
          escapeCsvValue(row.incorrectCount),
          escapeCsvValue(row.completionTimestamp ?? "--"),
          escapeCsvValue(row.missedDeadline ? "Yes" : "No"),
          escapeCsvValue(row.weakTopics.join(" | ") || "--"),
          escapeCsvValue(row.flags.join(" | ") || "--"),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `bilgenly-${selectedClass.name}-${selectedAssignment.title}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isClassesLoading && !classes.length) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "Analytics"}
          subtitle="Track assigned-quiz results, class-level progress, and follow-up needs in one place."
        />

        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (classesError) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "Analytics"}
          subtitle="Track assigned-quiz results, class-level progress, and follow-up needs in one place."
        />

        <EmptyStateBlock
          title="Unable to load analytics workspace"
          description={classesError}
          icon={Users}
          className="border-dashed"
        />
      </div>
    );
  }

  if (!classOptions.length || !selectedClass || !selectedAssignment) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "Analytics"}
          subtitle="Track assigned-quiz results, class-level progress, and follow-up needs in one place."
        />

        <EmptyStateBlock
          title="Assign a quiz before reviewing results"
          description="Once a class has at least one assigned quiz, this dashboard will switch from setup to post-quiz analytics automatically."
          icon={Users}
          className="border-dashed"
        />
      </div>
    );
  }

  if (assignmentAnalyticsState.isLoading && !analytics) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "Analytics"}
          subtitle="Review assigned quiz outcomes, move from class trends into individual answers, and send follow-up actions without leaving the dashboard."
        />

        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (assignmentAnalyticsState.error || !analytics) {
    return (
      <div className={dashboardPageClassName}>
        <DashboardPageHeader
          title={meta?.title ?? "Analytics"}
          subtitle="Review assigned quiz outcomes, move from class trends into individual answers, and send follow-up actions without leaving the dashboard."
        />

        <EmptyStateBlock
          title="Unable to load assignment analytics"
          description={
            assignmentAnalyticsState.error ??
            "The selected assignment analytics are unavailable right now."
          }
          icon={Users}
          className="border-dashed"
        />
      </div>
    );
  }

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Analytics"}
        subtitle="Review assigned quiz outcomes, move from class trends into individual answers, and send follow-up actions without leaving the dashboard."
        actions={
          <DashboardButton type="button" size="lg" variant="secondary" onClick={handleExportCsv}>
            <CalendarDays className="h-4 w-4" />
            Export current view
          </DashboardButton>
        }
      />

      <DashboardSurface
        variant="hero"
        radius="2xl"
        padding="lg"
        className="overflow-hidden"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.92fr)] xl:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardBadge tone="white">Results workspace</DashboardBadge>
              <DashboardBadge tone="white">{selectedClass.name}</DashboardBadge>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Assigned quiz
              </p>
              <h2 className="max-w-3xl text-[2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.6rem]">
                {selectedAssignment.title}
              </h2>
              <p className="max-w-2xl text-[15px] leading-7 text-white/80">
                Move from class-wide outcomes into individual follow-up without losing the assigned quiz context. Filters stay close to the quiz, and the roster stays anchored below.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <DashboardBadge tone="white">
                {isSwitchingAnalytics ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white/60" />
                    Loading…
                  </span>
                ) : (
                  `${filteredRows.length} visible students`
                )}
              </DashboardBadge>
              <DashboardBadge tone="white">
                {selectedAssignment.questionCount} questions
              </DashboardBadge>
              <DashboardBadge tone="white">
                Assigned {formatCurrentShortDate(selectedAssignment.assignedAt)}
              </DashboardBadge>
              <DashboardBadge tone="white">
                {selectedAssignment.deadline
                  ? `Due ${formatCurrentShortDate(selectedAssignment.deadline)}`
                  : "No deadline"}
              </DashboardBadge>
              <DashboardBadge tone="white">
                {selectedAssignment.maxAttempts} max attempts
              </DashboardBadge>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-[rgba(15,23,42,0.12)] p-5 shadow-[0_24px_48px_rgba(11,15,38,0.16)] backdrop-blur-sm dark:bg-[rgba(8,14,28,0.36)]">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Refine view
              </p>
              <p className="text-sm leading-6 text-white/78">
                Change class, narrow the cohort, and keep the roster focused on the students who need attention.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="min-w-0 space-y-2">
                <span className="text-sm font-medium text-white/88">Class</span>
                <select
                  value={selectedClass.id}
                  onChange={(event) => handleClassChange(event.target.value)}
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-white/20 bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)] shadow-[0_14px_28px_rgba(11,15,38,0.12)]",
                  )}
                >
                  {classOptions.map((teacherClass) => (
                    <option key={teacherClass.id} value={teacherClass.id}>
                      {teacherClass.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-sm font-medium text-white/88">Assigned quiz</span>
                <select
                  value={selectedAssignment.assignmentId}
                  onChange={(event) => handleAssignmentChange(event.target.value)}
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-white/20 bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)] shadow-[0_14px_28px_rgba(11,15,38,0.12)]",
                  )}
                >
                  {selectedClass.assignedQuizzes.map((assignment) => (
                    <option key={assignment.assignmentId} value={assignment.assignmentId}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-sm font-medium text-white/88">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | "active"
                        | "completed"
                        | "in_progress"
                        | "expired"
                        | "attempts_exhausted",
                    )
                  }
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-white/20 bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)] shadow-[0_14px_28px_rgba(11,15,38,0.12)]",
                  )}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Available</option>
                  <option value="completed">Finished</option>
                  <option value="in_progress">In progress</option>
                  <option value="expired">Expired</option>
                  <option value="attempts_exhausted">Attempts exhausted</option>
                </select>
              </label>

              <label className="min-w-0 space-y-2">
                <span className="text-sm font-medium text-white/88">Score range</span>
                <select
                  value={scoreRange}
                  onChange={(event) =>
                    setScoreRange(
                      event.target.value as
                        | "all"
                        | "85-100"
                        | "70-84"
                        | "below-70"
                        | "missing",
                    )
                  }
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-white/20 bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)] shadow-[0_14px_28px_rgba(11,15,38,0.12)]",
                  )}
                >
                  <option value="all">All scores</option>
                  <option value="85-100">85-100</option>
                  <option value="70-84">70-84</option>
                  <option value="below-70">Below 70</option>
                  <option value="missing">No score yet</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </DashboardSurface>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isSwitchingAnalytics ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <ClassQuizAnalyticsCard
              title="Completion Rate"
              value={`${analytics.completionRate}%`}
              helper={`${analytics.completedStudentsCount} of ${analytics.assignedStudentsCount} joined students finished the assigned quiz.`}
              icon={CheckCircle2}
              tone="success"
            />
            <ClassQuizAnalyticsCard
              title="Average Score"
              value={analytics.averageScore === null ? "--" : `${analytics.averageScore}%`}
              helper="Based on each student's latest completed attempt."
              icon={TrendingUp}
              tone="brand"
            />
            <ClassQuizAnalyticsCard
              title="Needs Attention"
              value={String(analytics.interventionStudents.length)}
              helper={`${analytics.exhaustedAttemptsStudentsCount} exhausted attempts or fell below ${DEFAULT_INTERVENTION_THRESHOLD}%.`}
              icon={Users}
              tone="warning"
            />
            <ClassQuizAnalyticsCard
              title="Missed Deadline"
              value={String(analytics.missedDeadlineStudentsCount)}
              helper={
                analytics.missedDeadlineStudentsCount
                  ? `${analytics.expirationRate}% of the class`
                  : "No missed deadlines yet."
              }
              icon={CalendarDays}
              tone="accent"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Student Results"
            description="Keep the roster visible, search inside the table, and take the next action without leaving this viewport."
            actions={<DashboardBadge tone="info">{filteredRows.length} in view</DashboardBadge>}
            contentClassName="space-y-4"
          >
            {!filteredRows.length ? (
              <EmptyStateBlock
                title="No students match these filters"
                description="Adjust the student search, status, or score range to bring the assigned roster back into view."
                icon={Users}
                className="border-dashed"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <DashboardSearchField
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search student name or email..."
                    containerClassName="w-full max-w-xl"
                    inputClassName="border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <DashboardBadge tone="neutral">
                      {analytics.rows.length} total students
                    </DashboardBadge>
                    {selectedRow ? (
                      <DashboardBadge tone="info">
                        Reviewing {selectedRow.student.fullName}
                      </DashboardBadge>
                    ) : null}
                  </div>
                </div>
                <div className="overflow-hidden rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]">
                  <div className="max-h-[430px] overflow-auto">
                    <Table className="min-w-[940px]">
                      <TableHeader className="sticky top-0 z-10 bg-[var(--dashboard-surface-muted)]">
                        <TableRow className="border-[var(--dashboard-border-soft)] hover:bg-[var(--dashboard-surface-muted)]">
                          <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Student
                          </TableHead>
                          <TableHead className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Status
                          </TableHead>
                          <TableHead className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Score
                          </TableHead>
                          <TableHead className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Accuracy
                          </TableHead>
                          <TableHead className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Weak topics
                          </TableHead>
                          <TableHead className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Completed
                          </TableHead>
                          <TableHead className="px-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isSwitchingAnalytics ? (
                          <TableBodySkeleton />
                        ) : (
                          filteredRows.map((row) => (
                            <StudentQuizResultRow
                              key={row.rowId}
                              row={row}
                              isSelected={row.rowId === selectedStudentRowId}
                              onSelect={() => setSelectedStudentRowId(row.rowId)}
                              actionMenu={
                                <ActionMenu
                                  studentName={row.student.fullName}
                                  onViewDetails={() => setSelectedStudentRowId(row.rowId)}
                                  onNotifyStudent={() =>
                                    handleTeacherFollowUp(row, "needs_review")
                                  }
                                  onReassignQuiz={() => handleGrantAttempt(row)}
                                  onScheduleFollowUp={() =>
                                    handleTeacherFollowUp(row, "follow_up_practice")
                                  }
                                />
                              }
                            />
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Actionable Analytics"
            description="Switch between class summary, question friction, score spread, and intervention queue without pushing the student panel off screen."
            actions={<DashboardBadge tone="neutral">4 analysis lenses</DashboardBadge>}
            contentClassName="space-y-4"
          >
            <Tabs
              value={analyticsView}
              onValueChange={(value) =>
                setAnalyticsView(
                  value as "summary" | "questions" | "distribution" | "interventions",
                )
              }
              className="space-y-4"
            >
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-bg-elevated)]/95 p-1.5 shadow-[0_16px_32px_rgba(18,32,58,0.05)] md:grid-cols-4">
                <TabsTrigger value="summary" className="rounded-[14px]">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="questions" className="rounded-[14px]">
                  Questions
                </TabsTrigger>
                <TabsTrigger value="distribution" className="rounded-[14px]">
                  Distribution
                </TabsTrigger>
                <TabsTrigger value="interventions" className="rounded-[14px]">
                  Intervention
                </TabsTrigger>
              </TabsList>

              {isSwitchingAnalytics ? (
                <TabsContent value={analyticsView}>
                  <AnalyticsContentSkeleton />
                </TabsContent>
              ) : (
                <>
                  <TabsContent value="summary">
                    <QuizSummaryPanel
                      assignment={selectedAssignment}
                      analytics={analytics}
                      onExportCsv={handleExportCsv}
                    />
                  </TabsContent>

                  <TabsContent value="questions">
                    <div className="max-h-[420px] overflow-y-auto pr-1">
                      <QuestionAnalyticsPanel questions={analytics.questionAnalytics} />
                    </div>
                  </TabsContent>

                  <TabsContent value="distribution">
                    <ScoreDistributionPanel analytics={analytics} />
                  </TabsContent>

                  <TabsContent value="interventions">
                    <InterventionPanel analytics={analytics} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </SectionCard>
        </div>

        {isSwitchingAnalytics ? (
          <InsightsPanelSkeleton />
        ) : (
          <StudentQuizInsightsPanel
            assignment={selectedAssignment}
            row={selectedRow}
            onNotifyStudent={
              selectedRow
                ? () => handleTeacherFollowUp(selectedRow, "needs_review")
                : undefined
            }
            onReassignQuiz={
              selectedRow
                ? () => handleGrantAttempt(selectedRow)
                : undefined
            }
            onScheduleFollowUp={
              selectedRow
                ? () => handleTeacherFollowUp(selectedRow, "follow_up_practice")
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
