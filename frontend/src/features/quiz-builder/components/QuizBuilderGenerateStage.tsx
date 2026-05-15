import {
  AlertCircle,
  CheckCircle2,
  PencilLine,
  PlayCircle,
  RefreshCw,
  XCircle,
} from "../../../components/icons/AppIcons";
import { cn } from "../../../components/ui/utils";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardInsetBlockClassName,
} from "../../dashboard/components/DashboardPrimitives";
import type {
  GenerationState,
  ParsedSource,
  QuizBuilderCopy,
  ValidationIssue,
} from "../quizBuilderTypes";

interface QuizBuilderGenerateStageProps {
  contextValue: string;
  copy: QuizBuilderCopy;
  elapsedSeconds: number;
  generationDurationLabel: string | null;
  generationError: string | null;
  generationState: GenerationState;
  handleCancelGeneration: () => void;
  handleGenerateQuiz: () => void;
  handleOpenQuizFlow: (targetStatus: "draft") => void;
  handleRetryGeneration: () => void;
  mode: "teacher" | "student";
  parsedSource: ParsedSource | null;
  questionsCount: number;
  setGenerationState: (value: GenerationState) => void;
  setHasEnteredReview: (value: boolean) => void;
  validationIssues: ValidationIssue[];
}

const STEP_THRESHOLDS = [0, 30, 120] as const;
const TOTAL_ESTIMATE = 180;

function getStepState(stepIndex: number, elapsedSeconds: number) {
  const startAt = STEP_THRESHOLDS[stepIndex];
  const nextStart = STEP_THRESHOLDS[stepIndex + 1] ?? Infinity;
  if (elapsedSeconds < startAt) return "waiting";
  if (elapsedSeconds < nextStart) return "active";
  return "done";
}

