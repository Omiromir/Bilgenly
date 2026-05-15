import { cn } from "../../../components/ui/utils";
import {
  DashboardButton,
  DashboardSurface,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardSelectVariants,
} from "../../dashboard/components/DashboardPrimitives";
import { QUIZ_BUILDER_LIMITS, clampText } from "../quizBuilderLimits";
import type { ParsedSource, QuizBuilderCopy } from "../quizBuilderTypes";

interface QuizBuilderConfigureStageProps {
  canGenerate: boolean;
  contextValue: string;
  copy: QuizBuilderCopy;
  handleGenerateQuiz: () => void;
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
  handleReplaceSource,
  mode,
  parsedSource,
  questionCount,
  quizTitle,
  setContextValue,
  setQuestionCount,
  setQuizTitle,
}: QuizBuilderConfigureStageProps) {
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
      </section>
    </DashboardSurface>
  );
}
