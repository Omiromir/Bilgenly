import { cn } from "../../../components/ui/utils";
import {
  DashboardButton,
  DashboardSurface,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardSelectVariants,
} from "../../dashboard/components/DashboardPrimitives";
import { Wand2 } from "../../../components/icons/AppIcons";
import { QUIZ_BUILDER_LIMITS, clampText } from "../quizBuilderLimits";
import type { ParsedSource, QuizBuilderCopy } from "../quizBuilderTypes";

interface QuizBuilderConfigureStageProps {
  canGenerate: boolean;
  contextValue: string;
  copy: QuizBuilderCopy;
  handleGenerateQuiz: () => void;
  handleMockGenerate?: () => void;
  handleReplaceSource: () => void;
  mode: "teacher" | "student";
  parsedSource: ParsedSource | null;
  questionCount: number;
  quizTitle: string;
  setContextValue: (value: string) => void;
  setQuestionCount: (value: number) => void;
  setQuizTitle: (value: string) => void;
}

export function QuizBuilderConfigureStage({
  canGenerate,
  contextValue,
  copy,
  handleGenerateQuiz,
  handleMockGenerate,
  handleReplaceSource,
  mode,
  parsedSource,
  questionCount,
  quizTitle,
  setContextValue,
  setQuestionCount,
  setQuizTitle,
}: QuizBuilderConfigureStageProps) {
  const isDev = import.meta.env.DEV;
  return (
    <DashboardSurface asChild radius="xl" padding="lg">
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
              Review source and configure quiz
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
              {copy.configureDescription}
            </p>
          </div>
          <DashboardButton
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleReplaceSource}
          >
            Replace source
          </DashboardButton>
        </div>

        <div className={dashboardInsetBlockClassName}>
          <p className="text-sm text-[var(--dashboard-text-soft)]">Source</p>
          <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
            {parsedSource?.label}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              {mode === "student" ? "Quiz title (optional)" : "Quiz title"}
            </span>
            <input
              value={quizTitle}
              onChange={(event) =>
                setQuizTitle(
                  clampText(event.target.value, QUIZ_BUILDER_LIMITS.quizTitle),
                )
              }
              maxLength={QUIZ_BUILDER_LIMITS.quizTitle}
              placeholder={
                mode === "student"
                  ? "Auto-generate from my study topic"
                  : "Cell Structure Review Quiz"
              }
              className={dashboardInputVariants({ size: "lg" })}
            />
            <p className="text-xs text-[var(--dashboard-text-faint)]">
              {quizTitle.length}/{QUIZ_BUILDER_LIMITS.quizTitle}
            </p>
          </label>
          {mode === "student" ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                {copy.contextLabel}
              </span>
              <select
                value={contextValue}
                onChange={(event) => setContextValue(event.target.value)}
                className={cn(dashboardSelectVariants({ size: "md" }), "w-full")}
              >
                {copy.contextOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              Number of questions
            </span>
            <select
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              className={cn(dashboardSelectVariants({ size: "md" }), "w-full")}
            >
              {[5, 8, 10, 12, 15].map((value) => (
                <option key={value} value={value}>
                  {value} questions
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <DashboardButton
              type="button"
              size="xl"
              onClick={handleGenerateQuiz}
              disabled={!canGenerate}
              className="min-w-[220px]"
            >
              {mode === "student" ? "Generate Practice Quiz" : "Generate Quiz"}
            </DashboardButton>
            <p className="text-sm text-[var(--dashboard-text-soft)]">
              {mode === "student"
                ? "You will be able to start practicing right away after generation."
                : "The draft will stay editable before export or test run."}
            </p>
          </div>

          {isDev && handleMockGenerate ? (
            <div className="flex items-center gap-3 rounded-[16px] border border-dashed border-amber-400/60 bg-amber-50/60 px-4 py-2.5 dark:border-amber-500/40 dark:bg-amber-950/30">
              <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                DEV
              </span>
              <button
                type="button"
                onClick={handleMockGenerate}
                className="flex items-center gap-1.5 rounded-[10px] border border-amber-400/50 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-400/25 active:scale-[0.97] dark:text-amber-400"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Mock Generate (no AI)
              </button>
              <span className="text-xs text-amber-600/80 dark:text-amber-500/80">
                Skips the AI call — returns a canned quiz instantly
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </DashboardSurface>
  );
}
