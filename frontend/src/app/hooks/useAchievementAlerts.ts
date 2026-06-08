import { useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useStudentAttempts } from "../providers/StudentAttemptsProvider";
import { useNotifications } from "../providers/NotificationsProvider";


export function useAchievementAlerts() {
  const { currentUser, role } = useAuth();
  const { attempts } = useStudentAttempts();
  const { sendAchievementAlert } = useNotifications();

  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (role !== "student" || !currentUser) return;

    if (!initialized.current) {
      for (const attempt of attempts) {
        seenIds.current.add(attempt.id);
      }
      initialized.current = true;
      return;
    }

    for (const attempt of attempts) {
      if (seenIds.current.has(attempt.id)) continue;
      seenIds.current.add(attempt.id);

      if (!attempt.isCompleted) continue;
      const pct =
        attempt.totalQuestions > 0
          ? (attempt.correctAnswers / attempt.totalQuestions) * 100
          : attempt.score;
      if (pct < 80) continue;

      sendAchievementAlert({
        recipientUserId: currentUser.id,
        recipientEmail: currentUser.email ?? "",
        quizTitle: attempt.quizTitle,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
      });
    }
  }, [attempts, currentUser, role, sendAchievementAlert]);
}
