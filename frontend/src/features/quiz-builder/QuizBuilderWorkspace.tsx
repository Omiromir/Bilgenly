import {
  type ChangeEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Download,
  GripVerticalIcon,
  Info,
  Layers3,
  Lock,
  MoreHorizontal,
  PlayCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "../../components/icons/AppIcons";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { useQuizLibrary } from "../../app/providers/QuizLibraryProvider";
import { useTeacherClasses } from "../../app/providers/TeacherClassesProvider";
import { useQuizLauncher } from "../quiz-session/useQuizLauncher";
import {
  generateQuizFromPdf,
  generateQuizFromText,
  saveGeneratedQuizReview,
  type GeneratedQuizResultDto,
} from "./api/quizGenerationApi";
import { buildMockGeneratedQuizResult } from "./quizGenerationMock";
import { cn } from "../../components/ui/utils";
import { DashboardPageHeader } from "../dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardInputVariants,
  dashboardInsetBlockClassName,
  dashboardPageCenteredClassName,
  dashboardSelectVariants,
  dashboardTextareaVariants,
} from "../dashboard/components/DashboardPrimitives";
import { QuizBuilderConfigureStage } from "./components/QuizBuilderConfigureStage";
import { QuizBuilderGenerateStage } from "./components/QuizBuilderGenerateStage";
import { QuizBuilderInputStage } from "./components/QuizBuilderInputStage";
import { QuizBuilderReviewChecks } from "./components/QuizBuilderReviewChecks";
import { QuizBuilderStepper } from "./components/QuizBuilderStepper";
import { workspaceCopy } from "./quizBuilderCopy";
import { QUIZ_BUILDER_LIMITS, clampText } from "./quizBuilderLimits";
import type {
  GeneratedQuestion,
  InputMethod,
  ParseStatus,
  GenerationState,
  ParsedSource,
  QuestionAnswerOrder,
  QuizExportFormat,
  QuestionType,
  ValidationIssue,
  WorkspaceStage,
  QuizBuilderWorkspaceProps,
} from "./quizBuilderTypes";
import {
  applyCorrectIndexes,
  buildQuizDescription,
  createQuestionId,
  getQuestionCorrectIndexes,
  getQuestionStatusTone,
  getQuizDifficulty,
  readFileAsDataUrl,
  reorderQuestionOptions,
} from "./quizBuilderUtils";
import type {
  QuizLibraryStatus,
  QuizQuestionRecord,
} from "../dashboard/components/quiz-library/quizLibraryTypes";
import {
  clearQuizBuilderDraft,
  loadQuizBuilderDraft,
  saveQuizBuilderDraft,
} from "./quizBuilderDraft";
import { useAuth } from "../../app/providers/AuthProvider";
import { getUserStorageScope } from "../../app/providers/userScopedStorage";

function escapeXml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getMoodleCorrectIndexes(question: QuizQuestionRecord) {
  return question.selectionMode === "multiple" &&
    question.correctIndexes?.length
    ? question.correctIndexes
    : [question.correctIndex];
}

function getQuizRecordCorrectIndexes(question: QuizQuestionRecord) {
  return question.selectionMode === "multiple" && question.correctIndexes?.length
    ? [...question.correctIndexes].sort((left, right) => left - right)
    : [question.correctIndex];
}

function buildMoodleAnswerXml(
  answerText: string,
  fraction: number,
  explanation: string | undefined,
  indent = "    ",
) {
  return [
    `${indent}<answer fraction="${escapeXml(fraction.toFixed(5))}" format="html">`,
    `${indent}  <text>${escapeXml(answerText)}</text>`,
    `${indent}  <feedback format="html">`,
    `${indent}    <text>${fraction > 0 ? escapeXml(explanation) : ""}</text>`,
    `${indent}  </feedback>`,
    `${indent}</answer>`,
  ].join("\n");
}

function buildMoodleQuestionXml(question: QuizQuestionRecord, index: number) {
  const correctIndexes = getMoodleCorrectIndexes(question);
  const points = Math.max(1, Math.round(question.points ?? 1));
  const baseRows = [
    `  <name>`,
    `    <text>${escapeXml(`Question ${index + 1}`)}</text>`,
    `  </name>`,
    `  <questiontext format="html">`,
    `    <text>${escapeXml(question.text)}</text>`,
    `  </questiontext>`,
    `  <generalfeedback format="html">`,
    `    <text>${escapeXml(question.explanation)}</text>`,
    `  </generalfeedback>`,
    `  <defaultgrade>${points.toFixed(7)}</defaultgrade>`,
    `  <penalty>0.3333333</penalty>`,
    `  <hidden>0</hidden>`,
    `  <idnumber>${escapeXml(question.id)}</idnumber>`,
  ];

  if (question.questionType === "True/False") {
    const trueIsCorrect = correctIndexes.includes(0);

    return [
      `<question type="truefalse">`,
      ...baseRows,
      buildMoodleAnswerXml(
        "true",
        trueIsCorrect ? 100 : 0,
        question.explanation,
      ),
      buildMoodleAnswerXml(
        "false",
        trueIsCorrect ? 0 : 100,
        question.explanation,
      ),
      `</question>`,
    ].join("\n");
  }

  const correctCount = Math.max(1, correctIndexes.length);
  const correctFraction =
    question.selectionMode === "multiple" ? 100 / correctCount : 100;

  return [
    `<question type="multichoice">`,
    ...baseRows,
    `  <single>${question.selectionMode === "multiple" ? "false" : "true"}</single>`,
    `  <shuffleanswers>${question.answerOrder === "shuffle" ? "true" : "false"}</shuffleanswers>`,
    `  <answernumbering>abc</answernumbering>`,
    ...question.options.map((option, optionIndex) =>
      buildMoodleAnswerXml(
        option,
        correctIndexes.includes(optionIndex) ? correctFraction : 0,
        question.explanation,
      ),
    ),
    `</question>`,
  ].join("\n");
}

function buildMoodleQuizXml(payload: {
  title: string;
  topic: string;
  questions: QuizQuestionRecord[];
}) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<quiz>`,
    `<question type="category">`,
    `  <category>`,
    `    <text>${escapeXml(`$course$/top/${payload.title}`)}</text>`,
    `  </category>`,
    `</question>`,
    `<question type="description">`,
    `  <name>`,
    `    <text>${escapeXml(payload.title)}</text>`,
    `  </name>`,
    `  <questiontext format="html">`,
    `    <text>${escapeXml(payload.topic)}</text>`,
    `  </questiontext>`,
    `</question>`,
    ...payload.questions.map((question, index) =>
      buildMoodleQuestionXml(question, index),
    ),
    `</quiz>`,
  ].join("\n\n");
}

function mapGeneratedResultToQuestions(
  result: GeneratedQuizResultDto,
): GeneratedQuestion[] {
  return result.questions
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((question, index) => {
      const correctIndexes = question.answers
        .map((answer, answerIndex) => (answer.isCorrect ? answerIndex : -1))
        .filter((answerIndex) => answerIndex >= 0);
      const questionType =
        question.questionType === "TrueFalse"
          ? "True/False"
          : "Multiple choice";
      const selectionMode = correctIndexes.length > 1 ? "multiple" : "single";

      return {
        id: question.id,
        optionIds: question.answers.map((answer) => answer.id),
        questionType,
        selectionMode,
        text: question.text,
        options: question.answers.map((answer) => answer.text),
        correctIndex: correctIndexes[0] ?? 0,
        correctIndexes: correctIndexes.length ? correctIndexes : [0],
        explanation:
          question.explanation ||
          "Add a short explanation so quiz takers get immediate learning feedback after submission.",
        imageEnabled: false,
        points: 1,
        estimatedMinutes: 1,
        answerOrder: "fixed",
        required: true,
        tags: question.tags ?? [],
        status: index < 2 ? "unreviewed" : "needs attention",
      } satisfies GeneratedQuestion;
    });
}

function mapGeneratedQuestionToQuizQuestionRecord(
  question: GeneratedQuestion,
): QuizQuestionRecord {
  return {
    id: question.id,
    text: question.text.trim(),
    options: question.options.map((option) => option.trim()),
    optionIds: question.optionIds ? [...question.optionIds] : undefined,
    correctIndex: question.correctIndex,
    correctIndexes:
      question.selectionMode === "multiple"
        ? getQuestionCorrectIndexes(question)
        : undefined,
    questionType: question.questionType,
    selectionMode: question.selectionMode,
    explanation: question.explanation.trim() || undefined,
    imageEnabled: question.imageEnabled,
    imageUrl: question.imageUrl,
    points: Math.max(1, Math.round(question.points)),
    estimatedMinutes: Math.max(1, Math.round(question.estimatedMinutes)),
    answerOrder: question.answerOrder,
    required: question.required,
    tags: question.tags ?? [],
  };
}


interface QuestionTagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function QuestionTagEditor({ tags, onChange }: QuestionTagEditorProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setDraft("");
      return;
    }
    const alreadyExists = tags.some(
      (tag) => tag.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!alreadyExists) {
      onChange([...tags, trimmed]);
    }
    setDraft("");
  }

  function removeTag(target: string) {
    onChange(tags.filter((tag) => tag !== target));
  }

  return (
    <div className="mt-6 space-y-3 border-t border-[var(--dashboard-border-soft)] pt-5">
      <div className="space-y-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-strong)]">
          <Layers3 className="h-4 w-4 text-[var(--dashboard-text-soft)]" />
          Topic tags
        </span>
        <p className="text-xs leading-5 text-[var(--dashboard-text-soft)]">
          Name the concepts this question covers, like Photosynthesis or
          Quadratic equations. Tags power the weak-topic breakdown teachers see
          once students attempt the quiz.
        </p>
      </div>

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] py-1 pl-3 pr-1.5 text-sm text-[var(--dashboard-text-strong)]">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag} tag`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--dashboard-text-soft)] transition hover:bg-[var(--dashboard-surface-elevated)] hover:text-[var(--dashboard-text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dashboard-accent)]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-[var(--dashboard-text-faint)]">
          No tags yet. Untagged questions are skipped in the weak-topic
          analytics.
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commitDraft();
            } else if (
              event.key === "Backspace" &&
              draft.length === 0 &&
              tags.length > 0
            ) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onBlur={commitDraft}
          placeholder="Type a topic and press Enter"
          maxLength={48}
          className={cn(
            dashboardInputVariants({ size: "md" }),
            "flex-1 bg-[var(--dashboard-surface-muted)]",
          )}
        />
        <DashboardButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={commitDraft}
          disabled={draft.trim().length === 0}
        >
          <Plus className="h-4 w-4" />
          Add
        </DashboardButton>
      </div>
    </div>
  );
}


