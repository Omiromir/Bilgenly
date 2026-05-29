const QUIZ_JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const QUIZ_JOIN_CODE_LENGTH = 6;

function hashValue(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash >>> 0;
}

export function normalizeQuizJoinCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, QUIZ_JOIN_CODE_LENGTH);
}

export function formatQuizJoinCode(value: string) {
  const normalized = normalizeQuizJoinCode(value);

  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function buildQuizJoinCode({
  assignmentId,
  classId,
  quizId,
}: {
  assignmentId: string;
  classId: string;
  quizId: string;
}) {
  let hash = hashValue(`${assignmentId}:${classId}:${quizId}`);
  let code = "";

  for (let index = 0; index < QUIZ_JOIN_CODE_LENGTH; index += 1) {
    hash = (hash * 1664525 + 1013904223 + index) >>> 0;
    code += QUIZ_JOIN_CODE_ALPHABET[hash % QUIZ_JOIN_CODE_ALPHABET.length];
  }

  return code;
}

/**
 * Builds a 6-character code from just the quizId — no class or assignment
 * context required.  Any student can join a public quiz by sharing this code,
 * exactly like a Kahoot-style open join.  The code is deterministic so it
 * stays the same across sessions and devices.
 */
export function buildQuizDirectCode(quizId: string) {
  let hash = hashValue(`direct:${quizId}`);
  let code = "";

  for (let index = 0; index < QUIZ_JOIN_CODE_LENGTH; index += 1) {
    hash = (hash * 1664525 + 1013904223 + index) >>> 0;
    code += QUIZ_JOIN_CODE_ALPHABET[hash % QUIZ_JOIN_CODE_ALPHABET.length];
  }

  return code;
}
