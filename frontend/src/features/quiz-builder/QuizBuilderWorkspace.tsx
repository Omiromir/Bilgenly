import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Download,
  FileJson,
  FileText,
  LoaderCircle,
  PencilLine,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  ScanSearch,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { useQuizLibrary } from "../../app/providers/QuizLibraryProvider";
import { cn } from "../../components/ui/utils";
import { DashboardPageHeader } from "../dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardPageCenteredClassName,
  dashboardSelectVariants,
  dashboardTextareaVariants,
} from "../dashboard/components/DashboardPrimitives";
import type {
  QuizDifficulty,
  QuizLibraryStatus,
  QuizLibraryVisibility,
  QuizQuestionRecord,
} from "../dashboard/components/quiz-library/quizLibraryTypes";

type InputMethod = "upload" | "paste";
type ParseStatus = "idle" | "processing" | "ready" | "warning" | "error";
type GenerationState = "idle" | "running" | "success" | "failed" | "cancelled";
type QuestionType = "Multiple choice" | "True/False" | "Short answer";
type QuestionStatus = "unreviewed" | "edited" | "needs attention";
type WorkspaceStage = "input" | "configure" | "generate" | "review";

interface ParsedSource {
  label: string;
  lengthLabel: string;
  pageEstimate: string;
  characterCount: number;
  extractedText: string;
  warning?: string;
}

interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  status: QuestionStatus;
}

interface ValidationIssue {
  id: string;
  questionId: string;
  tone: "warning" | "danger";
  label: string;
  detail: string;
}

const quizSteps = [
  { key: "upload", label: "Upload" },
  { key: "configure", label: "Configure" },
  { key: "generate", label: "Generate" },
  { key: "review", label: "Review" },
] as const;

const questionTypeOptions: QuestionType[] = [
  "Multiple choice",
  "True/False",
  "Short answer",
];

const classOptions = [
  "Science 10A",
  "Biology Lab",
  "Intro to Programming",
  "Independent study",
];

const studentGoalOptions = [
  "Exam revision",
  "Topic drill",
  "Quick self-check",
  "Deep practice",
];

interface QuizBuilderWorkspaceProps {
  mode: "teacher" | "student";
  title: string;
  subtitle: string;
}

const workspaceCopy = {
  teacher: {
    badge: "Core MVP flow",
    inputDescription:
      "Start with a PDF or paste lecture text. The next step replaces this view with source review and quiz settings.",
    configureDescription:
      "Confirm the extracted source, then set only the quiz options that matter for the first draft.",
    contextLabel: "Class label",
    contextOptions: classOptions,
    defaultContextValue: classOptions[0],
    defaultInstructions:
      "Prioritize conceptual clarity and keep wording friendly for secondary school students.",
    successDescription:
      "The generation stage is complete. Move to review to edit wording, fix issues, and finalize the quiz before saving.",
    reviewReadyLabel: "The draft is ready for teacher use",
    saveLabel: "Save Draft",
    publishLabel: "Save Quiz",
    runLabel: "Assign Quiz",
  },
  student: {
    badge: "Self-learning flow",
    inputDescription:
      "Start with your notes, reading summary, or revision material. The next step replaces this view with a study-focused setup.",
    configureDescription:
      "Check the extracted source, then tailor the quiz for solo practice and revision rather than classroom delivery.",
    contextLabel: "Study goal",
    contextOptions: studentGoalOptions,
    defaultContextValue: studentGoalOptions[0],
    defaultInstructions:
      "Keep the wording encouraging, build confidence early, and make the quiz useful for self-checking without teacher guidance.",
    successDescription:
      "Your self-study draft is ready. Move to review to refine questions, remove weak items, and finalize the practice set.",
    reviewReadyLabel: "The draft is ready for self-study",
    saveLabel: "Save Draft",
    publishLabel: "Save Quiz",
    runLabel: "Start Self-Test",
  },
} as const;

function createQuestionId() {
  return Math.random().toString(36).slice(2, 9);
}

function buildMockExtract(sourceLabel: string) {
  return `Lecture material summary from ${sourceLabel}: Proteins are formed from amino acids linked by peptide bonds. The structure of a protein depends on the sequence of amino acids, the interactions between side chains, and the surrounding environment. Enzymes speed up reactions by lowering activation energy, and their activity can be affected by temperature and pH. Students should distinguish covalent, ionic, and hydrogen bonds, then explain why peptide bonds are unique in biological macromolecules.`;
}

function buildGeneratedQuestions(
  title: string,
  focus: string,
  requestedCount: number,
): GeneratedQuestion[] {
  const focusLabel = focus || "the uploaded lecture";
  const difficultyPrompt = "is most accurate";

  const templates = [
    `Which statement ${difficultyPrompt} about ${focusLabel}?`,
    `Why is peptide bonding important in ${focusLabel}?`,
    `Which example from ${focusLabel} would students most likely classify correctly?`,
    `What explanation should students give after reviewing ${focusLabel}?`,
    `Which misunderstanding is most likely if a learner only skims ${focusLabel}?`,
    `How would you apply the central concept from ${focusLabel} in a new scenario?`,
  ];

  return Array.from({ length: requestedCount }, (_, index) => ({
    id: createQuestionId(),
    text:
      index === 0
        ? `What type of bond forms between amino acids in proteins for ${title || "this quiz"}?`
        : templates[index % templates.length],
    options:
      index === 0
        ? ["Ionic bond", "Hydrogen bond", "Peptide bond", "Covalent bond"]
        : [
            "It supports the core concept described in the lecture.",
            "It contradicts the source material.",
            "It only applies in unrelated contexts.",
            "It is not addressed by the lecture material.",
          ],
    correctIndex: 2,
    status: index < 2 ? "unreviewed" : "needs attention",
  }));
}