interface QuestionListCardProps {
  question: GeneratedQuestion;
  index: number;
  isSelected: boolean;
  
  isOverlay?: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}


function QuestionCardBody({
  question,
  index,
  isSelected,
  isOverlay = false,
  onSelect,
  onDuplicate,
  onDelete,
  dragHandleProps,
}: QuestionListCardProps & {
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const questionTypeLabel =
    question.questionType === "True/False" ? "True / False" : "Multiple choice";

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (menuOpen) { setMenuOpen(false); return; }
    if (triggerRef.current) setMenuAnchor(triggerRef.current.getBoundingClientRect());
    setMenuOpen(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!(triggerRef.current?.contains(target)) && !(menuPortalRef.current?.contains(target))) {
        setMenuOpen(false);
      }
    }
    function handleClose() { setMenuOpen(false); }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "group flex w-full items-stretch rounded-[18px] border transition-colors duration-150",
        isOverlay
          ? "border-[var(--dashboard-brand)]/40 bg-[var(--dashboard-surface-elevated)] shadow-xl ring-2 ring-[var(--dashboard-brand)]/25 opacity-95"
          : isSelected
            ? "border-[var(--dashboard-brand)]/35 bg-[var(--dashboard-surface-elevated)] shadow-[var(--dashboard-shadow-card)]"
            : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface)] hover:border-[var(--dashboard-border)]",
      )}
    >
      
      <div
        {...dragHandleProps}
        className={cn(
          "flex shrink-0 cursor-grab items-center rounded-l-[18px] px-2 touch-none",
          "text-[var(--dashboard-text-faint)] opacity-0 transition-opacity",
          "group-hover:opacity-100 active:cursor-grabbing",
          isOverlay && "opacity-100",
        )}
        title="Drag to reorder"
      >
        <GripVerticalIcon className="h-4 w-4" />
      </div>

      
      <button
        type="button"
        className="min-w-0 flex-1 py-4 pr-2 text-left"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--dashboard-surface-muted)] text-xs font-semibold text-[var(--dashboard-text-soft)]">
            {index + 1}
          </span>
          <span className="whitespace-nowrap rounded-full border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-2 py-1 text-[11px] font-medium text-[var(--dashboard-text-soft)]">
            {questionTypeLabel}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[var(--dashboard-text-strong)]">
          {question.text}
        </h3>
        <p className="mt-2 text-xs text-[var(--dashboard-text-soft)]">
          {question.options.length} choices |{" "}
          {Math.max(1, Math.round(question.points))} pts
        </p>
      </button>

      
      <div ref={triggerRef} className="flex shrink-0 items-start p-2 pt-3">
        <DashboardButton
          type="button"
          variant="ghost"
          size="iconSm"
          data-slot="dropdown-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={openMenu}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DashboardButton>

        {menuOpen && menuAnchor && createPortal(
          <div
            ref={menuPortalRef}
            role="menu"
            style={{
              position: "fixed",
              right: window.innerWidth - menuAnchor.right,
              width: 160,
              zIndex: 9999,
              ...(window.innerHeight - menuAnchor.bottom < 88
                ? { bottom: window.innerHeight - menuAnchor.top + 4 }
                : { top: menuAnchor.bottom + 4 }),
            }}
            className="overflow-hidden rounded-md border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] py-1 shadow-lg"
          >
            <button
              role="menuitem"
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-[var(--dashboard-text)] hover:bg-[var(--dashboard-surface-muted)] focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDuplicate();
              }}
            >
              Duplicate
            </button>
            <button
              role="menuitem"
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-[var(--dashboard-danger)] hover:bg-[var(--dashboard-surface-muted)] focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
            >
              Delete
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}


