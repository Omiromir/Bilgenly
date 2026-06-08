

import type { QuizSessionSourceType } from "./quizSessionTypes";

export interface FeedbackPolicy {
  
  showImmediateCorrectAnswer: boolean;
  
  showImmediateExplanation: boolean;
  
  showDetailedReview: boolean;
  
  showSummaryOnly: boolean;
  
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

  if (max === null) {
    return OPEN_POLICY;
  }

  const used = typeof input.attemptsUsed === "number" ? input.attemptsUsed : 0;

  if (used >= max) {
    return OPEN_POLICY;
  }

  return LOCKED_POLICY(used, max, Boolean(input.hasInProgressAttempt));
}
