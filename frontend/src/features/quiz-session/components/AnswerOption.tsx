import {
  CheckCircle2,
  CircleDot,
  XCircle,
} from "../../../components/icons/AppIcons";
import { cn } from "../../../components/ui/utils";

interface AnswerOptionProps {
  label: string;
  index: number;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrectAnswer: boolean;
  isIncorrectSelection: boolean;
  onSelect: () => void;
}

function getOptionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export function AnswerOption({
  label,
  index,
  isSelected,
  isSubmitted,
  isCorrectAnswer,
  isIncorrectSelection,
  onSelect,
}: AnswerOptionProps) {
  const Icon = isSubmitted
    ? isCorrectAnswer
      ? CheckCircle2
      : isIncorrectSelection
        ? XCircle
        : CircleDot
    : CircleDot;

  return (
    <button
      type="button"
      disabled={isSubmitted}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-[18px] border px-4 py-3.5 text-left transition",
        isSubmitted && isCorrectAnswer
          ? "border-[var(--dashboard-success)] bg-[var(--dashboard-success-soft)]"
          : isSubmitted && isIncorrectSelection
            ? "border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/35"
            : isSelected
              ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft)]"
              : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] hover:border-[var(--dashboard-brand-soft)]",
      )}
      aria-pressed={isSelected}
    >
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          isSubmitted && isCorrectAnswer
            ? "border-[var(--dashboard-success)] bg-[var(--dashboard-success)] text-white"
            : isSubmitted && isIncorrectSelection
              ? "border-[var(--dashboard-danger)] bg-[var(--dashboard-danger)] text-white"
              : isSelected
                ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand)] text-white"
                : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] text-[var(--dashboard-text-soft)]",
        )}
      >
        {isSubmitted && isCorrectAnswer ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : isSubmitted && isIncorrectSelection ? (
          <XCircle className="h-3.5 w-3.5" />
        ) : (
          getOptionLetter(index)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-medium leading-7 text-[var(--dashboard-text-strong)]">
            {label}
          </p>
          {isSubmitted && isCorrectAnswer ? (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-success)]">
              Correct answer
            </span>
          ) : null}
          {isSubmitted && isIncorrectSelection ? (
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-danger)]">
              Your answer
            </span>
          ) : null}
        </div>
      </div>

      <Icon
        className={cn(
          "mt-1 h-4.5 w-4.5 shrink-0",
          isSubmitted && isCorrectAnswer
            ? "text-[var(--dashboard-success)]"
            : isSubmitted && isIncorrectSelection
              ? "text-[var(--dashboard-danger)]"
              : isSelected
                ? "text-[var(--dashboard-success)]"
                : "text-[var(--dashboard-text-faint)]",
        )}
      />
    </button>
  );
}
