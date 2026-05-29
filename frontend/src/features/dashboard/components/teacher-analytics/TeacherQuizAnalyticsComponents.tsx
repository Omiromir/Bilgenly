import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
} from "../../../../components/icons/AppIcons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import { Avatar, AvatarFallback } from "../../../../components/ui/avatar";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  TableCell,
  TableRow,
} from "../../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { cn } from "../../../../components/ui/utils";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardInsetBlockClassName,
  dashboardMetaTextClassName,
} from "../DashboardPrimitives";
import { EmptyStateBlock } from "../EmptyStateBlock";
import type { TeacherClassAssignedQuiz } from "../classes/teacherClassesTypes";
import { formatCurrentDateTime } from "../../settings/settingsPreferences";
import type {
  TeacherAssignedQuizAnalytics,
  TeacherQuestionAnalyticsItem,
  TeacherStudentQuizResultRowData,
} from "./teacherQuizAnalyticsUtils";

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not completed";
  }

  const resolvedDate = new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return "Invalid date";
  }

  return formatCurrentDateTime(resolvedDate);
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function formatAxisPercent(value: number) {
  return `${value}%`;
}

function getStudentStatusTone(status: TeacherStudentQuizResultRowData["status"]) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "in_progress":
      return "warning" as const;
    case "expired":
      return "danger" as const;
    case "attempts_exhausted":
      return "neutral" as const;
    case "active":
    default:
      return "neutral" as const;
  }
}

function getStudentStatusLabel(status: TeacherStudentQuizResultRowData["status"]) {
  switch (status) {
    case "completed":
      return "Finished";
    case "in_progress":
      return "In progress";
    case "expired":
      return "Expired";
    case "attempts_exhausted":
      return "No attempts left";
    case "active":
    default:
      return "Available";
  }
}

function buildSelectedAnswerLabel(row: TeacherStudentQuizResultRowData, questionId: string) {
  return (
    row.latestAttemptQuestions.find((item) => item.questionId === questionId)
      ?.selectedAnswerText ?? "No submitted answer"
  );
}

function buildCorrectAnswerLabel(row: TeacherStudentQuizResultRowData, questionId: string) {
  return (
    row.latestAttemptQuestions.find((item) => item.questionId === questionId)
      ?.correctAnswerText ?? "Unavailable"
  );
}

interface ClassQuizAnalyticsCardProps {
  title: string;
  value: string;
  helper: string;
  icon: typeof TrendingUp;
  tone?: "brand" | "accent" | "success" | "warning";
  className?: string;
}

export function ClassQuizAnalyticsCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "brand",
  className,
}: ClassQuizAnalyticsCardProps) {
  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "space-y-5 border-[var(--dashboard-border-soft)] bg-[linear-gradient(180deg,var(--dashboard-surface-elevated),var(--dashboard-surface))] shadow-[var(--dashboard-shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-text-faint)]">
            {title}
          </p>
          <p className="text-[2.2rem] font-semibold tracking-tight text-[var(--dashboard-text-strong)]">
            {value}
          </p>
        </div>

        <div className={dashboardIconChipVariants({ tone, size: "lg" })}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="h-px bg-[linear-gradient(90deg,rgba(91,76,240,0.16),rgba(91,76,240,0))]" />

      <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">{helper}</p>
    </DashboardSurface>
  );
}

interface ActionMenuProps {
  studentName: string;
  onViewDetails: () => void;
  onNotifyStudent: () => void;
  onReassignQuiz: () => void;
  onScheduleFollowUp: () => void;
}