function QuestionListCard(props: QuestionListCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <QuestionCardBody {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}


export function QuizBuilderWorkspace({
  mode,
  title,
  subtitle,
}: QuizBuilderWorkspaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getQuizById, saveGeneratedQuiz, duplicateQuizToLibrary } = useQuizLibrary();
  const { classes } = useTeacherClasses();
  const { openQuiz } = useQuizLauncher();
  const { currentUser, role, token } = useAuth();
  const copy = workspaceCopy[mode];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const questionImageInputRef = useRef<HTMLInputElement | null>(null);

  const draftStorageScope = useMemo(
    () =>
      getUserStorageScope({
        userId: currentUser?.id ?? null,
        email: currentUser?.email ?? null,
        role,
        token,
      }),
    [currentUser?.email, currentUser?.id, role, token],
  );

  const [activeInput, setActiveInput] = useState<InputMethod>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");
  const [parsedSource, setParsedSource] = useState<ParsedSource | null>(null);
  const presetTitle = location.state?.presetTitle as string | undefined;
  const presetFocus = location.state?.presetFocus as string | undefined;
  const presetContext = location.state?.presetContext as string | undefined;
  const [quizTitle, setQuizTitle] = useState(presetTitle ?? "");
  const [questionCount, setQuestionCount] = useState(8);
  const [focus, setFocus] = useState(presetFocus ?? "");
  const [contextValue, setContextValue] = useState(
    presetContext ?? copy.defaultContextValue,
  );
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
  const [generatedBackendQuizId, setGeneratedBackendQuizId] = useState<
    string | null
  >(null);
  const [quizDescription, setQuizDescription] = useState<string>("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [imageUploadQuestionId, setImageUploadQuestionId] = useState<
    string | null
  >(null);
  const [draggingOptionIndex, setDraggingOptionIndex] = useState<number | null>(
    null,
  );
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(
    null,
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);
  const [editorMenuAnchor, setEditorMenuAnchor] = useState<DOMRect | null>(null);
  const editorTriggerRef = useRef<HTMLDivElement>(null);
  const editorMenuPortalRef = useRef<HTMLDivElement>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const editingQuizId = location.state?.editQuizId as string | undefined;
  const editingQuiz = editingQuizId ? getQuizById(editingQuizId) : undefined;
  const resolvedLanguage = editingQuiz?.language ?? "English";

  const isAssignedQuiz =
    mode === "teacher" &&
    !!editingQuizId &&
    classes.some((c) => c.assignedQuizzes.some((a) => a.quizId === editingQuizId));

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
    quizTitle.trim() ||
    (mode === "student" ? `${focus || "Personal"} Practice Quiz` : "");
  const deferredReviewSearch = useDeferredValue(reviewSearch);
  const selectedQuestion =
    questions.find((question) => question.id === selectedQuestionId) ??
    questions[0] ??
    null;
  const selectedQuestionIndex = selectedQuestion
    ? questions.findIndex((question) => question.id === selectedQuestion.id)
    : -1;
  const filteredReviewQuestions = useMemo(() => {
    const query = deferredReviewSearch.trim().toLowerCase();

    if (!query) {
      return questions;
    }

    return questions.filter((question) =>
      [question.text, question.explanation, ...question.options]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredReviewSearch, questions]);
  const reviewedQuestionCount = questions.filter(
    (question) => question.status === "edited",
  ).length;
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
    if (!editorMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !(editorTriggerRef.current?.contains(target)) &&
        !(editorMenuPortalRef.current?.contains(target))
      ) {
        setEditorMenuOpen(false);
      }
    }
    function handleClose() { setEditorMenuOpen(false); }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [editorMenuOpen]);

  useEffect(() => {
    if (editingQuiz) {
      return;
    }

    if (presetTitle) {
      setQuizTitle(presetTitle);
    }

    if (presetFocus) {
      setFocus(presetFocus);
    }

    if (presetContext) {
      setContextValue(presetContext);
    }
  }, [editingQuiz, presetContext, presetFocus, presetTitle]);

  useEffect(() => {
    if (!editingQuiz || editingQuiz.ownerRole !== mode) {
      return;
    }

    setQuizTitle(editingQuiz.title);
    setQuizDescription(editingQuiz.description ?? "");
    setQuestionCount(editingQuiz.questionCount);
    setFocus(editingQuiz.topic);
    setQuestions(
      editingQuiz.questions.map((question) => ({
        ...question,
        questionType: question.questionType ?? "Multiple choice",
        optionIds: question.optionIds ? [...question.optionIds] : undefined,
        selectionMode: question.selectionMode ?? "single",
        options: [...question.options],
        correctIndexes:
          question.selectionMode === "multiple"
            ? [...(question.correctIndexes ?? [question.correctIndex])]
            : [question.correctIndex],
        explanation:
          question.explanation ??
          "Add a short explanation so quiz takers get immediate learning feedback after submission.",
        imageEnabled: question.imageEnabled ?? Boolean(question.imageUrl),
        points: Math.max(1, Math.round(question.points ?? 1)),
        estimatedMinutes: Math.max(
          1,
          Math.round(question.estimatedMinutes ?? 2),
        ),
        answerOrder: question.answerOrder ?? "fixed",
        required: question.required ?? true,
        tags: question.tags ?? [],
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
    setGeneratedBackendQuizId(
      mode === "teacher" &&
        editingQuiz.status === "generated" &&
        /^[0-9a-f-]{36}$/i.test(editingQuiz.id)
        ? editingQuiz.id
        : null,
    );
  }, [editingQuiz, mode]);

  const hasHydratedDraftRef = useRef(false);
  useEffect(() => {
    if (hasHydratedDraftRef.current) return;
    if (editingQuizId) {
      hasHydratedDraftRef.current = true;
      return;
    }
    if (!currentUser?.id && !currentUser?.email) return;

    const draft = loadQuizBuilderDraft(draftStorageScope, mode);
    hasHydratedDraftRef.current = true;
    if (!draft) return;

    if (presetTitle || presetFocus || presetContext) return;

    setActiveInput(draft.activeInput);
    setPastedText(draft.pastedText);
    setParseStatus(draft.parseStatus);
    setParsedSource(draft.parsedSource);
    setQuizTitle(draft.quizTitle);
    setQuizDescription(draft.quizDescription);
    setQuestionCount(draft.questionCount);
    setFocus(draft.focus);
    setContextValue(draft.contextValue);
    setQuestionTypes(draft.questionTypes);
    setInstructions(draft.instructions);
    setQuestions(draft.questions);
    setSelectedQuestionId(draft.selectedQuestionId);
    setHasEnteredReview(draft.hasEnteredReview);
    setGeneratedBackendQuizId(draft.generatedBackendQuizId);
    if (draft.questions.length > 0) {
      setGenerationState("success");
    }
  }, [
    currentUser?.email,
    currentUser?.id,
    draftStorageScope,
    editingQuizId,
    mode,
    presetContext,
    presetFocus,
    presetTitle,
  ]);

  useEffect(() => {
    if (editingQuizId) return;
    if (!hasHydratedDraftRef.current) return;

    const timeoutId = window.setTimeout(() => {
      saveQuizBuilderDraft(draftStorageScope, mode, {
        activeInput,
        pastedText,
        parseStatus,
        parsedSource,
        quizTitle,
        quizDescription,
        questionCount,
        focus,
        contextValue,
        questionTypes,
        instructions,
        questions,
        selectedQuestionId,
        hasEnteredReview,
        generatedBackendQuizId,
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeInput,
    contextValue,
    draftStorageScope,
    editingQuizId,
    focus,
    generatedBackendQuizId,
    hasEnteredReview,
    instructions,
    mode,
    parseStatus,
    parsedSource,
    pastedText,
    questionCount,
    questionTypes,
    questions,
    quizDescription,
    quizTitle,
    selectedQuestionId,
  ]);

  useEffect(() => {
    if (parseStatus !== "processing") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (activeInput === "upload") {
        if (!selectedFile) {
          setParseStatus("error");
          setParsedSource(null);
          return;
        }

        const fileSizeMb = Math.max(1, Math.round(selectedFile.size / 1024 / 1024));
        setParsedSource({
          label: selectedFile.name,
          lengthLabel: `${fileSizeMb} MB · PDF ready`,
          pageEstimate: "Pages estimated after generation",
          characterCount: selectedFile.size,
          extractedText: "",
        });
        setParseStatus("ready");
        setGenerationState("idle");
        setGenerationError(null);
        setQuestions([]);
        setSelectedQuestionId(null);
        setHasEnteredReview(false);
        return;
      }

      const sourceText = pastedText.trim();

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
        label: "Pasted lecture text",
        lengthLabel: `${Math.ceil(characterCount / 6)} words estimated`,
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
  }, [activeInput, parseStatus, pastedText, selectedFile?.name, selectedFile?.size]);

  useEffect(() => {
    if (generationState !== "running") {
      return;
    }

    const startedAt = Date.now();
    let isCancelled = false;
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    const runGeneration = async () => {
      try {
        const questionType =
          questionTypes.includes("True/False") &&
          !questionTypes.includes("Multiple choice")
            ? "TrueFalse"
            : "MCQ";
        const request = {
          title: resolvedQuizTitle,
          topic: focus || resolvedQuizTitle,
          topicFocus: contextValue,
          questionCount,
          questionType,
          additionalInstructions: instructions,
          text:
            activeInput === "paste"
              ? (parsedSource?.extractedText ?? "")
              : undefined,
        } as const;
        const result =
          activeInput === "upload" && selectedFile
            ? await generateQuizFromPdf(selectedFile, {
                title: request.title,
                topic: request.topic,
                topicFocus: request.topicFocus,
                questionCount: request.questionCount,
                questionType: request.questionType,
                additionalInstructions: request.additionalInstructions,
              })
            : await generateQuizFromText(request);

        if (isCancelled) {
          return;
        }

        const generated = mapGeneratedResultToQuestions(result);
        setGeneratedBackendQuizId(result.quizId);
        setQuestions(generated);
        setSelectedQuestionId(generated[0]?.id ?? null);
        setGenerationState("success");
        setHasEnteredReview(false);
        setGenerationDurationLabel(
          `${Math.max(result.generationTimeSeconds, 1)} sec`,
        );
        setQuestionSeed((value) => value + 1);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setGenerationState("failed");
        setGenerationError(
          error instanceof Error
            ? error.message
            : "Bilgenly could not generate a backend-backed quiz draft.",
        );
      }
    };

    void runGeneration();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    activeInput,
    contextValue,
    focus,
    generationState,
    instructions,
    mode,
    parseStatus,
    parsedSource?.extractedText,
    questionCount,
    questionTypes,
    resolvedQuizTitle,
    selectedFile,
  ]);

  useEffect(() => {
    setDraggingOptionIndex(null);
    setDragOverOptionIndex(null);
  }, [selectedQuestionId]);

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
        question.questionType === "Multiple choice" &&
        question.options.filter((option) => option.trim()).length < 2
      ) {
        issues.push({
          id: `${question.id}-missing-options`,
          questionId: question.id,
          tone: "danger",
          label: `Question ${index + 1} needs answer options`,
          detail: "Add at least two non-empty answer options before saving.",
        });
      }

      if (question.options.some((option) => !option.trim())) {
        issues.push({
          id: `${question.id}-empty-option`,
          questionId: question.id,
          tone: "danger",
          label: `Question ${index + 1} has an empty option`,
          detail: "Fill in every answer option or remove the empty one.",
        });
      }

      if (
        getQuestionCorrectIndexes(question).some(
          (correctIndex) =>
            correctIndex < 0 || correctIndex >= question.options.length,
        )
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

      if (
        question.selectionMode === "single" &&
        getQuestionCorrectIndexes(question).length !== 1
      ) {
        issues.push({
          id: `${question.id}-single-answer-selection`,
          questionId: question.id,
          tone: "danger",
          label: `Question ${index + 1} needs exactly one correct answer`,
          detail: "Single-choice questions must have one correct option.",
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

      if (question.points < 1) {
        issues.push({
          id: `${question.id}-invalid-points`,
          questionId: question.id,
          tone: "warning",
          label: `Question ${index + 1} has invalid points`,
          detail: "Set at least 1 point so scoring stays consistent.",
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
    setGeneratedBackendQuizId(null);
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
    setGeneratedBackendQuizId(null);
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
    setGeneratedBackendQuizId(null);
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

  function handleMockGenerate() {
    if (!parsedSource) {
      setParsedSource({
        label: "Mock source — dev mode",
        lengthLabel: "~1 page",
        pageEstimate: "1",
        characterCount: 500,
        extractedText: "[mock content generated in dev mode]",
      });
    }

    const effectiveTitle =
      resolvedQuizTitle.trim() ||
      (mode === "student" ? "Practice Quiz (mock)" : "Quiz Draft (mock)");

    const mockResult = buildMockGeneratedQuizResult(effectiveTitle, questionCount);
    const generated = mapGeneratedResultToQuestions(mockResult);
    setQuestions(generated);
    setSelectedQuestionId(generated[0]?.id ?? null);
    setGeneratedBackendQuizId(null);
    setGenerationState("success");
    setGenerationError(null);
    setGenerationDurationLabel("instant (mock)");
    setHasEnteredReview(false);
    setQuestionSeed((value) => value + 1);
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

  async function handleQuestionImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    const questionId = imageUploadQuestionId;

    event.target.value = "";

    if (!file || !questionId || !file.type.startsWith("image/")) {
      return;
    }

    try {
      const imageUrl = await readFileAsDataUrl(file);
      handleQuestionChange(questionId, (question) => ({
        ...question,
        imageEnabled: true,
        imageUrl,
      }));
    } catch {
      return;
    } finally {
      setImageUploadQuestionId(null);
    }
  }

  function handleAttachImage(questionId: string) {
    setImageUploadQuestionId(questionId);
    questionImageInputRef.current?.click();
  }

  function handleQuestionMenuAction(
    questionId: string,
    action: "up" | "down" | "duplicate" | "delete" | "regenerate",
  ) {
    if (action === "up" || action === "down") {
      handleMoveQuestion(questionId, action);
      return;
    }

    if (action === "duplicate") {
      handleDuplicateQuestion(questionId);
      return;
    }

    if (action === "delete") {
      handleDeleteQuestion(questionId);
      return;
    }

    handleRegenerateQuestion(questionId);
  }

  function handleDownloadQuizExport(format: QuizExportFormat) {
    const payload = buildQuizSavePayload("draft");

    if (!payload) {
      return;
    }

    const fileName =
      resolvedQuizTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "bilgenly-quiz";
    const content =
      format === "json"
        ? JSON.stringify(payload, null, 2)
        : format === "xml"
          ? buildMoodleQuizXml(payload)
          : [
              `Title: ${payload.title}`,
              `Topic: ${payload.topic}`,
              "",
              ...payload.questions.flatMap((question, index) => [
                `Q${index + 1}. ${question.text}`,
                `Type: ${question.questionType ?? "Multiple choice"} | Mode: ${
                  question.selectionMode ?? "single"
                } | Points: ${question.points ?? 1}`,
                ...question.options.map((option, optionIndex) => {
                  const correctIndexes =
                    question.selectionMode === "multiple"
                      ? (question.correctIndexes ?? [question.correctIndex])
                      : [question.correctIndex];
                  const marker = correctIndexes.includes(optionIndex)
                    ? "[correct]"
                    : "[ ]";
                  return `  ${marker} ${option}`;
                }),
                `Explanation: ${question.explanation ?? "None"}`,
                "",
              ]),
            ].join("\n");

    const blob = new Blob([content], {
      type:
        format === "json"
          ? "application/json"
          : format === "xml"
            ? "application/xml"
            : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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

  function handleReorderQuestions(fromIndex: number, toIndex: number) {
    setQuestions((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setQuestions((current) => arrayMove(current, oldIndex, newIndex));
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
          optionIds: undefined,
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
      options:
        question.questionType === "True/False"
          ? ["True", "False"]
          : [
              question.options[0],
              question.options[1],
              `Updated answer aligned with ${focus || "the selected focus"}`,
              question.options[3] ?? "None of the above",
            ],
      correctIndex: question.questionType === "True/False" ? 0 : 2,
      correctIndexes:
        question.questionType === "True/False"
          ? [0]
          : question.selectionMode === "multiple"
            ? [0, 2]
            : [2],
      imageEnabled: question.imageEnabled,
      explanation: `This refreshed explanation now points students back to ${focus || "the selected focus"} so the feedback stays useful after submission.`,
      status: "edited",
    }));
  }

  function handleAddQuestion() {
    if (questions.length >= QUIZ_BUILDER_LIMITS.maxQuestionsPerQuiz) {
      setGenerationError(
        `A quiz can have at most ${QUIZ_BUILDER_LIMITS.maxQuestionsPerQuiz} questions.`,
      );
      return;
    }

    const newQuestion: GeneratedQuestion = {
      id: createQuestionId(),
      questionType: "Multiple choice",
      selectionMode: "single",
      text: "New question prompt",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0,
      correctIndexes: [0],
      explanation:
        "Add a short explanation here so students understand why the correct answer is right after they submit.",
      imageEnabled: false,
      points: 1,
      estimatedMinutes: 2,
      answerOrder: "fixed",
      required: true,
      tags: [],
      status: "edited",
    };

    setQuestions((current) => [...current, newQuestion]);
    setSelectedQuestionId(newQuestion.id);
    setHasEnteredReview(true);
    setGenerationError(null);
  }

  function buildQuizSavePayload(targetStatus: QuizLibraryStatus) {
    if (questions.length === 0) {
      return null;
    }

    const normalizedQuestions = questions.map(
      mapGeneratedQuestionToQuizQuestionRecord,
    );
    const topic = focus.trim() || "General review";
    const durationMinutes = Math.max(
      2,
      normalizedQuestions.reduce(
        (sum, question) => sum + Math.max(1, question.estimatedMinutes ?? 1),
        0,
      ),
    );
    const visibility = "private" as const;

    const sourceLabel = parsedSource
      ? mode === "teacher"
        ? `Generated from ${parsedSource.label}`
        : `Built from ${parsedSource.label.toLowerCase()}`
      : "Generated quiz";

    return {
      existingQuizId: generatedBackendQuizId ?? editingQuiz?.id,
      ownerRole: mode,
      title: resolvedQuizTitle,
      description:
        quizDescription.trim() ||
        (parsedSource
          ? buildQuizDescription(parsedSource.extractedText, topic)
          : topic),
      topic,
      difficulty: getQuizDifficulty(normalizedQuestions.length),
      language: resolvedLanguage,
      status: targetStatus,
      visibility,
      tags: Array.from(
        new Set(
          [
            topic,
            ...(mode === "student" ? [contextValue] : []),
            ...Array.from(
              new Set(
                normalizedQuestions.map((q) => q.questionType ?? "Multiple choice"),
              ),
            ),
          ].filter((value): value is string => Boolean(value?.trim())),
        ),
      ),
      sourceLabel,
      note:
        targetStatus === "published-private"
          ? "Saved privately and visible only in your library views."
          : mode === "student"
            ? "Saved to your personal quiz library for later practice."
            : "Saved as a draft in your quiz library for later review.",
      questionCount: normalizedQuestions.length,
      durationMinutes,
      questions: normalizedQuestions,
      practiceState: mode === "student" ? "ready" : undefined,
    };
  }

  async function saveQuizRecord(targetStatus: QuizLibraryStatus) {
    if (!resolvedQuizTitle.trim()) {
      throw new Error("Quiz title is required.");
    }

    const blockingIssue = validationIssues.find(
      (issue) => issue.tone === "danger",
    );
    if (blockingIssue) {
      setSelectedQuestionId(blockingIssue.questionId);
      throw new Error(blockingIssue.detail);
    }

    const payload = buildQuizSavePayload(targetStatus);

    if (!payload) {
      throw new Error("Add at least one valid question before saving.");
    }

    if (generatedBackendQuizId) {
      const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const reviewResult = await saveGeneratedQuizReview(generatedBackendQuizId, {
        title: payload.title,
        description: payload.description,
        isPublic: false,
        questions: payload.questions.map((question, index) => ({
          id: guidPattern.test(question.id ?? "") ? question.id : undefined,
          text: question.text,
          questionType:
            question.questionType === "True/False" ? "TrueFalse" : "MCQ",
          explanation: question.explanation ?? "",
          position: index + 1,
          tags: question.tags ?? [],
          answers: question.options.map((option, optionIndex) => {
            const optionId = question.optionIds?.[optionIndex];

            return {
              id: optionId && guidPattern.test(optionId) ? optionId : undefined,
              text: option,
              isCorrect:
                getQuizRecordCorrectIndexes(question).includes(optionIndex),
            };
          }),
        })),
      });

      const savedQuestions = mapGeneratedResultToQuestions(reviewResult);
      const savedPayload = {
        ...payload,
        existingQuizId: reviewResult.quizId,
        questionCount: savedQuestions.length,
        questions: savedQuestions.map(mapGeneratedQuestionToQuizQuestionRecord),
      };

      setGeneratedBackendQuizId(reviewResult.quizId);
      setQuestions(savedQuestions);
      setSelectedQuestionId(savedQuestions[0]?.id ?? null);

      return saveGeneratedQuiz(savedPayload);
    }

    return saveGeneratedQuiz(payload);
  }

  async function handleSaveQuiz(targetStatus: QuizLibraryStatus) {
    if (!resolvedQuizTitle.trim()) {
      setGenerationError("Quiz title is required before saving.");
      return;
    }

    try {
      const savedQuiz = await saveQuizRecord(targetStatus);

      if (!savedQuiz) {
        return;
      }

      clearQuizBuilderDraft(draftStorageScope, mode);

      const libraryTab = targetStatus === "draft" ? "drafts" : "my-quizzes";
      navigate(
        mode === "teacher"
          ? "/dashboard/teacher/quiz-library"
          : "/dashboard/student/quiz-library",
        { state: { libraryTab } },
      );
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Unable to save this quiz.",
      );
      console.error(
        "Quiz save failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  function handleDuplicateAndEdit() {
    if (!editingQuizId) return;
    const duplicate = duplicateQuizToLibrary(editingQuizId, "teacher");
    if (duplicate) {
      navigate("/dashboard/teacher/generate-quiz", {
        state: { editQuizId: duplicate.id },
      });
    }
  }

  async function handleOpenQuizFlow(targetStatus: QuizLibraryStatus) {
    try {
      const savedQuiz = await saveQuizRecord(targetStatus);

      if (!savedQuiz) {
        return;
      }

      clearQuizBuilderDraft(draftStorageScope, mode);

      const libraryTab: "drafts" | "my-quizzes" =
        targetStatus === "draft" ? "drafts" : "my-quizzes";

      openQuiz({
        quizId: savedQuiz.id,
        viewerRole: mode,
        navigationState: {
          launchSourceType: "generate-quiz",
          launchSourceLabel:
            mode === "teacher"
              ? "Teacher quiz generator"
              : "Self-study quiz generator",
          returnToPath:
            mode === "teacher"
              ? "/dashboard/teacher/quiz-library"
              : "/dashboard/student/quiz-library",
          returnToLabel:
            targetStatus === "draft" ? "Back to drafts" : "Back to quiz library",
          returnToState: { libraryTab },
        },
      });
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Unable to open this quiz.",
      );
    }
  }

  function handleCancelCreation() {
    clearQuizBuilderDraft(draftStorageScope, mode);
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
    <div
      className={
        workspaceStage === "review"
          ? "mx-auto max-w-[1480px] space-y-8 pt-2"
          : dashboardPageCenteredClassName
      }
    >
      <DashboardPageHeader title={title} subtitle={subtitle} align="center" />

      <QuizBuilderStepper currentStepIndex={currentStepIndex} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={workspaceStage}
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.985 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {workspaceStage === "input" ? (
            <QuizBuilderInputStage
              activeInput={activeInput}
              canParse={canParse}
              copy={copy}
              fileError={fileError}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleMockGenerate={import.meta.env.DEV ? handleMockGenerate : undefined}
              handleOpenFilePicker={handleOpenFilePicker}
              handleStartParsing={handleStartParsing}
              parseStatus={parseStatus}
              pastedText={pastedText}
              selectedFile={selectedFile}
              setActiveInput={setActiveInput}
              setParseStatus={setParseStatus}
              setParsedSource={setParsedSource}
              setPastedText={setPastedText}
            />
          ) : null}

          {workspaceStage === "configure" ? (
            <QuizBuilderConfigureStage
              canGenerate={canGenerate}
              contextValue={contextValue}
              copy={copy}
              handleGenerateQuiz={handleGenerateQuiz}
              handleMockGenerate={import.meta.env.DEV ? handleMockGenerate : undefined}
              handleReplaceSource={handleReplaceSource}
              mode={mode}
              parsedSource={parsedSource}
              questionCount={questionCount}
              quizTitle={quizTitle}
              setContextValue={setContextValue}
              setQuestionCount={setQuestionCount}
              setQuizTitle={setQuizTitle}
            />
          ) : null}

          {workspaceStage === "generate" ? (
            <QuizBuilderGenerateStage
              contextValue={contextValue}
              copy={copy}
              elapsedSeconds={elapsedSeconds}
              generationDurationLabel={generationDurationLabel}
              generationError={generationError}
              generationState={generationState}
              handleCancelGeneration={handleCancelGeneration}
              handleDownloadQuizExport={handleDownloadQuizExport}
              handleGenerateQuiz={handleGenerateQuiz}
              handleMockGenerate={import.meta.env.DEV ? handleMockGenerate : undefined}
              handleOpenQuizFlow={handleOpenQuizFlow}
              handleRetryGeneration={handleRetryGeneration}
              handleSaveToLibrary={() => { void handleSaveQuiz("published-private"); }}
              mode={mode}
              parsedSource={parsedSource}
              questionsCount={questions.length}
              setGenerationState={setGenerationState}
              setHasEnteredReview={setHasEnteredReview}
              validationIssues={validationIssues}
            />
          ) : null}

          {workspaceStage === "review" ? (
            <div className="space-y-6">
              <DashboardSurface
                radius="xl"
                padding="none"
                className="overflow-hidden"
              >
                <section className="grid xl:grid-cols-[280px_minmax(0,1fr)]">
                  <input
                    ref={questionImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuestionImageChange}
                  />
                  <div className="border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-5 py-4 xl:col-span-2 xl:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        
                        {!editingQuiz ? (
                          <DashboardButton
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setHasEnteredReview(false);
                            }}
                          >
                            <ChevronRight className="h-4.5 w-4.5 rotate-180" />
                          </DashboardButton>
                        ) : null}
                        <div className="min-w-0 flex-1 space-y-2">
                          <input
                            type="text"
                            value={quizTitle}
                            onChange={(event) =>
                              setQuizTitle(
                                clampText(
                                  event.target.value,
                                  QUIZ_BUILDER_LIMITS.quizTitle,
                                ),
                              )
                            }
                            maxLength={QUIZ_BUILDER_LIMITS.quizTitle}
                            placeholder="Quiz title"
                            aria-label="Quiz title"
                            className={cn(
                              dashboardInputVariants({ size: "lg" }),
                              "h-11 w-full border-0 bg-transparent px-0 text-[1.35rem] font-semibold text-[var(--dashboard-text-strong)] shadow-none focus-visible:ring-0",
                            )}
                          />
                          {!quizTitle.trim() ? (
                            <p className="text-xs text-[var(--dashboard-danger)]">
                              Quiz title is required.
                            </p>
                          ) : null}
                          {generationError ? (
                            <p className="text-xs text-[var(--dashboard-danger)]">
                              {generationError}
                            </p>
                          ) : null}
                          <textarea
                            value={quizDescription}
                            onChange={(event) =>
                              setQuizDescription(
                                clampText(
                                  event.target.value,
                                  QUIZ_BUILDER_LIMITS.quizDescription,
                                ),
                              )
                            }
                            maxLength={QUIZ_BUILDER_LIMITS.quizDescription}
                            placeholder="Add a short description for this quiz (optional)."
                            aria-label="Quiz description"
                            rows={2}
                            className={cn(
                              dashboardTextareaVariants({ size: "sm" }),
                              "min-h-[44px] w-full border-0 bg-transparent px-0 text-sm text-[var(--dashboard-text-soft)] shadow-none focus-visible:ring-0",
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <DashboardButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-0 text-[var(--dashboard-text-soft)] hover:text-[var(--dashboard-text-strong)]"
                          onClick={handleCancelCreation}
                        >
                          {editingQuiz
                            ? "Cancel Editing"
                            : mode === "student"
                              ? "Discard Quiz"
                              : "Cancel Creation"}
                        </DashboardButton>
                        
                        <DashboardButton
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleOpenQuizFlow("draft")}
                          title={mode === "student" ? copy.launchLabel : "Preview quiz"}
                          aria-label={mode === "student" ? copy.launchLabel : "Preview quiz"}
                        >
                          <PlayCircle className="h-4.5 w-4.5" />
                        </DashboardButton>
                        
                        {mode !== "student" ? (
                          <DashboardButton
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="shrink-0"
                            onClick={() => handleSaveQuiz("draft")}
                            title={isAssignedQuiz ? "Saving disabled — quiz is assigned to a class" : copy.saveLabel}
                            aria-label={copy.saveLabel}
                            disabled={isAssignedQuiz}
                          >
                            {isAssignedQuiz ? <Lock className="h-4.5 w-4.5" /> : <Save className="h-4.5 w-4.5" />}
                          </DashboardButton>
                        ) : null}
                        <DashboardButton
                          type="button"
                          size="lg"
                          disabled={isAssignedQuiz}
                          title={isAssignedQuiz ? "Saving disabled — quiz is assigned to a class" : undefined}
                          onClick={() => handleSaveQuiz("published-private")}
                        >
                          {copy.publishLabel}
                        </DashboardButton>
                      </div>
                    </div>

                    
                    {isAssignedQuiz ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dashboard-border-soft)] bg-[var(--dashboard-warning-surface,#2d2008)] px-5 py-3 text-sm xl:px-6">
                        <div className="flex items-center gap-2 text-[var(--dashboard-warning,#f59e0b)]">
                          <Lock className="h-4 w-4 shrink-0" />
                          <span>
                            <strong>Editing locked.</strong> This quiz is assigned to a class — saving changes would corrupt existing student attempts and analytics.
                          </span>
                        </div>
                        <DashboardButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleDuplicateAndEdit}
                        >
                          <Layers3 className="h-3.5 w-3.5" />
                          Duplicate &amp; Edit
                        </DashboardButton>
                      </div>
                    ) : null}
                  </div>

                  <aside className="border-b border-r border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-4 py-4 xl:border-b-0">
                    <div className="space-y-4 xl:sticky xl:top-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">
                            Questions ({questions.length})
                          </p>
                          <p className="hidden mt-1 text-sm text-[var(--dashboard-text-soft)]">
                            {reviewedQuestionCount} edited ·{" "}
                            {validationIssues.length} issues
                          </p>
                          <p className="mt-1 text-sm text-[var(--dashboard-text-soft)]">
                            {reviewedQuestionCount} edited |{" "}
                            {validationIssues.length} issues
                          </p>
                        </div>
                        <DashboardButton
                          type="button"
                          size="iconSm"
                          variant="secondary"
                          className="rounded-full border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
                          onClick={handleAddQuestion}
                        >
                          <Plus className="h-4 w-4" />
                        </DashboardButton>
                      </div>

                      {filteredReviewQuestions.length ? (
                        <DndContext
                          sensors={dndSensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={filteredReviewQuestions.map((q) => q.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
                              {filteredReviewQuestions.map((question) => {
                                const index = questions.findIndex(
                                  (candidate) => candidate.id === question.id,
                                );
                                return (
                                  <QuestionListCard
                                    key={question.id}
                                    question={question}
                                    index={index}
                                    isSelected={selectedQuestion?.id === question.id}
                                    onSelect={() => setSelectedQuestionId(question.id)}
                                    onDuplicate={() => handleDuplicateQuestion(question.id)}
                                    onDelete={() => handleDeleteQuestion(question.id)}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                          
                          <DragOverlay dropAnimation={null}>
                            {activeDragId ? (() => {
                              const dragged = questions.find((q) => q.id === activeDragId);
                              const dragIdx = questions.findIndex((q) => q.id === activeDragId);
                              if (!dragged) return null;
                              return (
                                <QuestionCardBody
                                  question={dragged}
                                  index={dragIdx}
                                  isSelected={false}
                                  isOverlay
                                  onSelect={() => {}}
                                  onDuplicate={() => {}}
                                  onDelete={() => {}}
                                />
                              );
                            })() : null}
                          </DragOverlay>
                        </DndContext>
                      ) : (
                        <div className="rounded-[18px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-6 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          No questions match the current search.
                        </div>
                      )}

                      <div className="rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
                        <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                          {mode === "student" ? "Ready to practice" : "Result screen"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          {validationIssues.length === 0
                            ? mode === "student"
                              ? "Your practice set is ready. Start a self-test or save it to your personal library."
                              : "The draft is in good shape and ready for preview, saving, or publishing."
                            : mode === "student"
                              ? "Fix the highlighted issues before you start the self-test."
                              : "Fix the highlighted issues before you publish the quiz."}
                        </p>
                      </div>
                    </div>
                  </aside>

                  <div className="space-y-5 bg-[var(--dashboard-surface)] px-5 py-5 lg:px-6">
                    <div className="flex flex-wrap items-center gap-4 border-b border-[var(--dashboard-border-soft)] pb-5">
                      <div className="min-w-[260px] flex-1">
                        <DashboardSearchField
                          value={reviewSearch}
                          onChange={(event) =>
                            setReviewSearch(
                              clampText(
                                event.target.value,
                                QUIZ_BUILDER_LIMITS.search,
                              ),
                            )
                          }
                          placeholder="Search questions..."
                          inputClassName="h-11 rounded-[14px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)]"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <DashboardBadge tone="info" size="md">
                          {questions.length} questions
                        </DashboardBadge>
                        <DashboardBadge tone="neutral" size="md">
                          {parsedSource?.label ?? "AI-generated source"}
                        </DashboardBadge>
                        <DashboardBadge tone="neutral" size="md">
                          {generationDurationLabel ?? "Fresh draft"}
                        </DashboardBadge>
                      </div>
                    </div>

                    {selectedQuestion ? (
                      <div className="space-y-5">
                        <div className="relative rounded-[30px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-6 py-6 shadow-[var(--dashboard-shadow-card)]">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dashboard-border-soft)] pb-5">
                            <div className="flex flex-wrap items-center gap-2">
                              
                              <span className="inline-flex items-center gap-2 rounded-[12px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-3 py-2 text-sm font-medium text-[var(--dashboard-text-strong)]">
                                <CircleDot className="h-4 w-4" />
                                Multiple choice
                              </span>
                            </div>

                            <div ref={editorTriggerRef} className="flex flex-wrap items-center gap-2">
                              
                              <DashboardButton
                                type="button"
                                variant="ghost"
                                size="iconSm"
                                title="More question actions"
                                aria-haspopup="menu"
                                aria-expanded={editorMenuOpen}
                                onClick={() => {
                                  if (editorMenuOpen) { setEditorMenuOpen(false); return; }
                                  if (editorTriggerRef.current) setEditorMenuAnchor(editorTriggerRef.current.getBoundingClientRect());
                                  setEditorMenuOpen(true);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DashboardButton>

                              {editorMenuOpen && editorMenuAnchor && createPortal(
                                <div
                                  ref={editorMenuPortalRef}
                                  role="menu"
                                  style={{
                                    position: "fixed",
                                    right: window.innerWidth - editorMenuAnchor.right,
                                    width: 176,
                                    zIndex: 9999,
                                    ...(window.innerHeight - editorMenuAnchor.bottom < 160
                                      ? { bottom: window.innerHeight - editorMenuAnchor.top + 4 }
                                      : { top: editorMenuAnchor.bottom + 4 }),
                                  }}
                                  className="overflow-hidden rounded-md border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] py-1 shadow-lg"
                                >
                                  {[
                                    { label: "Duplicate", action: "duplicate" as const },
                                    { label: "Move up", action: "up" as const },
                                    { label: "Move down", action: "down" as const },
                                    { label: "Delete", action: "delete" as const },
                                  ].map((item) => (
                                    <button
                                      key={item.label}
                                      role="menuitem"
                                      type="button"
                                      className={cn(
                                        "w-full px-3 py-2 text-left text-sm hover:bg-[var(--dashboard-surface-muted)] focus:outline-none",
                                        item.action === "delete"
                                          ? "text-[var(--dashboard-danger)]"
                                          : "text-[var(--dashboard-text)]",
                                      )}
                                      onClick={() => {
                                        setEditorMenuOpen(false);
                                        handleQuestionMenuAction(
                                          selectedQuestion.id,
                                          item.action,
                                        );
                                      }}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex flex-wrap items-start justify-between gap-3 xl:pl-6">
                            <div>
                              <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                Question {selectedQuestionIndex + 1}*
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2" />
                          </div>

                          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:pl-6">
                            <div className="space-y-4">
                              <label className="space-y-2">
                                <textarea
                                  value={selectedQuestion.text}
                                  onChange={(event) =>
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        text: clampText(
                                          event.target.value,
                                          QUIZ_BUILDER_LIMITS.questionText,
                                        ),
                                      }),
                                    )
                                  }
                                  maxLength={QUIZ_BUILDER_LIMITS.questionText}
                                  className={cn(
                                    dashboardTextareaVariants({ size: "md" }),
                                    "min-h-[210px] rounded-[18px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] text-[1.2rem] leading-8",
                                  )}
                                />
                                <p className="text-xs text-[var(--dashboard-text-faint)]">
                                  {selectedQuestion.text.length}/
                                  {QUIZ_BUILDER_LIMITS.questionText}
                                </p>
                              </label>

                              <div className="space-y-3">
                                {selectedQuestion.options.map(
                                  (option, optionIndex) => (
                                    <div
                                      key={`${selectedQuestion.id}-${optionIndex}`}
                                      onDragOver={(event) => {
                                        event.preventDefault();
                                        if (
                                          dragOverOptionIndex !== optionIndex
                                        ) {
                                          setDragOverOptionIndex(optionIndex);
                                        }
                                      }}
                                      onDrop={(event) => {
                                        event.preventDefault();

                                        if (
                                          draggingOptionIndex === null ||
                                          draggingOptionIndex === optionIndex
                                        ) {
                                          setDraggingOptionIndex(null);
                                          setDragOverOptionIndex(null);
                                          return;
                                        }

                                        handleQuestionChange(
                                          selectedQuestion.id,
                                          (question) =>
                                            reorderQuestionOptions(
                                              question,
                                              draggingOptionIndex,
                                              optionIndex,
                                            ),
                                        );
                                        setDraggingOptionIndex(null);
                                        setDragOverOptionIndex(null);
                                      }}
                                      onDragEnd={() => {
                                        setDraggingOptionIndex(null);
                                        setDragOverOptionIndex(null);
                                      }}
                                      className={cn(
                                        "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[16px] border px-3 py-3",
                                        draggingOptionIndex === optionIndex
                                          ? "opacity-70"
                                          : "",
                                        selectedQuestion.correctIndex ===
                                          optionIndex
                                          ? "border-[var(--dashboard-success)]/35 bg-[var(--dashboard-success-soft)]/55"
                                          : "border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
                                        dragOverOptionIndex === optionIndex &&
                                          draggingOptionIndex !== null &&
                                          draggingOptionIndex !== optionIndex
                                          ? "border-[var(--dashboard-brand)] bg-[var(--dashboard-brand-soft-alt)]/50"
                                          : "",
                                      )}
                                    >
                                      <input
                                        type={
                                          selectedQuestion.selectionMode ===
                                          "multiple"
                                            ? "checkbox"
                                            : "radio"
                                        }
                                        checked={getQuestionCorrectIndexes(
                                          selectedQuestion,
                                        ).includes(optionIndex)}
                                        onChange={() =>
                                          handleQuestionChange(
                                            selectedQuestion.id,
                                            (question) => {
                                              if (
                                                question.selectionMode ===
                                                "multiple"
                                              ) {
                                                const nextCorrectIndexes =
                                                  getQuestionCorrectIndexes(
                                                    question,
                                                  ).includes(optionIndex)
                                                    ? getQuestionCorrectIndexes(
                                                        question,
                                                      ).filter(
                                                        (index) =>
                                                          index !== optionIndex,
                                                      )
                                                    : [
                                                        ...getQuestionCorrectIndexes(
                                                          question,
                                                        ),
                                                        optionIndex,
                                                      ];

                                                return applyCorrectIndexes(
                                                  question,
                                                  nextCorrectIndexes,
                                                );
                                              }

                                              return applyCorrectIndexes(
                                                question,
                                                [optionIndex],
                                              );
                                            },
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
                                                    ? clampText(
                                                        event.target.value,
                                                        QUIZ_BUILDER_LIMITS.optionText,
                                                      )
                                                    : candidate,
                                              ),
                                            }),
                                          )
                                        }
                                        maxLength={
                                          QUIZ_BUILDER_LIMITS.optionText
                                        }
                                        className={cn(
                                          dashboardInputVariants({
                                            size: "md",
                                          }),
                                          "border-none bg-[var(--dashboard-surface-elevated)]",
                                        )}
                                      />
                                      <button
                                        type="button"
                                        draggable
                                        onDragStart={(event) => {
                                          event.dataTransfer.effectAllowed =
                                            "move";
                                          setDraggingOptionIndex(optionIndex);
                                          setDragOverOptionIndex(optionIndex);
                                        }}
                                        onDragEnd={() => {
                                          setDraggingOptionIndex(null);
                                          setDragOverOptionIndex(null);
                                        }}
                                        className="cursor-grab text-[var(--dashboard-text-faint)] transition hover:text-[var(--dashboard-text-soft)] active:cursor-grabbing"
                                        title="Drag to reorder answer"
                                        aria-label="Drag to reorder answer"
                                      >
                                        <GripVerticalIcon className="h-4 w-4" />
                                      </button>
                                      <DashboardButton
                                        type="button"
                                        variant="ghost"
                                        size="iconSm"
                                        onClick={() =>
                                          handleQuestionChange(
                                            selectedQuestion.id,
                                            (question) => {
                                              const nextQuestion = {
                                                ...question,
                                                options:
                                                  question.options.filter(
                                                    (_, candidateIndex) =>
                                                      candidateIndex !==
                                                      optionIndex,
                                                  ),
                                              };
                                              const nextCorrectIndexes =
                                                getQuestionCorrectIndexes(
                                                  question,
                                                )
                                                  .filter(
                                                    (index) =>
                                                      index !== optionIndex,
                                                  )
                                                  .map((index) =>
                                                    index > optionIndex
                                                      ? index - 1
                                                      : index,
                                                  );

                                              return applyCorrectIndexes(
                                                nextQuestion,
                                                nextCorrectIndexes,
                                              );
                                            },
                                          )
                                        }
                                        disabled={
                                          selectedQuestion.options.length <= 2
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 text-[#ef4444]" />
                                      </DashboardButton>
                                    </div>
                                  ),
                                )}

                                <DashboardButton
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={
                                    selectedQuestion.questionType ===
                                      "True/False" ||
                                    selectedQuestion.options.length >=
                                      QUIZ_BUILDER_LIMITS.maxOptionsPerQuestion
                                  }
                                  onClick={() => {
                                    if (
                                      selectedQuestion.options.length >=
                                      QUIZ_BUILDER_LIMITS.maxOptionsPerQuestion
                                    ) {
                                      return;
                                    }
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        options: [
                                          ...question.options,
                                          `Option ${question.options.length + 1}`,
                                        ],
                                      }),
                                    );
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  Add answers
                                </DashboardButton>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {selectedQuestion.imageEnabled ? (
                                <div className="space-y-3">
                                  <div className="overflow-hidden rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[#7fd6ee]">
                                    {selectedQuestion.imageUrl ? (
                                      <img
                                        src={selectedQuestion.imageUrl}
                                        alt={`Question ${selectedQuestionIndex + 1} illustration`}
                                        className="h-[180px] w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-[180px] flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,#8adcf2_0%,#64cce8_100%)] px-4 text-center">
                                        <Camera className="h-8 w-8 text-white" />
                                        <p className="max-w-[180px] text-sm leading-6 text-white/90">
                                          Add an image to make the question more
                                          visual.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <DashboardButton
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() =>
                                        handleAttachImage(selectedQuestion.id)
                                      }
                                    >
                                      <Camera className="h-4 w-4" />
                                      {selectedQuestion.imageUrl
                                        ? "Replace photo"
                                        : "Add photo"}
                                    </DashboardButton>
                                    <DashboardButton
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleQuestionChange(
                                          selectedQuestion.id,
                                          (question) => ({
                                            ...question,
                                            imageEnabled: false,
                                            imageUrl: undefined,
                                          }),
                                        )
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </DashboardButton>
                                  </div>
                                </div>
                              ) : null}

                              <label className="space-y-2">
                                <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                  Feedback explanation
                                </span>
                                <textarea
                                  value={selectedQuestion.explanation}
                                  onChange={(event) =>
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        explanation: clampText(
                                          event.target.value,
                                          QUIZ_BUILDER_LIMITS.explanation,
                                        ),
                                      }),
                                    )
                                  }
                                  maxLength={QUIZ_BUILDER_LIMITS.explanation}
                                  className={cn(
                                    dashboardTextareaVariants({ size: "md" }),
                                    "min-h-[200px] rounded-[20px] border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)]",
                                  )}
                                />
                                <p className="text-xs text-[var(--dashboard-text-faint)]">
                                  {selectedQuestion.explanation.length}/
                                  {QUIZ_BUILDER_LIMITS.explanation}
                                </p>
                              </label>

                              <label className="hidden space-y-2 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
                                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                  <Clock3 className="h-4 w-4 text-[var(--dashboard-text-soft)]" />
                                  Estimation time
                                </span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={selectedQuestion.estimatedMinutes}
                                    onChange={(event) =>
                                      handleQuestionChange(
                                        selectedQuestion.id,
                                        (question) => ({
                                          ...question,
                                          estimatedMinutes: Math.max(
                                            1,
                                            Number(event.target.value) || 1,
                                          ),
                                        }),
                                      )
                                    }
                                    className={cn(
                                      dashboardInputVariants({ size: "md" }),
                                      "w-24 bg-[var(--dashboard-surface-muted)]",
                                    )}
                                  />
                                  <span className="text-sm text-[var(--dashboard-text-soft)]">
                                    mins
                                  </span>
                                </div>
                              </label>

                              <label className="hidden space-y-2 rounded-[18px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
                                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                  <CircleDot className="h-4 w-4 text-[var(--dashboard-text-soft)]" />
                                  Mark as point
                                </span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={selectedQuestion.points}
                                    onChange={(event) =>
                                      handleQuestionChange(
                                        selectedQuestion.id,
                                        (question) => ({
                                          ...question,
                                          points: Math.max(
                                            1,
                                            Number(event.target.value) || 1,
                                          ),
                                        }),
                                      )
                                    }
                                    className={cn(
                                      dashboardInputVariants({ size: "md" }),
                                      "w-24 bg-[var(--dashboard-surface-muted)]",
                                    )}
                                  />
                                  <span className="text-sm text-[var(--dashboard-text-soft)]">
                                    points
                                  </span>
                                </div>
                              </label>

                              <div className="hidden rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-text-faint)]">
                                  Source summary
                                </p>
                                <p className="hidden mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                                  {parsedSource?.label ?? "Generated source"} ·{" "}
                                  {focus || "General review"}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                                  {parsedSource?.label ?? "Generated source"} |{" "}
                                  {focus || "General review"}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                                  Use this side panel to keep the educational
                                  explanation aligned with the source material.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-4 border-t border-[var(--dashboard-border-soft)] pt-5 xl:grid-cols-[minmax(0,1.2fr)_220px_220px] xl:pl-6">
                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                Randomize Order
                              </span>
                              <select
                                className={cn(
                                  dashboardSelectVariants({ size: "md" }),
                                  "w-full border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-soft)]",
                                )}
                                value={selectedQuestion.answerOrder}
                                onChange={(event) =>
                                  handleQuestionChange(
                                    selectedQuestion.id,
                                    (question) => ({
                                      ...question,
                                      answerOrder: event.target
                                        .value as QuestionAnswerOrder,
                                    }),
                                  )
                                }
                              >
                                <option value="fixed">
                                  Keep choices in current order
                                </option>
                                <option value="shuffle">
                                  Shuffle when quiz starts
                                </option>
                              </select>
                            </label>

                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                Estimation time
                              </span>
                              <div className="flex items-center gap-2 rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-3 py-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={selectedQuestion.estimatedMinutes}
                                  onChange={(event) =>
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        estimatedMinutes: Math.min(60, Math.max(
                                          1,
                                          Number(event.target.value) || 1,
                                        )),
                                      }),
                                    )
                                  }
                                  className={cn(
                                    dashboardInputVariants({ size: "sm" }),
                                    "h-10 w-16 border-none bg-[var(--dashboard-surface-elevated)] px-3",
                                  )}
                                />
                                <span className="text-sm text-[var(--dashboard-text-soft)]">
                                  Mins (max 60)
                                </span>
                              </div>
                            </label>

                            <label className="space-y-2">
                              <span className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
                                Mark as point
                              </span>
                              <div className="flex items-center gap-2 rounded-[16px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-3 py-2">
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={selectedQuestion.points}
                                  onChange={(event) =>
                                    handleQuestionChange(
                                      selectedQuestion.id,
                                      (question) => ({
                                        ...question,
                                        points: Math.min(100, Math.max(
                                          1,
                                          Number(event.target.value) || 1,
                                        )),
                                      }),
                                    )
                                  }
                                  className={cn(
                                    dashboardInputVariants({ size: "sm" }),
                                    "h-10 w-16 border-none bg-[var(--dashboard-surface-elevated)] px-3",
                                  )}
                                />
                                <span className="text-sm text-[var(--dashboard-text-soft)]">
                                  Points (max 100)
                                </span>
                              </div>
                            </label>
                          </div>

                          <QuestionTagEditor
                            tags={selectedQuestion.tags ?? []}
                            onChange={(nextTags) =>
                              handleQuestionChange(
                                selectedQuestion.id,
                                (question) => ({
                                  ...question,
                                  tags: nextTags,
                                }),
                              )
                            }
                          />

                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dashboard-border-soft)] pt-5">
                            <div className="text-sm text-[var(--dashboard-text-soft)]">
                              Reorder questions from the left rail, or move
                              through them here while editing.
                            </div>

                            <div className="flex gap-2">
                              <DashboardButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedQuestionId(
                                    questions[
                                      Math.max(0, selectedQuestionIndex - 1)
                                    ]?.id ?? selectedQuestion.id,
                                  )
                                }
                              >
                                Previous
                              </DashboardButton>
                              <DashboardButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  setSelectedQuestionId(
                                    questions[
                                      Math.min(
                                        questions.length - 1,
                                        selectedQuestionIndex + 1,
                                      )
                                    ]?.id ?? selectedQuestion.id,
                                  )
                                }
                              >
                                Next
                              </DashboardButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-elevated)] px-6 py-10 text-center">
                        <p className="text-lg font-semibold text-[var(--dashboard-text-strong)]">
                          Select a question to edit
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                          Pick any item from the left rail to open its full
                          editor.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </DashboardSurface>

              <QuizBuilderReviewChecks
                copy={copy}
                handleDownloadQuizExport={handleDownloadQuizExport}
                handleGenerateQuiz={handleGenerateQuiz}
                mode={mode}
                showRegenerateButton={
                  generatedBackendQuizId !== null && !editingQuizId
                }
                setSelectedQuestionId={setSelectedQuestionId}
                validationIssues={validationIssues}
              />
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
