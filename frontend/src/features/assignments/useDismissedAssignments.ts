import { useCallback, useState } from "react";
import type { AssignedQuizAvailability } from "./assignedQuizAvailability";

const STORAGE_KEY_PREFIX = "bilgenly_dismissed_assignments_";

function storageKey(userId: string | undefined): string {
  return STORAGE_KEY_PREFIX + (userId ?? "anonymous");
}

function readFromStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? (parsed as unknown[]).filter((s): s is string => typeof s === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function isDismissibleAssignment(state: AssignedQuizAvailability): boolean {
  if (!state.canStart && !state.canResume && !state.canReview) return true;
  if (state.maxAttempts === null && state.hasCompletedAttempt) return true;
  return false;
}


export function useDismissedAssignments(userId: string | undefined) {
  const key = storageKey(userId);
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    readFromStorage(key),
  );

  const dismiss = useCallback(
    (assignmentId: string) => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(assignmentId);
        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
        }
        return next;
      });
    },
    [key],
  );

  return { dismissed, dismiss };
}