export function ActionMenu({
  studentName,
  onViewDetails,
  onNotifyStudent,
  onReassignQuiz,
  onScheduleFollowUp,
}: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dashboard-border-soft)] text-[var(--dashboard-text-soft)] transition hover:bg-[var(--dashboard-surface-muted)] hover:text-[var(--dashboard-text-strong)]"
        aria-label={`Open actions for ${studentName}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onViewDetails}>
          <FileText className="h-4 w-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNotifyStudent}>
          <Mail className="h-4 w-4" />
          Request review
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReassignQuiz}>
          <RefreshCw className="h-4 w-4" />
          Grant extra attempt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onScheduleFollowUp}>
          <Send className="h-4 w-4" />
          Suggest practice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface StudentQuizResultRowProps {
  row: TeacherStudentQuizResultRowData;
  isSelected: boolean;
  onSelect: () => void;
  actionMenu: ReactNode;
}

export function StudentQuizResultRow({
  row,
  isSelected,
  onSelect,
  actionMenu,
}: StudentQuizResultRowProps) {
  return (
    <TableRow
      className={cn(
        "cursor-pointer border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] transition-colors hover:bg-[var(--dashboard-surface-muted)]/65",
        isSelected &&
          "bg-[var(--dashboard-brand-soft-alt)]/70 shadow-[inset_3px_0_0_0_var(--dashboard-brand)]",
      )}
      onClick={onSelect}
    >
      <TableCell className="px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-brand-soft-alt)]">
            <AvatarFallback className="bg-[var(--dashboard-brand-soft-alt)] text-sm font-semibold text-[var(--dashboard-brand)]">
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
      <TableCell className="px-3 py-4">
        <div className="flex flex-wrap gap-2">
          <DashboardBadge tone={getStudentStatusTone(row.status)}>
            {getStudentStatusLabel(row.status)}
          </DashboardBadge>
          {/* Only show "Missed deadline" when the status isn't already "Expired" — otherwise it's redundant */}
          {row.missedDeadline && row.status !== "expired" ? (
            <DashboardBadge tone="danger">Missed deadline</DashboardBadge>
          ) : null}
          {/* Show only "At Risk" — skip "Needs Review" (not implemented) */}
          {row.flags.filter((f) => f === "At Risk").map((flag) => (
            <DashboardBadge key={`${row.rowId}-${flag}`} tone="danger">
              {flag}
            </DashboardBadge>
          ))}
        </div>
      </TableCell>
      <TableCell className="px-3 py-4">
        <div>
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            {row.latestScore === null ? "--" : `${row.latestScore}%`}
          </p>
          <p className="text-xs text-[var(--dashboard-text-soft)]">
            Best {row.bestScore === null ? "--" : `${row.bestScore}%`} | {row.attemptsUsed} attempts
          </p>
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 text-sm text-[var(--dashboard-text-soft)]">
        {row.status === "completed" || row.status === "attempts_exhausted"
          ? `${row.correctCount}/${row.totalQuestions} correct`
          : "--"}
      </TableCell>
      <TableCell className="px-3 py-4">
        {row.weakTopics.length ? (
          <div className="flex flex-wrap gap-2">
            {row.weakTopics.map((topic) => (
              <DashboardBadge key={`${row.rowId}-${topic}`} tone="warning">
                {topic}
              </DashboardBadge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[var(--dashboard-text-soft)]">
            {row.topicPerformance.length ? "Stable" : "No tags"}
          </span>
        )}
      </TableCell>
      <TableCell className="px-3 py-4 text-sm text-[var(--dashboard-text-soft)]">
        {formatDateTime(row.completionTimestamp)}
      </TableCell>
      <TableCell className="px-4 py-4 text-right">{actionMenu}</TableCell>
    </TableRow>
  );
}

interface QuizSummaryPanelProps {
  assignment: TeacherClassAssignedQuiz;
  analytics: TeacherAssignedQuizAnalytics;
  onExportCsv: () => void;
}

export function QuizSummaryPanel({
  assignment,
  analytics,
  onExportCsv,
}: QuizSummaryPanelProps) {
  // Only show questions that students actually got wrong, ranked worst-first.
  // The previous slice(0, 3) took the first 3 by question-number order, so
  // questions with 0% miss rate appeared in the "most frequently missed" list.
  const mostMissed = [...analytics.questionAnalytics]
    .filter((q) => q.missRate > 0)
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, 3);
  const summaryChartData = [
    {
      label: "Completion",
      value: analytics.completionRate,
      fill: "var(--dashboard-success)",
      helper: `${analytics.completedStudentsCount}/${analytics.assignedStudentsCount}`,
    },
    {
      label: "Average score",
      value: analytics.averageScore ?? 0,
      fill: "var(--dashboard-brand)",
      helper: analytics.averageScore === null ? "--" : `${analytics.averageScore}%`,
    },
    {
      label: "Expired",
      value: analytics.expirationRate,
      fill: "var(--dashboard-warning)",
      helper: `${analytics.missedDeadlineStudentsCount} students`,
    },
  ];

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[1.35rem] font-semibold text-[var(--dashboard-text-strong)]">
            Quiz Summary
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
            Keep the class-level view tied to one assigned quiz and focus on the questions creating the most friction.
          </p>
        </div>
        <DashboardButton type="button" variant="secondary" size="sm" onClick={onExportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </DashboardButton>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Quiz</p>
          <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
            {assignment.title}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Questions</p>
          <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
            {analytics.numberOfQuestions}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Students attempted</p>
          <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
            {analytics.studentsWithAttemptsCount} of {analytics.assignedStudentsCount}
          </p>
        </div>
        <div className={dashboardInsetBlockClassName}>
          <p className={dashboardMetaTextClassName}>Avg. attempts used</p>
          <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
            {analytics.averageAttemptsUsed}
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--dashboard-brand)]" />
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            Class snapshot
          </p>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summaryChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--dashboard-chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
                axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={formatAxisPercent}
                tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
                axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, _name, item) => [`${value}%`, item.payload.helper]}
                contentStyle={{
                  borderRadius: "14px",
                  borderColor: "var(--dashboard-tooltip-border)",
                  background: "var(--dashboard-tooltip-bg)",
                  color: "var(--dashboard-text)",
                }}
                labelStyle={{ color: "var(--dashboard-text-strong)", fontWeight: 600 }}
                itemStyle={{ color: "var(--dashboard-text)" }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {summaryChartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--dashboard-warning)]" />
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            Most frequently missed questions
          </p>
        </div>
        {mostMissed.length ? (
          <div className="space-y-3">
            {mostMissed.map((question) => (
              <div
                key={question.questionId}
                className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--dashboard-text-strong)]">
                      Question {question.questionNumber}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      {question.prompt}
                    </p>
                  </div>
                  <DashboardBadge tone="warning">{question.missRate}% missed</DashboardBadge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateBlock
            title="No question-level misses yet"
            description="Once students finish this assigned quiz, the most-missed questions will surface here automatically."
            icon={BookOpen}
            className="border-dashed"
          />
        )}
      </div>
    </DashboardSurface>
  );
}

interface QuestionAnalyticsPanelProps {
  questions: TeacherQuestionAnalyticsItem[];
}

export function QuestionAnalyticsPanel({ questions }: QuestionAnalyticsPanelProps) {
  if (!questions.length) {
    return (
      <EmptyStateBlock
        title="No per-question analytics yet"
        description="Per-question statistics appear after at least one student finishes the selected assigned quiz."
        icon={FileText}
        className="border-dashed"
      />
    );
  }

  // Chart: keep original question-number order so the X-axis reads Q1, Q2, Q3…
  // and teachers can spot which part of the quiz caused trouble.
  const chartData = questions.map((question) => ({
    label: `Q${question.questionNumber}`,
    missRate: question.missRate,
    prompt: question.prompt,
    missed: question.missCount,
  }));

  // Cards: sort worst-first so the highest-miss questions are immediately visible.
  // Filter out questions with 0 attempts AND 0 misses — there's nothing to surface.
  const topMissed = [...questions]
    .filter((q) => q.attemptCount > 0)
    .sort((a, b) => b.missRate - a.missRate)
    .slice(0, 5);

  const hasMisses = topMissed.some((q) => q.missRate > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--dashboard-warning)]" />
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            Miss rate by question
          </p>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--dashboard-chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
                axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={formatAxisPercent}
                tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
                axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, _name, item) => [
                  `${value}% miss rate`,
                  item.payload.prompt,
                ]}
                contentStyle={{
                  borderRadius: "14px",
                  borderColor: "var(--dashboard-tooltip-border)",
                  background: "var(--dashboard-tooltip-bg)",
                  color: "var(--dashboard-text)",
                }}
                labelStyle={{ color: "var(--dashboard-text-strong)", fontWeight: 600 }}
                itemStyle={{ color: "var(--dashboard-text)" }}
              />
              <Bar dataKey="missRate" fill="var(--dashboard-warning)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--dashboard-warning)]" />
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            {hasMisses ? "Most frequently missed" : "Question breakdown"}
          </p>
        </div>
        {topMissed.length ? (
          topMissed.map((question) => (
            <div
              key={question.questionId}
              className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <DashboardBadge tone="info">Question {question.questionNumber}</DashboardBadge>
                    {question.tags.map((tag) => (
                      <DashboardBadge key={`${question.questionId}-${tag}`} tone="neutral">
                        {tag}
                      </DashboardBadge>
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-[var(--dashboard-text-strong)]">
                    {question.prompt}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-semibold ${question.missRate > 0 ? "text-[var(--dashboard-warning)]" : "text-[var(--dashboard-success)]"}`}>
                    {question.missRate}% missed
                  </p>
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    {question.missCount}/{question.attemptCount} attempts
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyStateBlock
            title="No attempt data yet"
            description="Question-level breakdowns appear once students start submitting answers."
            icon={BookOpen}
            className="border-dashed"
          />
        )}
      </div>
    </div>
  );
}