function getQuestionStatusTone(status: QuestionStatus) {
  if (status === "edited") {
    return "success";
  }
  if (status === "needs attention") {
    return "warning";
  }
  return "neutral";
}

function getQuizDifficulty(questionCount: number): QuizDifficulty {
  if (questionCount <= 8) {
    return "Beginner";
  }

  if (questionCount <= 12) {
    return "Intermediate";
  }

  return "Advanced";
}

function buildQuizDescription(sourceText: string, focus: string) {
  const summary = sourceText.trim().replace(/\s+/g, " ");
  const excerpt = summary.slice(0, 148).trimEnd();

  if (!summary) {
    return focus
      ? `AI-generated quiz focused on ${focus}.`
      : "AI-generated quiz built from the provided source material.";
  }

  return `${excerpt}${summary.length > 148 ? "..." : ""}`;
}

export function QuizBuilderWorkspace({
  mode,
  title,
  subtitle,
}: QuizBuilderWorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuizById, saveGeneratedQuiz } = useQuizLibrary();
  const copy = workspaceCopy[mode];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeInput, setActiveInput] = useState<InputMethod>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parsedSource, setParsedSource] = useState<ParsedSource | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(8);
  const [focus, setFocus] = useState("Protein structure");
  const [language, setLanguage] = useState("English");
  const [contextValue, setContextValue] = useState(copy.defaultContextValue);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    "Multiple choice",
    "True/False",
  ]);
  const [instructions, setInstructions] = useState(copy.defaultInstructions);
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [hasEnteredReview, setHasEnteredReview] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationDurationLabel, setGenerationDurationLabel] = useState<
    string | null
  >(null);
  const [questionSeed, setQuestionSeed] = useState(0);
  const [publishVisibility, setPublishVisibility] =
    useState<QuizLibraryVisibility>("private");
  const editingQuizId = location.state?.editQuizId as string | undefined;
  const editingQuiz = editingQuizId ? getQuizById(editingQuizId) : undefined;

  const canParse =
    (activeInput === "upload" && selectedFile !== null) ||
    (activeInput === "paste" && pastedText.trim().length >= 180);
  const canGenerate =
    (parseStatus === "ready" || parseStatus === "warning") &&
    (mode === "teacher"
      ? questionTypes.length > 0 && quizTitle.trim().length > 0
      : true) &&
    generationState !== "running";
  const resolvedQuizTitle =
    quizTitle.trim() || (mode === "student" ? `${focus || "Personal"} Practice Quiz` : "");
  const selectedQuestion =
    questions.find((question) => question.id === selectedQuestionId) ??
    questions[0] ??
    null;
  const workspaceStage: WorkspaceStage =
    hasEnteredReview && questions.length > 0
      ? "review"
      : generationState === "running" ||
          generationState === "success" ||
          generationState === "failed" ||
          generationState === "cancelled"
        ? "generate"
        : parsedSource
          ? "configure"
          : "input";
  const currentStepIndex = {
    input: 0,
    configure: 1,
    generate: 2,
    review: 3,
  }[workspaceStage];

  useEffect(() => {
    if (!editingQuiz || editingQuiz.ownerRole !== mode) {
      return;
    }

    setQuizTitle(editingQuiz.title);
    setQuestionCount(editingQuiz.questionCount);
    setFocus(editingQuiz.topic);
    setLanguage(editingQuiz.language);
    setPublishVisibility(editingQuiz.visibility);
    setQuestions(
      editingQuiz.questions.map((question) => ({
        ...question,
        options: [...question.options],
        status: "edited",
      })),
    );
    setSelectedQuestionId(editingQuiz.questions[0]?.id ?? null);
    setParsedSource({
      label: editingQuiz.sourceLabel,
      lengthLabel: `${editingQuiz.questionCount} saved questions`,
      pageEstimate: `${editingQuiz.durationMinutes} min estimated`,
      characterCount: editingQuiz.description.length,
      extractedText: editingQuiz.description,
    });
    setParseStatus("ready");
    setGenerationState("success");
    setHasEnteredReview(true);
    setGenerationError(null);
  }, [editingQuiz, mode]);

  useEffect(() => {
    if (parseStatus !== "processing") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const sourceText =
        activeInput === "paste"
          ? pastedText.trim()
          : buildMockExtract(selectedFile?.name ?? "lecture-notes.pdf");

      if (sourceText.length < 180) {
        setParseStatus("error");
        setParsedSource(null);
        return;
      }

      const characterCount = sourceText.length;
      const warning =
        sourceText.length < 420
          ? "A few sections looked sparse. The quiz can still be generated, but review wording and coverage carefully."
          : undefined;

      setParsedSource({
        label:
          activeInput === "upload"
            ? (selectedFile?.name ?? "Uploaded source")
            : "Pasted lecture text",
        lengthLabel:
          activeInput === "upload"
            ? `${Math.max(1, Math.round((selectedFile?.size ?? 0) / 1024 / 1024))} MB source`
            : `${Math.ceil(characterCount / 6)} words estimated`,
        pageEstimate: `${Math.max(1, Math.ceil(characterCount / 1600))} pages estimated`,
        characterCount,
        extractedText: sourceText,
        warning,
      });
      setParseStatus(warning ? "warning" : "ready");
      setGenerationState("idle");
      setGenerationError(null);
      setQuestions([]);
      setSelectedQuestionId(null);
      setHasEnteredReview(false);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [activeInput, parseStatus, pastedText, selectedFile]);

  useEffect(() => {
    if (generationState !== "running") {
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      const shouldFail = parseStatus === "warning" && questionCount > 12;

      if (shouldFail) {
        setGenerationState("failed");
        setGenerationError(
          "Bilgenly could not assemble a reliable quiz draft from the current source. Your material and settings are still here, so you can adjust them and retry.",
        );
        return;
      }

      const generated = buildGeneratedQuestions(
        resolvedQuizTitle,
        focus,
        questionCount,
      );
      setQuestions(generated);
      setSelectedQuestionId(generated[0]?.id ?? null);
      setGenerationState("success");
      setHasEnteredReview(false);
      setGenerationDurationLabel(
        `${Math.max(12, Math.floor((Date.now() - startedAt) / 1000) + 12)} sec`,
      );
      setQuestionSeed((value) => value + 1);
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [focus, generationState, parseStatus, questionCount, resolvedQuizTitle]);

  const validationIssues: ValidationIssue[] = questions.flatMap(
    (question, index, allQuestions) => {
      const issues: ValidationIssue[] = [];
      const normalizedOptions = question.options.map((option) =>
        option.trim().toLowerCase(),
      );
      const duplicateOptionCount =
        new Set(normalizedOptions).size !== normalizedOptions.length;
      const duplicateQuestion = allQuestions.some(
        (candidate) =>
          candidate.id !== question.id &&
          candidate.text.trim().toLowerCase() ===
            question.text.trim().toLowerCase(),
      );

      if (!question.text.trim()) {
        issues.push({
          id: `${question.id}-missing-text`,
          questionId: question.id,
          tone: "danger",
          label: `Question ${index + 1} is empty`,
          detail:
            "Add question wording before exporting or assigning the quiz.",
        });
      }

      if (
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      ) {
        issues.push({
          id: `${question.id}-missing-answer`,
          questionId: question.id,
          tone: "danger",
          label: `Question ${index + 1} has no correct answer`,
          detail:
            "Choose one correct option so students can be graded accurately.",
        });
      }

      if (duplicateOptionCount) {
        issues.push({
          id: `${question.id}-duplicate-options`,
          questionId: question.id,
          tone: "warning",
          label: `Question ${index + 1} repeats answer options`,
          detail: "Use distinct answer choices to avoid confusing students.",
        });
      }

      if (duplicateQuestion) {
        issues.push({
          id: `${question.id}-duplicate-question`,
          questionId: question.id,
          tone: "warning",
          label: `Question ${index + 1} overlaps another question`,
          detail: "Consider merging or rewording to reduce repetition.",
        });
      }

      return issues;
    },
  );

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isTooLarge = file.size > 50 * 1024 * 1024;

    if (!isPdf) {
      setFileError("Only PDF files are supported for the current MVP flow.");
      setSelectedFile(null);
      setParseStatus("idle");
      setParsedSource(null);
      return;
    }

    if (isTooLarge) {
      setFileError("This file exceeds the 50 MB upload limit.");
      setSelectedFile(null);
      setParseStatus("idle");
      setParsedSource(null);
      return;
    }

    setActiveInput("upload");
    setSelectedFile(file);
    setFileError(null);
    setGenerationState("idle");
    setParseStatus("idle");
    setParsedSource(null);
  }

  function handleStartParsing() {
    if (!canParse) {
      return;
    }

    setParseStatus("processing");
    setParsedSource(null);
    setGenerationState("idle");
    setQuestions([]);
    setGenerationError(null);
    setHasEnteredReview(false);
  }

  function handleReplaceSource() {
    setSelectedFile(null);
    setPastedText("");
    setParsedSource(null);
    setParseStatus("idle");
    setGenerationState("idle");
    setQuestions([]);
    setGenerationError(null);
    setSelectedQuestionId(null);
    setHasEnteredReview(false);
  }

  function toggleQuestionType(type: QuestionType) {
    setQuestionTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }

  function handleGenerateQuiz() {
    if (!canGenerate) {
      return;
    }

    setQuestions([]);
    setSelectedQuestionId(null);
    setGenerationState("running");
    setGenerationError(null);
    setGenerationDurationLabel(null);
    setHasEnteredReview(false);
  }

  function handleCancelGeneration() {
    setGenerationState("cancelled");
    setGenerationError(null);
  }

  function handleRetryGeneration() {
    setGenerationState("running");
    setGenerationError(null);
    setGenerationDurationLabel(null);
  }

  function handleQuestionChange(
    questionId: string,
    updater: (question: GeneratedQuestion) => GeneratedQuestion,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...updater(question), status: "edited" }
          : question,
      ),
    );
  }

  function handleMoveQuestion(questionId: string, direction: "up" | "down") {
    setQuestions((current) => {
      const currentIndex = current.findIndex(
        (question) => question.id === questionId,
      );
      if (currentIndex === -1) {
        return current;
      }

      const nextIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const reordered = [...current];
      const [question] = reordered.splice(currentIndex, 1);
      reordered.splice(nextIndex, 0, question);
      return reordered;
    });
  }

  function handleDuplicateQuestion(questionId: string) {
    setQuestions((current) => {
      const source = current.find((question) => question.id === questionId);
      if (!source) {
        return current;
      }

      return [
        ...current,
        {
          ...source,
          id: createQuestionId(),
          text: `${source.text} (copy)`,
          status: "edited",
        },
      ];
    });
  }

  function handleDeleteQuestion(questionId: string) {
    const remaining = questions.filter(
      (question) => question.id !== questionId,
    );
    setQuestions(remaining);

    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(remaining[0]?.id ?? null);
    }
  }

  function handleRegenerateQuestion(questionId: string) {
    handleQuestionChange(questionId, (question) => ({
      ...question,
      text: `${question.text.replace(/\s+\(refined\)$/u, "")} (refined)`,
      options: [
        question.options[0],
        question.options[1],
        `Updated answer aligned with ${focus || "the selected focus"}`,
        question.options[3] ?? "None of the above",
      ],
      correctIndex: 2,
      status: "edited",
    }));
  }

  function handleAddQuestion() {
    const newQuestion: GeneratedQuestion = {
      id: createQuestionId(),
      text: "New question prompt",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0,
      status: "edited",
    };

    setQuestions((current) => [...current, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setHasEnteredReview(true);
  }

  function handleSaveQuiz(targetStatus: QuizLibraryStatus) {
    if (!parsedSource || questions.length === 0) {
      return;
    }

    const normalizedQuestions: QuizQuestionRecord[] = questions.map(
      (question) => ({
        id: question.id,
        text: question.text.trim(),
        options: question.options.map((option) => option.trim()),
        correctIndex: question.correctIndex,
      }),
    );
    const topic = focus.trim() || "General review";
    const durationMinutes = Math.max(2, Math.ceil(normalizedQuestions.length * 0.8));
    const visibility =
      targetStatus === "published-public" ? "public" : "private";

    saveGeneratedQuiz({
      existingQuizId: editingQuiz?.id,
      ownerRole: mode,
      title: resolvedQuizTitle,
      description: buildQuizDescription(parsedSource.extractedText, topic),
      topic,
      difficulty: getQuizDifficulty(normalizedQuestions.length),
      language,
      status: targetStatus,
      visibility,
      tags: Array.from(
        new Set(
          [
            topic,
            contextValue,
            ...questionTypes,
          ].filter((value): value is string => value.trim().length > 0),
        ),
      ),
      sourceLabel:
        mode === "teacher"
          ? `Generated from ${parsedSource.label}`
          : `Built from ${parsedSource.label.toLowerCase()}`,
      note:
        targetStatus === "published-public"
          ? "Published to the public library from the generation workflow."
          : targetStatus === "published-private"
            ? "Saved privately and visible only in your library views."
            : mode === "student"
              ? "Saved to your personal quiz library for later practice."
              : "Saved as a draft in your quiz library for later review.",
      questionCount: normalizedQuestions.length,
      durationMinutes,
      questions: normalizedQuestions,
      practiceState: mode === "student" ? "ready" : undefined,
    });

    navigate(
      mode === "teacher"
        ? "/dashboard/teacher/quiz-library"
        : "/dashboard/student/quiz-library",
      {
        state: {
          libraryTab:
            mode === "teacher"
              ? targetStatus === "draft"
                ? "drafts"
                : "my-quizzes"
              : targetStatus === "draft"
                ? "drafts"
                : "my-quizzes",
        },
      },
    );
  }

  function handleCancelCreation() {
    navigate(
      mode === "teacher"
        ? "/dashboard/teacher/quiz-library"
        : "/dashboard/student/quiz-library",
      {
        state: {
          libraryTab: "drafts",
        },
      },
    );
  }

  return (
    <div className={dashboardPageCenteredClassName}>
      <DashboardPageHeader
        title={title}
        subtitle={subtitle}
        align="center"
      />

      <div className="flex flex-wrap items-center justify-center gap-4">
        {quizSteps.map((item, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;

          return (
            <div key={item.key} className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                    isActive && "bg-[var(--dashboard-brand)] text-white",
                    isComplete &&
                      "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]",
                    !isActive &&
                      !isComplete &&
                      "bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-[1.02rem]",
                    isActive && "font-medium text-[var(--dashboard-brand)]",
                    isComplete && "font-medium text-[var(--dashboard-success)]",
                    !isActive &&
                      !isComplete &&
                      "text-[var(--dashboard-text-soft)]",
                  )}
                >
                  {item.label}
                </span>
              </div>
              {index < quizSteps.length - 1 ? (
                <ChevronRight className="h-5 w-5 text-[var(--dashboard-text-faint)]" />
              ) : null}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={workspaceStage}
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {workspaceStage === "input" ? (
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
                      Useful for notes, transcripts, summaries, or copied
                      reading passages.
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
                      Or choose a file manually. Accepted format: PDF up to 50
                      MB.
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
                        <ScanSearch className="h-4.5 w-4.5" />
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
                        setPastedText(event.target.value);
                        setParseStatus("idle");
                        setParsedSource(null);
                      }}
                      placeholder="Paste your lecture notes, article excerpt, or teaching summary here."
                      className={dashboardTextareaVariants({ size: "lg" })}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-[var(--dashboard-text-soft)]">
                        Minimum 180 characters. Your original text stays
                        preserved if generation fails.
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
                          <ScanSearch className="h-4.5 w-4.5" />
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
                      <span className="font-semibold">
                        Parsing and chunking the source
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      Bilgenly is extracting the most useful parts of the
                      lecture so the next step can open with a clean preview and
                      generation setup.
                    </p>
                  </div>
                ) : null}

                {parseStatus === "error" ? (
                  <div className="rounded-[24px] border border-[var(--dashboard-danger)] bg-[var(--dashboard-danger-soft)]/50 px-5 py-5">
                    <div className="flex items-center gap-3 text-[var(--dashboard-danger)]">
                      <XCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        We could not parse enough content
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      Add more lecture text or upload a fuller PDF. Nothing was
                      lost, and you can retry immediately.
                    </p>
                  </div>
                ) : null}
              </section>
            </DashboardSurface>
          ) : null}

          {workspaceStage === "configure" ? (
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

                <div className="grid gap-4 md:grid-cols-3">
                  <div className={dashboardInsetBlockClassName}>
                    <p className="text-sm text-[var(--dashboard-text-soft)]">
                      Source
                    </p>
                    <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                      {parsedSource?.label}
                    </p>
                  </div>
                  <div className={dashboardInsetBlockClassName}>
                    <p className="text-sm text-[var(--dashboard-text-soft)]">
                      Estimated length
                    </p>
                    <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                      {parsedSource?.lengthLabel}
                    </p>
                  </div>
                  <div className={dashboardInsetBlockClassName}>
                    <p className="text-sm text-[var(--dashboard-text-soft)]">
                      Coverage
                    </p>
                    <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                      {parsedSource?.pageEstimate}
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="col-span-1 lg:col-span-2 w-full rounded-[24px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-5">
                    {" "}
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-[var(--dashboard-text-strong)]">
                        Extracted text preview
                      </h3>
                      <span className="text-sm text-[var(--dashboard-text-soft)]">
                        {parsedSource?.characterCount} characters
                      </span>
                    </div>
                    <p className="mt-4 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                      {parsedSource?.extractedText}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {parsedSource?.warning ? (
                      <div className="rounded-[24px] border border-[var(--dashboard-warning)] bg-[var(--dashboard-warning-soft)]/60 px-5 py-5">
                        <div className="flex items-center gap-3 text-[var(--dashboard-warning)]">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-semibold">
                            Some content may need a quick review
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          {parsedSource.warning}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      {mode === "student" ? "Quiz title (optional)" : "Quiz title"}
                    </span>
                    <input
                      value={quizTitle}
                      onChange={(event) => setQuizTitle(event.target.value)}
                      placeholder={
                        mode === "student"
                          ? "Auto-generate from my study topic"
                          : "Cell Structure Review Quiz"
                      }
                      className={dashboardInputVariants({ size: "lg" })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      {copy.contextLabel}
                    </span>
                    <select
                      value={contextValue}
                      onChange={(event) => setContextValue(event.target.value)}
                      className={cn(
                        dashboardSelectVariants({ size: "md" }),
                        "w-full",
                      )}
                    >
                      {copy.contextOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      Number of questions
                    </span>
                    <select
                      value={questionCount}
                      onChange={(event) =>
                        setQuestionCount(Number(event.target.value))
                      }
                      className={cn(
                        dashboardSelectVariants({ size: "md" }),
                        "w-full",
                      )}
                    >
                      {[5, 8, 10, 12, 15].map((value) => (
                        <option key={value} value={value}>
                          {value} questions
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      Topic focus
                    </span>
                    <input
                      value={focus}
                      onChange={(event) => setFocus(event.target.value)}
                      placeholder="Protein structure"
                      className={dashboardInputVariants({ size: "md" })}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                      Language
                    </span>
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      className={cn(
                        dashboardSelectVariants({ size: "md" }),
                        "w-full",
                      )}
                    >
                      <option>English</option>
                      <option>Kazakh</option>
                      <option>Russian</option>
                    </select>
                  </label>
                </div>

                {mode === "teacher" ? (
                  <>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                        Question type mix
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {questionTypeOptions.map((type) => {
                          const checked = questionTypes.includes(type);
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleQuestionType(type)}
                              className={cn(
                                "rounded-full border px-4 py-2 text-sm font-medium transition",
                                checked
                                  ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]"
                                  : "border-[var(--dashboard-border)] text-[var(--dashboard-text-soft)] hover:bg-[var(--dashboard-surface-muted)]",
                              )}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                        Additional instructions
                      </span>
                      <textarea
                        value={instructions}
                        onChange={(event) => setInstructions(event.target.value)}
                        className={dashboardTextareaVariants({ size: "md" })}
                      />
                    </label>
                  </>
                ) : null}

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
          ) : null}

          {workspaceStage === "generate" ? (
            <DashboardSurface
              asChild
              radius="xl"
              padding="lg"
              variant={generationState === "running" ? "accent" : "card"}
            >
              <section className="space-y-5">
                {generationState === "running" ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
                          Generating quiz draft
                        </h2>
                        <p className="mt-2 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                          Bilgenly is parsing, generating, and assembling the
                          draft. This stage replaces configuration until the
                          draft is ready.
                        </p>
                      </div>
                      <DashboardBadge tone="brand" size="md">
                        {elapsedSeconds}s elapsed
                      </DashboardBadge>
                    </div>

                    <div className="space-y-4 rounded-[24px] bg-white px-5 py-5 shadow-sm">
                      <div className="h-3 overflow-hidden rounded-full bg-[var(--dashboard-surface-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--dashboard-brand)] transition-all"
                          style={{
                            width: `${Math.min(96, 24 + elapsedSeconds * 18)}%`,
                          }}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          {
                            label: "Parsing source",
                            ready: elapsedSeconds >= 1,
                          },
                          {
                            label: "Generating questions",
                            ready: elapsedSeconds >= 2,
                          },
                          {
                            label: "Assembling draft",
                            ready: elapsedSeconds >= 3,
                          },
                        ].map((step) => (
                          <div
                            key={step.label}
                            className={cn(
                              "rounded-[18px] border px-4 py-4",
                              step.ready
                                ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]"
                                : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {step.ready ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-[var(--dashboard-brand)]" />
                              ) : (
                                <LoaderCircle className="h-4.5 w-4.5 animate-spin text-[var(--dashboard-text-faint)]" />
                              )}
                              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                {step.label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          The AI is assistive here. You will still review
                          wording, correctness, and student readability before
                          the quiz is used.
                        </p>
                        <DashboardButton
                          type="button"
                          variant="ghost"
                          size="lg"
                          onClick={handleCancelGeneration}
                        >
                          Cancel
                        </DashboardButton>
                      </div>
                    </div>
                  </>
                ) : null}

                {generationState === "cancelled" ? (
                  <div className="rounded-[24px] border border-[var(--dashboard-warning)] bg-[var(--dashboard-warning-soft)]/60 px-5 py-5">
                    <div className="flex items-center gap-3 text-[var(--dashboard-warning)]">
                      <AlertCircle className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">
                        Generation paused
                      </h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      Your source and settings are still in place. Restart
                      generation whenever you are ready.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <DashboardButton
                        type="button"
                        size="lg"
                        onClick={handleRetryGeneration}
                      >
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
                      No data was lost. Try reducing the number of questions or
                      replacing weak source sections first.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <DashboardButton
                        type="button"
                        size="lg"
                        onClick={handleRetryGeneration}
                      >
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

                {generationState === "success" && questions.length > 0 ? (
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
                        tone={
                          validationIssues.length > 0 ? "warning" : "success"
                        }
                        size="md"
                      >
                        {validationIssues.length > 0
                          ? "Needs review"
                          : mode === "student"
                            ? "Practice ready"
                            : "Ready to save"}
                      </DashboardBadge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className={dashboardInsetBlockClassName}>
                        <p className="text-sm text-[var(--dashboard-text-soft)]">
                          Questions generated
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--dashboard-text-strong)]">
                          {questions.length}
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
                      <div className={dashboardInsetBlockClassName}>
                        <p className="text-sm text-[var(--dashboard-text-soft)]">
                          Language
                        </p>
                        <p className="mt-2 font-semibold text-[var(--dashboard-text-strong)]">
                          {language}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {mode === "student" ? (
                        <DashboardButton
                          type="button"
                          size="lg"
                          onClick={() => {
                            setHasEnteredReview(true);
                          }}
                        >
                          <PlayCircle className="h-4.5 w-4.5" />
                          Start Practice
                        </DashboardButton>
                      ) : null}
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
          ) : null}

          {workspaceStage === "review" ? (
            <div className="space-y-6">
              <DashboardSurface asChild radius="xl" padding="lg">
                <section className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
                        {mode === "student" ? "Practice-ready review" : "Question review"}
                      </h2>
                      <p className="mt-2 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                        {mode === "student"
                          ? "Scan the generated practice set, adjust anything you want, then start a personal self-test."
                          : "Review, edit, reorder, or regenerate individual questions without leaving the page."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <DashboardButton
                        type="button"
                        variant="secondary"
                        size="lg"
                        onClick={handleAddQuestion}
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Add Question
                      </DashboardButton>
                      {mode === "student" ? (
                        <DashboardButton
                          type="button"
                          size="lg"
                          onClick={() => handleSaveQuiz("draft")}
                        >
                          <PlayCircle className="h-4.5 w-4.5" />
                          Start Practice
                        </DashboardButton>
                      ) : null}
                      <DashboardButton
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          setHasEnteredReview(false);
                        }}
                      >
                        Back to result
                      </DashboardButton>
                      <DashboardButton
                        type="button"
                        variant="ghost"
                        size="lg"
                        onClick={handleCancelCreation}
                      >
                        {editingQuiz ? "Cancel Editing" : "Cancel Creation"}
                      </DashboardButton>
                    </div>
                  </div>
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
                      <div className="space-y-4">
                        {questions.map((question, index) => (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => setSelectedQuestionId(question.id)}
                            className={cn(
                              "w-full rounded-[24px] border px-5 py-5 text-left transition",
                              selectedQuestion?.id === question.id
                                ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]"
                                : "border-[var(--dashboard-border-soft)] bg-white hover:bg-[var(--dashboard-surface-muted)]",
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-[var(--dashboard-text-soft)]">
                                    Question {index + 1}
                                  </span>
                                  <DashboardBadge
                                    tone={getQuestionStatusTone(
                                      question.status,
                                    )}
                                  >
                                    {question.status}
                                  </DashboardBadge>
                                </div>
                                <h3 className="mt-3 text-[1rem] font-semibold leading-7 text-[var(--dashboard-text-strong)]">
                                  {question.text}
                                </h3>
                                <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--dashboard-text-soft)]">
                                  {question.options.map(
                                    (option, optionIndex) => (
                                      <span
                                        key={`${question.id}-${optionIndex}`}
                                        className={cn(
                                          "rounded-full px-3 py-1",
                                          optionIndex === question.correctIndex
                                            ? "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]"
                                            : "bg-[var(--dashboard-surface-muted)]",
                                        )}
                                      >
                                        {option}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <DashboardButton
                                  type="button"
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleMoveQuestion(question.id, "up");
                                  }}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </DashboardButton>
                                <DashboardButton
                                  type="button"
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleMoveQuestion(question.id, "down");
                                  }}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </DashboardButton>
                                <DashboardButton
                                  type="button"
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDuplicateQuestion(question.id);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </DashboardButton>
                                <DashboardButton
                                  type="button"
                                  variant="ghost"
                                  size="iconSm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteQuestion(question.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </DashboardButton>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {selectedQuestion ? (
                        <div className="rounded-[28px] border border-[var(--dashboard-border-soft)] bg-white px-6 py-6">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-[var(--dashboard-text-soft)]">
                                Focused editor
                              </p>
                              <h3 className="mt-1 text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                                Edit question
                              </h3>
                            </div>
                            <DashboardButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleRegenerateQuestion(selectedQuestion.id)
                              }
                            >
                              <Wand2 className="h-4 w-4" />
                              Regenerate
                            </DashboardButton>
                          </div>

                          <div className="mt-5 space-y-4">
                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                Question text
                              </span>
                              <textarea
                                value={selectedQuestion.text}
                                onChange={(event) =>
                                  handleQuestionChange(
                                    selectedQuestion.id,
                                    (question) => ({
                                      ...question,
                                      text: event.target.value,
                                    }),
                                  )
                                }
                                className={dashboardTextareaVariants({
                                  size: "md",
                                })}
                              />
                            </label>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                  Answer options
                                </span>
                                <span className="text-sm text-[var(--dashboard-text-soft)]">
                                  Choose the correct answer
                                </span>
                              </div>

                              {selectedQuestion.options.map(
                                (option, optionIndex) => (
                                  <div
                                    key={`${selectedQuestion.id}-${optionIndex}`}
                                    className="flex items-center gap-3"
                                  >
                                    <input
                                      type="radio"
                                      checked={
                                        selectedQuestion.correctIndex ===
                                        optionIndex
                                      }
                                      onChange={() =>
                                        handleQuestionChange(
                                          selectedQuestion.id,
                                          (question) => ({
                                            ...question,
                                            correctIndex: optionIndex,
                                          }),
                                        )
                                      }
                                      className="h-4 w-4"
                                    />
                                    <input
                                      value={option}
                                      onChange={(event) =>
                                        handleQuestionChange(
                                          selectedQuestion.id,
                                          (question) => ({
                                            ...question,
                                            options: question.options.map(
                                              (candidate, candidateIndex) =>
                                                candidateIndex === optionIndex
                                                  ? event.target.value
                                                  : candidate,
                                            ),
                                          }),
                                        )
                                      }
                                      className={cn(
                                        dashboardInputVariants({ size: "md" }),
                                        "flex-1",
                                      )}
                                    />
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dashboard-border-soft)] pt-4">
                              <div className="flex gap-2">
                                <DashboardButton
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        options: [
                                          ...question.options,
                                          `Option ${question.options.length + 1}`,
                                        ],
                                      }),
                                    )
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                  Add option
                                </DashboardButton>
                                {selectedQuestion.options.length > 2 ? (
                                  <DashboardButton
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleQuestionChange(
                                        selectedQuestion.id,
                                        (question) => ({
                                          ...question,
                                          options: question.options.slice(
                                            0,
                                            -1,
                                          ),
                                          correctIndex: Math.min(
                                            question.correctIndex,
                                            question.options.length - 2,
                                          ),
                                        }),
                                      )
                                    }
                                  >
                                    Remove last option
                                  </DashboardButton>
                                ) : null}
                              </div>

                              <div className="flex gap-2">
                                <DashboardButton
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentIndex = questions.findIndex(
                                      (question) =>
                                        question.id === selectedQuestion.id,
                                    );
                                    setSelectedQuestionId(
                                      questions[Math.max(0, currentIndex - 1)]
                                        ?.id ?? selectedQuestion.id,
                                    );
                                  }}
                                >
                                  Previous
                                </DashboardButton>
                                <DashboardButton
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    const currentIndex = questions.findIndex(
                                      (question) =>
                                        question.id === selectedQuestion.id,
                                    );
                                    setSelectedQuestionId(
                                      questions[
                                        Math.min(
                                          questions.length - 1,
                                          currentIndex + 1,
                                        )
                                      ]?.id ?? selectedQuestion.id,
                                    );
                                  }}
                                >
                                  Next
                                </DashboardButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                </section>
              </DashboardSurface>

              <DashboardSurface asChild radius="xl" padding="lg">
                <section className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[1.45rem] font-semibold text-[var(--dashboard-text-strong)]">
                        {mode === "student" ? "Practice actions" : "Validation and final actions"}
                      </h2>
                      <p className="mt-2 text-[15px] leading-7 text-[var(--dashboard-text-soft)]">
                        {mode === "student"
                          ? "Keep this focused on learning: start the self-test, save it for later practice, or regenerate a cleaner set."
                          : "Run a final sanity check before saving, exporting, or launching a test run."}
                      </p>
                    </div>
                    <DashboardBadge
                      tone={
                        validationIssues.length === 0 ? "success" : "warning"
                      }
                      size="md"
                    >
                      {validationIssues.length === 0
                        ? "No blocking issues"
                        : `${validationIssues.length} issues to review`}
                    </DashboardBadge>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-3">
                      {validationIssues.length === 0 ? (
                        <div className="rounded-[24px] border border-[var(--dashboard-success)] bg-[var(--dashboard-success-soft)]/55 px-5 py-5">
                          <div className="flex items-center gap-3 text-[var(--dashboard-success)]">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold">
                              {copy.reviewReadyLabel}
                            </span>
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
                              "w-full rounded-[22px] border px-5 py-4 text-left transition",
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
                      <label className="block space-y-2 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4">
                        <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                          {mode === "teacher"
                            ? "Save Quiz visibility"
                            : "Practice set visibility"}
                        </span>
                        <select
                          value={publishVisibility}
                          onChange={(event) =>
                            setPublishVisibility(
                              event.target.value as QuizLibraryVisibility,
                            )
                          }
                          className={cn(
                            dashboardSelectVariants({ size: "md" }),
                            "w-full border-[var(--dashboard-border-soft)] bg-white",
                          )}
                        >
                          <option value="private">Private</option>
                          <option value="public">Public Library</option>
                        </select>
                        <p className="text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          {mode === "teacher"
                            ? "Private quizzes stay in your owner views. Public quizzes also appear in the shared library."
                            : "Private practice sets stay in your personal library. Public ones also appear in shared discovery."}
                        </p>
                      </label>

                      {mode === "teacher" ? (
                        <>
                          <DashboardButton
                            type="button"
                            size="lg"
                            className="w-full"
                            onClick={() => handleSaveQuiz("draft")}
                          >
                            <Save className="h-4.5 w-4.5" />
                            {copy.saveLabel}
                          </DashboardButton>
                          <DashboardButton type="button" variant="secondary" size="lg" className="w-full">
                            <FileJson className="h-4.5 w-4.5" />
                            Export as JSON
                          </DashboardButton>
                          <DashboardButton type="button" variant="secondary" size="lg" className="w-full">
                            <Download className="h-4.5 w-4.5" />
                            Export as Text
                          </DashboardButton>
                          <DashboardButton
                            type="button"
                            variant="soft"
                            size="lg"
                            className="w-full"
                            onClick={() =>
                              handleSaveQuiz(
                                publishVisibility === "public"
                                  ? "published-public"
                                  : "published-private",
                              )
                            }
                          >
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            {copy.publishLabel}
                          </DashboardButton>
                        </>
                      ) : (
                        <>
                          <DashboardButton type="button" size="lg" className="w-full" onClick={() => handleSaveQuiz("draft")}>
                            <PlayCircle className="h-4.5 w-4.5" />
                            {copy.runLabel}
                          </DashboardButton>
                          <DashboardButton
                            type="button"
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            onClick={() => handleSaveQuiz("draft")}
                          >
                            <Save className="h-4.5 w-4.5" />
                            {copy.saveLabel}
                          </DashboardButton>
                          <DashboardButton
                            type="button"
                            variant="soft"
                            size="lg"
                            className="w-full"
                            onClick={() =>
                              handleSaveQuiz(
                                publishVisibility === "public"
                                  ? "published-public"
                                  : "published-private",
                              )
                            }
                          >
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            {copy.publishLabel}
                          </DashboardButton>
                          <DashboardButton type="button" variant="secondary" size="lg" className="w-full" onClick={handleGenerateQuiz}>
                            <RefreshCw className="h-4.5 w-4.5" />
                            Regenerate
                          </DashboardButton>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              </DashboardSurface>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
