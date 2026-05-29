/**
 * Quiz builder draft persistence
 *
 * Persists the in-progress quiz draft to localStorage so navigating away
 * from the builder (and coming back later) doesn't lose the user's work.
 *
 * Scoping: per-user + per-mode (teacher / student) — a teacher's in-progress
 * draft must not bleed into a student session on the same device.
 *
 * Cleared on:
 *  - successful save / publish
 *  - explicit cancel
 *  - viewer logout (via clearAllUserStorage)
 *
 * Skipped when:
 *  - user is editing an existing saved quiz (`editingQuizId` is set), since
 *    the draft would overwrite real backend state
 *  - the workspace is at its pristine initial state (nothing to recover)
 *
 * Drafts older than DRAFT_TTL_MS are treated as stale and dropped on read.
 */

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
// Bumped from v1 → v2 after removing the `publishVisibility` field. Older
// drafts (with the now-defunct field) are dropped on read so we don't pull
// stale state into the simplified workspace.
const DRAFT_SCHEMA_VERSION = 2;
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  updatedAt: string; // ISO timestamp
}

function getStorageKey(scope: string, mode: "teacher" | "student") {
  return getUserScopedStorageKey(`${DRAFT_BASE_KEY}:${mode}`, scope);
}

/** Returns true if the draft holds meaningful work worth restoring. */
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

    // TTL: drop drafts that are clearly stale (e.g. user vanished for weeks).
    const timestamp = parsed.updatedAt ? Date.parse(parsed.updatedAt) : NaN;
    if (Number.isFinite(timestamp) && Date.now() - timestamp > DRAFT_TTL_MS) {
      clearQuizBuilderDraft(scope, mode);
      return null;
    }

    // Defensive shape check: bail if any required array got corrupted.
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

    // No point persisting an empty workspace — also prevents the draft
    // from being restored if the user just briefly opened the page.
    if (!isDraftWorthRestoring(full)) {
      clearQuizBuilderDraft(scope, mode);
      return;
    }

    localStorage.setItem(getStorageKey(scope, mode), JSON.stringify(full));
  } catch {
    // Quota errors / corrupted storage — best-effort, swallow.
  }
}

export function clearQuizBuilderDraft(
  scope: string,
  mode: "teacher" | "student",
): void {
  try {
    localStorage.removeItem(getStorageKey(scope, mode));
  } catch {
    // ignore
  }
}