interface StudentQuizInsightsPanelProps {
  assignment: TeacherClassAssignedQuiz;
  row: TeacherStudentQuizResultRowData | null;
  onNotifyStudent?: () => void;
  onReassignQuiz?: () => void;
  onScheduleFollowUp?: () => void;
}

export function StudentQuizInsightsPanel({
  assignment,
  row,
  onNotifyStudent,
  onReassignQuiz,
  onScheduleFollowUp,
}: StudentQuizInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "responses">(
    "overview",
  );
  const [responseFilter, setResponseFilter] = useState<"incorrect" | "all">(
    "incorrect",
  );

  useEffect(() => {
    setActiveTab("overview");
    setResponseFilter("incorrect");
  }, [row?.rowId]);

  const latestAttemptQuestions = row?.latestAttemptQuestions ?? [];
  const responseItems = useMemo(() => {
    if (!latestAttemptQuestions.length) {
      return [];
    }

    return latestAttemptQuestions
      .map((question) => ({
        question,
        questionNumber: question.questionNumber,
        isCorrect: question.isCorrect,
        statusLabel: question.isCorrect ? "Correct" : "Incorrect",
      }))
      .filter((item) =>
        responseFilter === "all" ? true : item.isCorrect === false,
      );
  }, [latestAttemptQuestions, responseFilter]);

  if (!row) {
    return (
      <EmptyStateBlock
        title="Select a student result"
        description="Choose a row from the results table to review attempts, question responses, and next-step actions."
        icon={Users}
        className="h-full border-dashed"
      />
    );
  }

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className="space-y-5 border-[var(--dashboard-border-soft)] bg-[linear-gradient(180deg,var(--dashboard-surface-elevated),var(--dashboard-surface))] shadow-[var(--dashboard-shadow-card)] xl:sticky xl:top-6 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto"
    >
      <div className="rounded-[24px] border border-[var(--dashboard-border-soft)] bg-[linear-gradient(135deg,var(--dashboard-brand-soft-alt),var(--dashboard-surface-elevated))] p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-brand-soft-alt)]">
            <AvatarFallback className="bg-[var(--dashboard-brand-soft-alt)] text-base font-semibold text-[var(--dashboard-brand)]">
              {getInitials(row.student.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--dashboard-text-faint)]">
              Student review
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="text-[1.3rem] font-semibold text-[var(--dashboard-text-strong)]">
                {row.student.fullName}
              </h3>
              <DashboardBadge tone={getStudentStatusTone(row.status)}>
                {getStudentStatusLabel(row.status)}
              </DashboardBadge>
              {/* Only show "Missed deadline" when the status isn't already "Expired" */}
              {row.missedDeadline && row.status !== "expired" ? (
                <DashboardBadge tone="danger">Missed deadline</DashboardBadge>
              ) : null}
              {/* Show only "At Risk" — skip "Needs Review" (not implemented) */}
              {row.flags.filter((f) => f === "At Risk").map((flag) => (
                <DashboardBadge key={`${row.rowId}-${flag}`} tone="danger">
                  {flag}
                </DashboardBadge>
              ))}
            </div>
            <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
              {row.student.email}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Assigned quiz: <span className="font-medium text-[var(--dashboard-text-strong)]">{assignment.title}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Latest score</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {row.latestScore === null ? "--" : `${row.latestScore}%`}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Best score</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {row.bestScore === null ? "--" : `${row.bestScore}%`}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Attempts used</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {row.attemptsUsed}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">
          Send a nudge to this student
        </p>
        <div className="flex flex-wrap gap-2">
          <DashboardButton type="button" size="sm" onClick={onNotifyStudent}>
            <Mail className="h-4 w-4" />
            Request review
          </DashboardButton>
          <DashboardButton type="button" size="sm" variant="secondary" onClick={onReassignQuiz}>
            <RefreshCw className="h-4 w-4" />
            Grant extra attempt
          </DashboardButton>
          <DashboardButton
            type="button"
            size="sm"
            variant="secondary"
            onClick={onScheduleFollowUp}
          >
            <ArrowRight className="h-4 w-4" />
            Suggest practice
          </DashboardButton>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "overview" | "history" | "responses")
        }
        className="space-y-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-bg-elevated)]/95 p-1.5 shadow-[0_16px_32px_rgba(18,32,58,0.05)]">
          <TabsTrigger value="overview" className="rounded-[14px]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-[14px]">
            Attempts
          </TabsTrigger>
          <TabsTrigger value="responses" className="rounded-[14px]">
            Responses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className={dashboardInsetBlockClassName}>
              <p className={dashboardMetaTextClassName}>Latest completion</p>
              <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
                {formatDateTime(row.recentCompletionTimestamp)}
              </p>
            </div>
            <div className={dashboardInsetBlockClassName}>
              <p className={dashboardMetaTextClassName}>Average score</p>
              <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
                {row.averageScore === null ? "--" : `${row.averageScore}%`}
              </p>
            </div>
            <div className={dashboardInsetBlockClassName}>
              <p className={dashboardMetaTextClassName}>Accuracy</p>
              <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
                {row.status === "completed" || row.status === "attempts_exhausted"
                  ? `${row.correctCount}/${row.totalQuestions} correct`
                  : "--"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--dashboard-success)]" />
              <p className="font-semibold text-[var(--dashboard-text-strong)]">
                Topic performance
              </p>
            </div>
            {row.topicPerformance.length ? (
              <div className="space-y-3">
                {row.topicPerformance.map((topic) => (
                  <div key={`${row.rowId}-${topic.label}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-[var(--dashboard-text-strong)]">
                        {topic.label}
                      </span>
                      <span className="text-[var(--dashboard-text-soft)]">
                        {topic.percentage}% correct
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--dashboard-surface-muted)]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          topic.percentage < 50
                            ? "bg-[var(--dashboard-danger)]"
                            : topic.percentage < 70
                              ? "bg-[var(--dashboard-warning)]"
                              : "bg-[var(--dashboard-success)]",
                        )}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                Topic-level analytics will appear when questions include tags.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--dashboard-brand)]" />
            <p className="font-semibold text-[var(--dashboard-text-strong)]">Score history</p>
          </div>
          {row.attempts.length ? (
            <div className="space-y-3">
              {row.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--dashboard-text-strong)]">
                        {attempt.percentage}%
                      </p>
                      <p className="text-sm text-[var(--dashboard-text-soft)]">
                        {attempt.correctCount}/{attempt.totalQuestions} correct
                        {attempt.responsesCount
                          ? ` • ${attempt.responsesCount} responses`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--dashboard-text-soft)]">
                      <p>{formatDateTime(attempt.finishedAt ?? attempt.updatedAt)}</p>
                      {attempt.durationSeconds > 0 ? (
                        <p>{formatDuration(attempt.durationSeconds)}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {row.attemptsUsed > row.attempts.length ? (
                <p className="px-1 text-xs text-[var(--dashboard-text-faint)]">
                  Showing latest attempt. {row.attemptsUsed} total attempts recorded by backend.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              No completed attempts for this student yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--dashboard-brand)]" />
              <p className="font-semibold text-[var(--dashboard-text-strong)]">
                Question responses
              </p>
            </div>
            {latestAttemptQuestions.length ? (
              <div className="flex flex-wrap gap-2">
                <DashboardButton
                  type="button"
                  size="sm"
                  variant={responseFilter === "incorrect" ? "primary" : "ghost"}
                  onClick={() => setResponseFilter("incorrect")}
                >
                  Incorrect only
                </DashboardButton>
                <DashboardButton
                  type="button"
                  size="sm"
                  variant={responseFilter === "all" ? "primary" : "ghost"}
                  onClick={() => setResponseFilter("all")}
                >
                  All questions
                </DashboardButton>
              </div>
            ) : null}
          </div>

          {latestAttemptQuestions.length ? (
            responseItems.length ? (
              <Accordion type="multiple" className="space-y-3">
                {responseItems.map(({ question, questionNumber, isCorrect, statusLabel }) => (
                  <AccordionItem
                    key={question.questionId}
                    value={question.questionId}
                    className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4"
                  >
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <DashboardBadge tone="info">Q{questionNumber}</DashboardBadge>
                          <DashboardBadge tone={isCorrect ? "success" : "danger"}>
                            {statusLabel}
                          </DashboardBadge>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--dashboard-text-strong)]">
                          {question.questionText}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      <div className={dashboardInsetBlockClassName}>
                        <p className={dashboardMetaTextClassName}>Student answer</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-strong)]">
                          {buildSelectedAnswerLabel(row, question.questionId)}
                        </p>
                      </div>
                      <div className={dashboardInsetBlockClassName}>
                        <p className={dashboardMetaTextClassName}>Correct answer</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-strong)]">
                          {buildCorrectAnswerLabel(row, question.questionId)}
                        </p>
                      </div>
                      {question.explanation ? (
                        <div className={dashboardInsetBlockClassName}>
                          <p className={dashboardMetaTextClassName}>Feedback shown to student</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-strong)]">
                            {question.explanation}
                          </p>
                        </div>
                      ) : null}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                No incorrect responses in the latest attempt. Switch to All questions to inspect the full submission.
              </div>
            )
          ) : row.status === "completed" || row.status === "attempts_exhausted" ? (
            <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5">
              <p className="text-sm font-medium text-[var(--dashboard-text-strong)]">
                Per-question responses unavailable
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {`Per-question breakdown is not available for this submission${row.latestScore !== null ? ` (${row.latestScore}%, ${row.correctCount}/${row.totalQuestions} correct)` : ""}.`}
              </p>
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              This student has not finished the selected quiz yet, so there are no question responses to review.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardSurface>
  );
}

interface ScoreDistributionPanelProps {
  analytics: TeacherAssignedQuizAnalytics;
}

export function ScoreDistributionPanel({ analytics }: ScoreDistributionPanelProps) {
  const chartData = analytics.scoreDistribution.map((bucket) => ({
    label: bucket.label,
    students: bucket.count,
    names: bucket.studentNames.join(", "),
  }));

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[var(--dashboard-brand)]" />
        <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
          Score distribution
        </h3>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--dashboard-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
              axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
              axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, _name, item) => [
                `${value} students`,
                item.payload.names || "No students yet",
              ]}
              contentStyle={{
                borderRadius: "14px",
                borderColor: "var(--dashboard-tooltip-border)",
                background: "var(--dashboard-tooltip-bg)",
                color: "var(--dashboard-text)",
              }}
              labelStyle={{ color: "var(--dashboard-text-strong)", fontWeight: 600 }}
              itemStyle={{ color: "var(--dashboard-text)" }}
            />
            <Bar dataKey="students" fill="var(--dashboard-brand)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {analytics.scoreDistribution.map((bucket) => (
          <div
            key={bucket.label}
            className="rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-3"
          >
            <p className="font-semibold text-[var(--dashboard-text-strong)]">{bucket.label}</p>
            <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
              {bucket.count} {bucket.count === 1 ? "student" : "students"}
            </p>
          </div>
        ))}
      </div>
    </DashboardSurface>
  );
}

interface InterventionPanelProps {
  analytics: TeacherAssignedQuizAnalytics;
}

export function InterventionPanel({ analytics }: InterventionPanelProps) {
  const chartData = [
    {
      label: "In progress",
      count: analytics.rows.filter((student) => student.status === "in_progress").length,
      fill: "var(--dashboard-warning)",
    },
    {
      label: "Expired",
      count: analytics.rows.filter((student) => student.status === "expired").length,
      fill: "var(--dashboard-danger)",
    },
    {
      label: "Exhausted",
      count: analytics.rows.filter((student) => student.status === "attempts_exhausted").length,
      fill: "var(--dashboard-text-soft)",
    },
    {
      label: "Needs review",
      count: analytics.rows.filter((student) => student.flags.includes("Needs Review")).length,
      fill: "var(--dashboard-warning)",
    },
    {
      label: "At risk",
      count: analytics.rows.filter((student) => student.flags.includes("At Risk")).length,
      fill: "var(--dashboard-danger)",
    },
  ];

  return (
    <DashboardSurface radius="xl" padding="md" className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[var(--dashboard-danger)]" />
        <h3 className="text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
          Students needing attention
        </h3>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--dashboard-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
              axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--dashboard-chart-axis)", fontSize: 12 }}
              axisLine={{ stroke: "var(--dashboard-chart-axis-line)" }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value} students`, "Action queue"]}
              contentStyle={{
                borderRadius: "14px",
                borderColor: "var(--dashboard-tooltip-border)",
                background: "var(--dashboard-tooltip-bg)",
                color: "var(--dashboard-text)",
              }}
              labelStyle={{ color: "var(--dashboard-text-strong)", fontWeight: 600 }}
              itemStyle={{ color: "var(--dashboard-text)" }}
            />
            <Bar dataKey="count" radius={[10, 10, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {analytics.interventionStudents.length ? (
        <div className="space-y-3">
          {analytics.interventionStudents.slice(0, 4).map((student) => (
            <div
              key={`${student.studentName}-${student.status}`}
              className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--dashboard-text-strong)]">
                    {student.studentName}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                    {student.reason}
                  </p>
                </div>
                <DashboardBadge
                  tone={
                    student.status === "completed"
                      ? "warning"
                      : student.status === "in_progress"
                        ? "warning"
                        : "danger"
                  }
                >
                  {student.score === null ? getStudentStatusLabel(student.status) : `${student.score}%`}
                </DashboardBadge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-5 text-sm leading-6 text-[var(--dashboard-text-soft)]">
          No intervention flags in the current snapshot.
        </div>
      )}
    </DashboardSurface>
  );
}
