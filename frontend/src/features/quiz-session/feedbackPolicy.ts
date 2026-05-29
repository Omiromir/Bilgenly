/**
 * Feedback policy for quiz attempts.
 *
 * In assigned quizzes a student shouldn't see correct answers until they've
 * burned through every attempt — otherwise a 3-attempt assignment is really a
 * 1-attempt assignment with two retries against a known answer key.
 *
 * Self-practice (no assignment context) is unchanged: feedback is always
 * immediate, because the point of practice is to learn from each question
 * right away.
 *
 * Teachers reviewing a student's attempt always see the answer key — they
 * already know it.
 */

import type { QuizSessionSourceType } from "./quizSessionTypes";

export interface FeedbackPolicy {
  /** Show the green "Correct answer" highlight on the option immediately after submit. */
  showImmediateCorrectAnswer: boolean;
  /** Show the explanation panel after each question during the quiz. */
  showImmediateExplanation: boolean;
  /** Show the full per-question review (Your answer / Correct answer / Explanation) after the quiz ends. */
  showDetailedReview: boolean;
  /** Show only the score summary, no per-question review. */
  showSummaryOnly: boolean;
  /** Reason the policy is locked, surfaced in the UI when review is hidden. */
  lockReason: string | null;
}

export interface FeedbackPolicyInput {
  sourceType: QuizSessionSourceType | undefined;
  viewerRole: "teacher" | "student" | undefined;
  isAssigned: boolean;
  attemptsUsed: number | null | undefined;
  maxAttempts: number | null | undefined;
  hasInProgressAttempt?: boolean;
}

const OPEN_POLICY: FeedbackPolicy = {
  showImmediateCorrectAnswer: true,
  showImmediateExplanation: true,
  showDetailedReview: true,
  showSummaryOnly: false,
  lockReason: null,
};

const LOCKED_POLICY = (
  attemptsUsed: number,
  maxAttempts: number,
  hasInProgressAttempt: boolean,
): FeedbackPolicy => {
  const remaining = Math.max(maxAttempts - attemptsUsed, 0);
  const reason = hasInProgressAttempt
    ? "Finish this attempt to see your score. Detailed review unlocks after you've used all attempts."
    : remaining > 0
      ? `Detailed review unlocks after you've used all ${maxAttempts} attempts (${remaining} ${
          remaining === 1 ? "attempt" : "attempts"
        } left).`
      : "Detailed review is locked for this attempt.";

  return {
    showImmediateCorrectAnswer: false,
    showImmediateExplanation: false,
    showDetailedReview: false,
    showSummaryOnly: true,
    lockReason: reason,
  };
};

/**
 * Resolve the feedback policy for a quiz attempt.
 *
 * Rules:
 * - Teachers always see everything (`OPEN_POLICY`).
 * - Self-practice (not assigned) always gets `OPEN_POLICY`.
 * - Assigned quiz with unlimited attempts (`maxAttempts == null`) keeps `OPEN_POLICY`,
 *   since there's no "final attempt" to gate on.
 * - Assigned quiz with a finite cap: locked until `attemptsUsed >= maxAttempts`.
 */
export function getQuizFeedbackPolicy(input: FeedbackPolicyInput): FeedbackPolicy {
  if (input.viewerRole !== "student") {
    return OPEN_POLICY;
  }

  if (!input.isAssigned) {
    return OPEN_POLICY;
  }

  const max =
    typeof input.maxAttempts === "number" && input.maxAttempts > 0
      ? input.maxAttempts
      : null;

  // Unlimited attempts → no meaningful "final attempt", treat as open.
  if (max === null) {
    return OPEN_POLICY;
  }

  const used = typeof input.attemptsUsed === "number" ? input.attemptsUsed : 0;

  if (used >= max) {
    return OPEN_POLICY;
  }

  return LOCKED_POLICY(used, max, Boolean(input.hasInProgressAttempt));
}