export function QuizBuilderGenerateStage({
  contextValue,
  copy,
  elapsedSeconds,
  generationDurationLabel,
  generationError,
  generationState,
  handleCancelGeneration,
  handleGenerateQuiz,
  handleOpenQuizFlow,
  handleRetryGeneration,
  mode,
  parsedSource,
  questionsCount,
  setGenerationState,
  setHasEnteredReview,
  validationIssues,
}: QuizBuilderGenerateStageProps) {
  const steps = [
    { label: "Parsing source", sublabel: "Reading & chunking document" },
    { label: "Generating questions", sublabel: "AI building Q&A pairs" },
    { label: "Assembling draft", sublabel: "Formatting final output" },
  ];

  const progressPct = Math.min(96, (elapsedSeconds / TOTAL_ESTIMATE) * 100);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const elapsedLabel = minutes > 0
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <DashboardSurface
      asChild
      radius="xl"
      padding="lg"
      variant={generationState === "running" ? "accent" : "card"}
    >
      <section className="space-y-5">
        {generationState === "running" ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              {/* Pulsing icon */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{
                  position: "absolute",
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "rgba(91, 76, 240, 0.12)",
                  animation: "qb-pulse-outer 2.4s ease-in-out infinite",
                }} />
                <span style={{
                  position: "absolute",
                  width: 66,
                  height: 66,
                  borderRadius: "50%",
                  background: "rgba(91, 76, 240, 0.22)",
                  animation: "qb-pulse-inner 2.4s ease-in-out infinite 0.35s",
                }} />
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6d5ce7 0%, #a78bfa 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 24px rgba(109,92,231,0.5)",
                  animation: "qb-logo-breathe 2.4s ease-in-out infinite",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 1 8 8c0 3-1.5 5.5-4 7l-1 .7V20H9v-2.3L8 17C5.5 15.5 4 13 4 10a8 8 0 0 1 8-8z"/>
                    <line x1="9" y1="21" x2="15" y2="21"/>
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-[1.5rem] font-bold text-[var(--dashboard-text-strong)]">
                  Generating quiz draft
                </h2>
                <p className="mt-1 text-[15px] text-[var(--dashboard-text-soft)]">
                  AI is reading your source and building questions
                </p>
              </div>

              {/* Elapsed timer pill */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 999,
                background: "rgba(109,92,231,0.15)",
                border: "1px solid rgba(109,92,231,0.3)",
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#a78bfa",
                  animation: "qb-blink 1.2s ease-in-out infinite",
                  display: "inline-block",
                }} />
                <span className="text-sm font-semibold" style={{ color: "#a78bfa" }}>
                  {elapsedLabel} elapsed
                </span>
              </div>
            </div>

            {/* Progress card */}
            <div className="rounded-[24px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-6 py-6 shadow-[var(--dashboard-shadow-card)] space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--dashboard-text-faint)]">
                  <span>Progress</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div style={{
                  height: 8,
                  borderRadius: 999,
                  background: "var(--dashboard-surface-muted)",
                  overflow: "hidden",
                  position: "relative",
                }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #6d5ce7 0%, #a78bfa 60%, #c4b5fd 100%)",
                    transition: "width 1s linear",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* shimmer */}
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                      animation: "qb-shimmer 1.8s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="grid gap-3 md:grid-cols-3">
                {steps.map((step, index) => {
                  const state = getStepState(index, elapsedSeconds);
                  return (
                    <div
                      key={step.label}
                      className={cn(
                        "rounded-[18px] border px-4 py-4 transition-all duration-500",
                        state === "done"
                          ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]"
                          : state === "active"
                            ? "border-[var(--dashboard-brand)]/50 bg-[var(--dashboard-brand-soft-alt)]/40"
                            : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {state === "done" ? (
                          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[var(--dashboard-brand)]" />
                        ) : state === "active" ? (
                          <span style={{
                            display: "inline-block",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: "2px solid #a78bfa",
                            borderTopColor: "transparent",
                            animation: "spin 0.8s linear infinite",
                            flexShrink: 0,
                          }} />
                        ) : (
                          <span style={{
                            display: "inline-block",
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: "2px solid var(--dashboard-border)",
                            flexShrink: 0,
                          }} />
                        )}
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-semibold truncate",
                            state === "waiting"
                              ? "text-[var(--dashboard-text-faint)]"
                              : "text-[var(--dashboard-text-strong)]",
                          )}>
                            {step.label}
                          </p>
                          <p className="text-xs text-[var(--dashboard-text-faint)] truncate mt-0.5">
                            {step.sublabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dashboard-border-soft)] pt-4">
                <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                  Large PDFs can take 3–5 minutes. Your source is being processed securely.
                </p>
                <DashboardButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelGeneration}
                >
                  Cancel
                </DashboardButton>
              </div>
            </div>

            <style>{`
              @keyframes qb-pulse-outer {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.4); opacity: 0; }
              }
              @keyframes qb-pulse-inner {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.25); opacity: 0.15; }
              }
              @keyframes qb-logo-breathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.07); }
              }
              @keyframes qb-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
              @keyframes qb-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : null}

        {generationState === "cancelled" ? (
          <div className="rounded-[24px] border border-[var(--dashboard-warning)] bg-[var(--dashboard-warning-soft)]/60 px-5 py-5">
            <div className="flex items-center gap-3 text-[var(--dashboard-warning)]">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Generation paused</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Your source and settings are still in place. Restart generation whenever
              you are ready.
            </p>
            <div className="mt-5 flex gap-3">
              <DashboardButton type="button" size="lg" onClick={handleRetryGeneration}>
                <RefreshCw className="h-4.5 w-4.5" />
                Resume generation
              </DashboardButton>
              <DashboardButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setGenerationState("idle")}
              >
                Back to settings
              </DashboardButton>
            </div>
          </div>
        ) : null}

        {generationState === "failed" ? (
          <div className="rounded-[24px] border border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/50 px-5 py-5">
            <div className="flex items-center gap-3 text-[var(--dashboard-danger)]">
              <XCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                Quiz generation needs another attempt
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {generationError}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              No data was lost. Try reducing the number of questions or replacing weak
              source sections first.
            </p>
            <div className="mt-5 flex gap-3">
              <DashboardButton type="button" size="lg" onClick={handleRetryGeneration}>
                <RefreshCw className="h-4.5 w-4.5" />
                Retry
              </DashboardButton>
              <DashboardButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setGenerationState("idle")}
              >
                Back to settings
              </DashboardButton>
            </div>
          </div>
        ) : null}

        {generationState === "success" && questionsCount > 0 ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[var(--dashboard-success)]" />
                  <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
                    Quiz draft ready for review
                  </h2>
                </div>
                <p className="mt-3 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                  {copy.successDescription}
                </p>
              </div>
              <DashboardBadge
                tone={validationIssues.length > 0 ? "warning" : "success"}
                size="md"
              >
                {validationIssues.length > 0
                  ? "Needs review"
                  : mode === "student"
                    ? "Practice ready"
                    : "Ready to save"}
              </DashboardBadge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={dashboardInsetBlockClassName}>
                <p className="text-sm text-[var(--dashboard-text-soft)]">
                  Questions generated
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--dashboard-text-strong)]">
                  {questionsCount}
                </p>
              </div>
              <div className={dashboardInsetBlockClassName}>
                <p className="text-sm text-[var(--dashboard-text-soft)]">
                  {mode === "student" ? copy.contextLabel : "Source summary"}
                </p>
                <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                  {mode === "student" ? contextValue : parsedSource?.label}
                </p>
              </div>
              <div className={dashboardInsetBlockClassName}>
                <p className="text-sm text-[var(--dashboard-text-soft)]">
                  Generation time
                </p>
                <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                  {generationDurationLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <DashboardButton
                type="button"
                size="lg"
                variant={mode === "student" ? "primary" : "soft"}
                onClick={() => handleOpenQuizFlow("draft")}
              >
                <PlayCircle className="h-4.5 w-4.5" />
                {copy.launchLabel}
              </DashboardButton>
              <DashboardButton
                type="button"
                size="lg"
                variant={mode === "student" ? "secondary" : "primary"}
                onClick={() => {
                  setHasEnteredReview(true);
                }}
              >
                <PencilLine className="h-4.5 w-4.5" />
                {mode === "student" ? "Review Practice Set" : "Review Questions"}
              </DashboardButton>
              <DashboardButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleGenerateQuiz}
              >
                <RefreshCw className="h-4.5 w-4.5" />
                Regenerate
              </DashboardButton>
            </div>
          </>
        ) : null}
      </section>
    </DashboardSurface>
  );
}
