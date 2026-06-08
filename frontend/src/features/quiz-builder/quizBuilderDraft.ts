

import {
  getUserScopedStorageKey,
} from "../../app/providers/userScopedStorage";
import type {
  GeneratedQuestion,
  InputMethod,
  ParseStatus,
  ParsedSource,
  QuestionType,
} from "./quizBuilderTypes";

const DRAFT_BASE_KEY = "bilgenly_quiz_builder_draft";
const DRAFT_SCHEMA_VERSION = 2;
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface QuizBuilderDraft {
  schemaVersion: number;
  mode: "teacher" | "student";
  activeInput: InputMethod;
  pastedText: string;
  parseStatus: ParseStatus;
  parsedSource: ParsedSource | null;
  quizTitle: string;
  quizDescription: string;
  questionCount: number;
  focus: string;
  contextValue: string;
  questionTypes: QuestionType[];
  instructions: string;
  questions: GeneratedQuestion[];
  selectedQuestionId: string | null;
  hasEnteredReview: boolean;
  generatedBackendQuizId: string | null;
  updatedAt: string;
}

function getStorageKey(scope: string, mode: "teacher" | "student") {
  return getUserScopedStorageKey(`${DRAFT_BASE_KEY}:${mode}`, scope);
}


export function isDraftWorthRestoring(draft: QuizBuilderDraft): boolean {
  return (
    draft.quizTitle.trim().length > 0 ||
    draft.questions.length > 0 ||
    draft.pastedText.trim().length > 0 ||
    draft.parsedSource !== null ||
    draft.hasEnteredReview
  );
}

export function loadQuizBuilderDraft(
  scope: string,
  mode: "teacher" | "student",
): QuizBuilderDraft | null {
  try {
    const raw = localStorage.getItem(getStorageKey(scope, mode));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<QuizBuilderDraft>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.schemaVersion !== DRAFT_SCHEMA_VERSION ||
      parsed.mode !== mode
    ) {
      return null;
    }

    const timestamp = parsed.updatedAt ? Date.parse(parsed.updatedAt) : NaN;
    if (Number.isFinite(timestamp) && Date.now() - timestamp > DRAFT_TTL_MS) {
      clearQuizBuilderDraft(scope, mode);
      return null;
    }

    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.questionTypes)) {
      return null;
    }

    const draft = parsed as QuizBuilderDraft;
    return isDraftWorthRestoring(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function saveQuizBuilderDraft(
  scope: string,
  mode: "teacher" | "student",
  draft: Omit<QuizBuilderDraft, "schemaVersion" | "mode" | "updatedAt">,
): void {
  try {
    const full: QuizBuilderDraft = {
      ...draft,
      schemaVersion: DRAFT_SCHEMA_VERSION,
      mode,
      updatedAt: new Date().toISOString(),
    };

    if (!isDraftWorthRestoring(full)) {
      clearQuizBuilderDraft(scope, mode);
      return;
    }

    localStorage.setItem(getStorageKey(scope, mode), JSON.stringify(full));
  } catch {
  }
}

export function clearQuizBuilderDraft(
  scope: string,
  mode: "teacher" | "student",
): void {
  try {
    localStorage.removeItem(getStorageKey(scope, mode));
  } catch {
  }
}
