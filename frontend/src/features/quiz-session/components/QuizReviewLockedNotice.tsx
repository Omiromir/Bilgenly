import { Lock } from "../../../components/icons/AppIcons";
import { DashboardSurface } from "../../dashboard/components/DashboardPrimitives";

interface QuizReviewLockedNoticeProps {
  attemptsUsed: number;
  maxAttempts: number;
  reason?: string | null;
}

export function QuizReviewLockedNotice({
  attemptsUsed,
  maxAttempts,
  reason,
}: QuizReviewLockedNoticeProps) {
  const remaining = Math.max(maxAttempts - attemptsUsed, 0);

  return (
    <DashboardSurface
      radius="lg"
      padding="lg"
      className="border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]"
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--dashboard-surface-elevated)] text-[var(--dashboard-text-soft)]">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
            Answer review is locked
          </h3>
          <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
            {reason ??
              `This is an assigned quiz. You'll be able to see the correct answers and explanations once you've used all ${maxAttempts} attempts (${remaining} ${
                remaining === 1 ? "attempt" : "attempts"
              } left).`}
          </p>
        </div>
      </div>
    </DashboardSurface>
  );
}
