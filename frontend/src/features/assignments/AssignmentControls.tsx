import {
  AlertCircle,
  CalendarDays,
  RefreshCw,
  Timer,
} from "../../components/icons/AppIcons";
import { cn } from "../../components/ui/utils";
import {
  DashboardBadge,
  dashboardBadgeVariants,
  dashboardInputVariants,
  dashboardMetaTextClassName,
  dashboardSelectVariants,
} from "../dashboard/components/DashboardPrimitives";
import {
  formatAssignmentAttempts,
  getAssignmentStatusLabel,
  getAssignmentStatusTone,
  type AssignmentProgressStatus,
  type AssignmentSettingsFormValues,
} from "./assignmentConstraints";

interface AssignmentSettingsFormProps {
  values: AssignmentSettingsFormValues;
  deadlineError?: string;
  onChange: (values: AssignmentSettingsFormValues) => void;
  className?: string;
}

export function AssignmentSettingsForm({
  values,
  deadlineError,
  onChange,
  className,
}: AssignmentSettingsFormProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <div className="space-y-3 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4 md:col-span-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--dashboard-brand)]" />
          <p className="font-semibold text-[var(--dashboard-text-strong)]">
            Submission deadline
          </p>
        </div>
        <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
          Optional. Leave blank if students should be able to submit whenever they are ready.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className={dashboardMetaTextClassName}>Date</span>
            <input
              type="date"
              value={values.deadlineDate}
              onChange={(event) =>
                onChange({
                  ...values,
                  deadlineDate: event.target.value,
                })
              }
              className={cn(
                dashboardInputVariants({ size: "md" }),
                "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)]",
              )}
            />
          </label>

          <label className="space-y-2">
            <span className={dashboardMetaTextClassName}>Time</span>
            <input
              type="time"
              value={values.deadlineTime}
              onChange={(event) =>
                onChange({
                  ...values,
                  deadlineTime: event.target.value,
                })
              }
              className={cn(
                dashboardInputVariants({ size: "md" }),
                "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)]",
              )}
            />
          </label>
        </div>

        {deadlineError ? (
          <div className="rounded-[16px] border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)]/40 px-4 py-3">
            <p className="text-sm leading-6 text-[var(--dashboard-danger)]">
              {deadlineError}
            </p>
          </div>
        ) : null}
      </div>

      <label className="space-y-2 rounded-[20px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
        <span className="flex items-center gap-2 font-semibold text-[var(--dashboard-text-strong)]">
          <RefreshCw className="h-4 w-4 text-[var(--dashboard-brand)]" />
          Max attempts
        </span>
        <span className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
          Default is one attempt. Choose unlimited if students should be able to retry freely.
        </span>
        <select
          value={values.maxAttempts}
          onChange={(event) =>
            onChange({
              ...values,
              maxAttempts: event.target.value as AssignmentSettingsFormValues["maxAttempts"],
            })
          }
          className={cn(
            dashboardSelectVariants({ size: "md" }),
            "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-strong)]",
          )}
        >
          <option value="1">1 attempt</option>
          <option value="2">2 attempts</option>
          <option value="3">3 attempts</option>
          <option value="unlimited">Unlimited</option>
        </select>
      </label>
    </div>
  );
}

interface DeadlineBadgeProps {
  deadline: string | null | undefined;
  expired?: boolean;
}

export function DeadlineBadge({ deadline, expired = false }: DeadlineBadgeProps) {
  return (
    <DashboardBadge tone={expired ? "danger" : "info"}>
      <CalendarDays className="h-3.5 w-3.5" />
      {deadline
        ? `Due ${new Date(deadline).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}`
        : "No deadline"}
    </DashboardBadge>
  );
}

interface AttemptsBadgeProps {
  attemptsUsed?: number;
  maxAttempts: number | null;
  isLoading?: boolean;
}

export function AttemptsBadge({
  attemptsUsed,
  maxAttempts,
  isLoading = false,
}: AttemptsBadgeProps) {
  const label = isLoading
    ? "Checking attempts..."
    : typeof attemptsUsed === "number"
      ? maxAttempts === null
        ? `${attemptsUsed} used • ${formatAssignmentAttempts(maxAttempts)}`
        : `${attemptsUsed}/${maxAttempts} attempts used`
      : formatAssignmentAttempts(maxAttempts);

  return (
    <DashboardBadge tone="neutral">
      <RefreshCw className="h-3.5 w-3.5" />
      {label}
    </DashboardBadge>
  );
}

interface QuizStatusBadgeProps {
  status: AssignmentProgressStatus;
  label?: string;
}

export function QuizStatusBadge({ status, label }: QuizStatusBadgeProps) {
  return (
    <DashboardBadge tone={getAssignmentStatusTone(status)}>
      {label ?? getAssignmentStatusLabel(status)}
    </DashboardBadge>
  );
}

interface AttemptProgressIndicatorProps {
  attemptsUsed: number;
  maxAttempts: number | null;
  status?: AssignmentProgressStatus;
  isLoading?: boolean;
  className?: string;
}

export function AttemptProgressIndicator({
  attemptsUsed,
  maxAttempts,
  status,
  isLoading = false,
  className,
}: AttemptProgressIndicatorProps) {
  const width =
    maxAttempts === null || maxAttempts <= 0
      ? Math.min(attemptsUsed * 20, 100)
      : Math.min(Math.round((attemptsUsed / maxAttempts) * 100), 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-[var(--dashboard-text-strong)]">
          <Timer className="h-4 w-4 text-[var(--dashboard-brand)]" />
          Attempts
        </span>
        <span className="text-[var(--dashboard-text-soft)]">
          {isLoading
            ? "Checking attempts..."
            : maxAttempts === null
              ? `${attemptsUsed} used • unlimited`
              : `${attemptsUsed} of ${maxAttempts}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--dashboard-surface-muted)]">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            status === "attempts_exhausted"
              ? "bg-[var(--dashboard-danger)]"
              : "bg-[var(--dashboard-brand)]",
          )}
          style={{ width: `${Math.max(width, attemptsUsed > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

interface AssignmentWarningProps {
  children: string;
}

export function AssignmentWarning({ children }: AssignmentWarningProps) {
  return (
    <div className="rounded-[18px] border border-[var(--dashboard-warning-soft)] bg-[var(--dashboard-warning-soft)]/35 px-4 py-3">
      <p className="flex items-start gap-2 text-sm leading-6 text-[var(--dashboard-warning)]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  );
}

export { dashboardBadgeVariants };
