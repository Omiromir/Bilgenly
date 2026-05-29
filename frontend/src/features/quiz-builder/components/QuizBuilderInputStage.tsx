import type { ChangeEvent, RefObject } from "react";
import {
  FileText,
  LoaderCircle,
  Search,
  Upload,
  Wand2,
  XCircle,
} from "../../../components/icons/AppIcons";
import { cn } from "../../../components/ui/utils";
import {
  DashboardButton,
  DashboardSurface,
  dashboardInsetBlockClassName,
  dashboardTextareaVariants,
} from "../../dashboard/components/DashboardPrimitives";
import { QUIZ_BUILDER_LIMITS, clampText } from "../quizBuilderLimits";
import type { ParseStatus, QuizBuilderCopy } from "../quizBuilderTypes";

interface QuizBuilderInputStageProps {
  activeInput: "upload" | "paste";
  canParse: boolean;
  copy: QuizBuilderCopy;
  fileError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleMockGenerate?: () => void;
  handleOpenFilePicker: () => void;
  handleStartParsing: () => void;
  parseStatus: ParseStatus;
  pastedText: string;
  selectedFile: File | null;
  setActiveInput: (value: "upload" | "paste") => void;
  setParseStatus: (value: ParseStatus) => void;
  setParsedSource: (value: null) => void;
  setPastedText: (value: string) => void;
}

export function QuizBuilderInputStage({
  activeInput,
  canParse,
  copy,
  fileError,
  fileInputRef,
  handleFileChange,
  handleMockGenerate,
  handleOpenFilePicker,
  handleStartParsing,
  parseStatus,
  pastedText,
  selectedFile,
  setActiveInput,
  setParseStatus,
  setParsedSource,
  setPastedText,
}: QuizBuilderInputStageProps) {
  const isDev = import.meta.env.DEV;
  return (
    <DashboardSurface asChild radius="xl" padding="lg">
      <section className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
              Input source
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
              {copy.inputDescription}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveInput("upload")}
            className={cn(
              dashboardInsetBlockClassName,
              "text-left transition",
              activeInput === "upload" &&
                "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]",
            )}
          >
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-[var(--dashboard-brand)]" />
              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                Upload PDF
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Best for lecture slides, reading packets, or lab handouts.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveInput("paste")}
            className={cn(
              dashboardInsetBlockClassName,
              "text-left transition",
              activeInput === "paste" &&
                "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]",
            )}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[var(--dashboard-brand)]" />
              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                Paste lecture text
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Useful for notes, transcripts, summaries, or copied reading passages.
            </p>
          </button>
        </div>

        {activeInput === "upload" ? (
          <div
            className={cn(
              "rounded-[28px] border border-dashed px-6 py-10 text-center transition",
              fileError
                ? "border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/50"
                : "border-[var(--dashboard-border)] bg-[var(--dashboard-surface-muted)]",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--dashboard-brand)] shadow-sm">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-[1.2rem] font-semibold text-[var(--dashboard-text-strong)]">
              Drag and drop a PDF here
            </h3>
            <p className="mt-2 text-sm text-[var(--dashboard-text-soft)]">
              Or choose a file manually. Accepted format: PDF up to 50 MB.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <DashboardButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleOpenFilePicker}
              >
                Choose PDF
              </DashboardButton>
              <DashboardButton
                type="button"
                size="lg"
                onClick={handleStartParsing}
                disabled={!canParse}
              >
                <Search className="h-4.5 w-4.5" />
                Continue
              </DashboardButton>
            </div>
            {selectedFile ? (
              <p className="mt-4 text-sm font-medium text-[var(--dashboard-text-strong)]">
                Selected: {selectedFile.name}
              </p>
            ) : null}
            {fileError ? (
              <p className="mt-4 text-sm font-medium text-[var(--dashboard-danger)]">
                {fileError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={pastedText}
              onChange={(event) => {
                setPastedText(
                  clampText(event.target.value, QUIZ_BUILDER_LIMITS.pastedText),
                );
                setParseStatus("idle");
                setParsedSource(null);
              }}
              maxLength={QUIZ_BUILDER_LIMITS.pastedText}
              placeholder="Paste your lecture notes, article excerpt, or teaching summary here."
              className={dashboardTextareaVariants({ size: "lg" })}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--dashboard-text-soft)]">
                Minimum 180 characters. {pastedText.length}/{QUIZ_BUILDER_LIMITS.pastedText}
                {" "}characters used.
              </p>
              <div className="flex gap-3">
                <DashboardButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setPastedText("")}
                >
                  Clear
                </DashboardButton>
                <DashboardButton
                  type="button"
                  size="lg"
                  onClick={handleStartParsing}
                  disabled={!canParse}
                >
                  <Search className="h-4.5 w-4.5" />
                  Continue
                </DashboardButton>
              </div>
            </div>
          </div>
        )}

        {parseStatus === "processing" ? (
          <div className="rounded-[24px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-5">
            <div className="flex items-center gap-3 text-[var(--dashboard-text-strong)]">
              <LoaderCircle className="h-5 w-5 animate-spin text-[var(--dashboard-brand)]" />
              <span className="font-semibold">Parsing and chunking the source</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Bilgenly is extracting the most useful parts of the lecture so the next
              step can open with a clean preview and generation setup.
            </p>
          </div>
        ) : null}

        {parseStatus === "error" ? (
          <div className="rounded-[24px] border border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/50 px-5 py-5">
            <div className="flex items-center gap-3 text-[var(--dashboard-danger)]">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">We could not parse enough content</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Add more lecture text or upload a fuller PDF. Nothing was lost, and
              you can retry immediately.
            </p>
          </div>
        ) : null}

        {isDev && handleMockGenerate ? (
          <div className="rounded-[20px] border border-dashed border-amber-400/60 bg-amber-50/60 px-4 py-3 dark:border-amber-500/40 dark:bg-amber-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  DEV
                </span>
                <span className="text-sm font-medium">
                  Skip source — generate with mock data
                </span>
              </div>
              <button
                type="button"
                onClick={handleMockGenerate}
                className="flex items-center gap-1.5 rounded-[10px] border border-amber-400/50 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-400/25 active:scale-[0.97] dark:text-amber-400"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Instant mock quiz
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </DashboardSurface>
  );
}
