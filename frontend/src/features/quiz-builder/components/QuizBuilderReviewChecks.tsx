import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  XCircle,
} from "../../../components/icons/AppIcons";
import { cn } from "../../../components/ui/utils";
import type { QuizLibraryVisibility } from "../../dashboard/components/quiz-library/quizLibraryTypes";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardSelectVariants,
} from "../../dashboard/components/DashboardPrimitives";
import type {
  QuizBuilderCopy,
  QuizExportFormat,
  ValidationIssue,
} from "../quizBuilderTypes";

interface QuizBuilderReviewChecksProps {
  copy: QuizBuilderCopy;
  handleDownloadQuizExport: (format: QuizExportFormat) => void;
  handleGenerateQuiz: () => void;
  mode: "teacher" | "student";
  publishVisibility: QuizLibraryVisibility;
  setPublishVisibility: (value: QuizLibraryVisibility) => void;
  setSelectedQuestionId: (questionId: string) => void;
  validationIssues: ValidationIssue[];
}

export function QuizBuilderReviewChecks({
  copy,
  handleDownloadQuizExport,
  handleGenerateQuiz,
  mode,
  publishVisibility,
  setPublishVisibility,
  setSelectedQuestionId,
  validationIssues,
}: QuizBuilderReviewChecksProps) {
  const [exportFormat, setExportFormat] = useState<QuizExportFormat>("json");

  return (
    <DashboardSurface asChild radius="xl" padding="lg">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--dashboard-text-strong)]">
              {mode === "student" ? "Practice checks" : "Validation and publishing checks"}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-[var(--dashboard-text-soft)]">
              {mode === "student"
                ? "Use this panel to catch gaps, adjust visibility, and regenerate the draft when you want a cleaner practice set."
                : "Use this panel for visibility, exports, and a final quality check while the main actions stay in the top editor bar."}
            </p>
          </div>
          <DashboardBadge
            tone={validationIssues.length === 0 ? "success" : "warning"}
            size="md"
          >
            {validationIssues.length === 0
              ? "No blocking issues"
              : `${validationIssues.length} issues to review`}
          </DashboardBadge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            {validationIssues.length === 0 ? (
              <div className="rounded-[18px] border border-[var(--dashboard-success)] bg-[var(--dashboard-success-soft)]/55 px-4 py-4">
                <div className="flex items-center gap-3 text-[var(--dashboard-success)]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{copy.reviewReadyLabel}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                  {mode === "student"
                    ? "The set looks ready for personal practice. Start the self-test or save it to revisit later."
                    : "All questions have content and answer keys. You can still refine wording, but nothing critical is missing."}
                </p>
              </div>
            ) : (
              validationIssues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => {
                    setSelectedQuestionId(issue.questionId);
                  }}
                  className={cn(
                    "w-full rounded-[18px] border px-4 py-3 text-left transition",
                    issue.tone === "danger"
                      ? "border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/45"
                      : "border-[var(--dashboard-warning)] bg-[var(--dashboard-warning-soft)]/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {issue.tone === "danger" ? (
                      <XCircle className="h-4.5 w-4.5 text-[var(--dashboard-danger)]" />
                    ) : (
                      <AlertCircle className="h-4.5 w-4.5 text-[var(--dashboard-warning)]" />
                    )}
                    <span className="font-semibold text-[var(--dashboard-text-strong)]">
                      {issue.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                    {issue.detail}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="space-y-3">
            <label className="block space-y-2 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-3.5">
              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                {mode === "teacher" ? "Save Quiz visibility" : "Practice set visibility"}
              </span>
              <select
                value={publishVisibility}
                onChange={(event) =>
                  setPublishVisibility(event.target.value as QuizLibraryVisibility)
                }
                className={cn(
                  dashboardSelectVariants({ size: "md" }),
                  "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]",
                )}
              >
                <option value="private">Private</option>
                <option value="public">Public Library</option>
              </select>
              <p className="text-xs leading-5 text-[var(--dashboard-text-soft)]">
                {mode === "teacher"
                  ? "Private quizzes stay in your owner views. Public quizzes also appear in the shared library."
                  : "Private practice sets stay in your personal library. Public ones also appear in shared discovery."}
              </p>
            </label>

            <div className="space-y-2 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-3.5">
              <span className="block text-sm font-semibold text-[var(--dashboard-text-strong)]">
                Export quiz
              </span>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-1">
                <select
                  value={exportFormat}
                  onChange={(event) =>
                    setExportFormat(event.target.value as QuizExportFormat)
                  }
                  className={cn(
                    dashboardSelectVariants({ size: "md" }),
                    "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]",
                  )}
                  aria-label="Export quiz format"
                >
                  <option value="json">JSON backup</option>
                  <option value="txt">Readable text</option>
                  <option value="xml">Moodle XML</option>
                </select>
                <DashboardButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto xl:w-full"
                  onClick={() => handleDownloadQuizExport(exportFormat)}
                >
                  <Download className="h-4.5 w-4.5" />
                  Export
                </DashboardButton>
              </div>
            </div>

            <DashboardButton
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGenerateQuiz}
            >
              <RefreshCw className="h-4.5 w-4.5" />
              Regenerate
            </DashboardButton>
          </div>
        </div>
      </section>
    </DashboardSurface>
  );
}
