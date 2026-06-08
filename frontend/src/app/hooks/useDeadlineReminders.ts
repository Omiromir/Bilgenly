import { useCallback, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useTeacherClasses } from "../providers/TeacherClassesProvider";
import { useNotifications } from "../providers/NotificationsProvider";


const DEADLINE_WINDOW_HOURS = 24;

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

function getFiredKey(userId: string) {
  return `bilgenly_deadline_fired_${userId}`;
}

function loadFired(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getFiredKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveFired(userId: string, fired: Set<string>) {
  try {
    localStorage.setItem(getFiredKey(userId), JSON.stringify([...fired]));
  } catch {
  }
}


export function useDeadlineReminders() {
  const { currentUser, role } = useAuth();
  const { classes } = useTeacherClasses();
  const { sendDeadlineReminder } = useNotifications();

  const checkDeadlines = useCallback(() => {
    if (role !== "student" || !currentUser) return;

    const now = Date.now();
    const windowEnd = now + DEADLINE_WINDOW_HOURS * 60 * 60 * 1000;
    const fired = loadFired(currentUser.id);
    let changed = false;

    for (const cls of classes) {
      for (const assignment of cls.assignedQuizzes) {
        if (!assignment.deadline) continue;

        const deadlineMs = new Date(assignment.deadline).getTime();

        if (deadlineMs <= now || deadlineMs > windowEnd) continue;
        if (fired.has(assignment.assignmentId)) continue;

        const hoursUntilDeadline =
          Math.round(((deadlineMs - now) / (1000 * 60 * 60)) * 10) / 10;

        fired.add(assignment.assignmentId);
        changed = true;

        sendDeadlineReminder({
          recipientUserId: currentUser.id,
          recipientEmail: currentUser.email ?? "",
          relatedClassId: cls.id,
          relatedClassName: cls.name,
          quizTitle: assignment.title,
          assignmentId: assignment.assignmentId,
          deadline: assignment.deadline,
          hoursUntilDeadline,
        });
      }
    }

    if (changed) {
      saveFired(currentUser.id, fired);
    }
  }, [role, currentUser, classes, sendDeadlineReminder]);

  useEffect(() => {
    checkDeadlines();
  }, [checkDeadlines]);

  useEffect(() => {
    if (role !== "student") return;
    const id = setInterval(checkDeadlines, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [role, checkDeadlines]);
}
