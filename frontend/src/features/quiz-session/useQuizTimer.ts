import { useEffect, useRef, useState } from "react";

const TIMER_KEY_PREFIX = "bilgenly_qtimer_";

interface TimerPauseData {
  pausedAt: string;
  totalPausedMs: number;
}

function readPauseData(sessionId: string): TimerPauseData | null {
  try {
    const raw = localStorage.getItem(`${TIMER_KEY_PREFIX}${sessionId}`);
    return raw ? (JSON.parse(raw) as TimerPauseData) : null;
  } catch {
    return null;
  }
}

function writePauseData(sessionId: string, data: TimerPauseData): void {
  try {
    localStorage.setItem(`${TIMER_KEY_PREFIX}${sessionId}`, JSON.stringify(data));
  } catch {
  }
}

function clearPauseData(sessionId: string) {
  try {
    localStorage.removeItem(`${TIMER_KEY_PREFIX}${sessionId}`);
  } catch {
  }
}

export interface QuizTimerState {
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  isWarning: boolean;
  isDanger: boolean;
  isExpired: boolean;
  getAdjustedFinishedAt: () => string;
}

interface TimerSessionInput {
  id: string;
  startedAt: string;
  status: string;
  quiz: { durationMinutes: number };
}


export function useQuizTimer(
  session: TimerSessionInput,
  onExpire: () => void,
): QuizTimerState {
  const totalDurationSeconds = Math.max(0, Math.round(session.quiz.durationMinutes * 60));
  const { id: sessionId, startedAt, status } = session;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const firedRef = useRef(false);

  const totalPausedMsRef = useRef<number>(-1);

  if (totalPausedMsRef.current === -1) {
    const stored = readPauseData(sessionId);
    if (stored?.pausedAt) {
      const idleDuration = Date.now() - new Date(stored.pausedAt).getTime();
      totalPausedMsRef.current = (stored.totalPausedMs ?? 0) + Math.max(0, idleDuration);
      writePauseData(sessionId, { pausedAt: "", totalPausedMs: totalPausedMsRef.current });
    } else {
      totalPausedMsRef.current = stored?.totalPausedMs ?? 0;
    }
  }

  const computeRemaining = (): number => {
    if (totalDurationSeconds <= 0) return 0;
    const elapsedMs =
      Date.now() - new Date(startedAt).getTime() - totalPausedMsRef.current;
    return Math.max(0, totalDurationSeconds - Math.floor(elapsedMs / 1000));
  };

  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(
    computeRemaining,
  );

  useEffect(() => {
    if (totalDurationSeconds <= 0 || status !== "in-progress") return;

    const tick = () => {
      const remaining = computeRemaining();
      setTimeRemainingSeconds(remaining);

      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearPauseData(sessionId);
        onExpireRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, startedAt, totalDurationSeconds, status]);

  useEffect(() => {
    return () => {
      if (
        status === "in-progress" &&
        totalDurationSeconds > 0 &&
        !firedRef.current
      ) {
        writePauseData(sessionId, {
          pausedAt: new Date().toISOString(),
          totalPausedMs: totalPausedMsRef.current,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, status, totalDurationSeconds]);

  const isDanger =
    totalDurationSeconds > 0 &&
    timeRemainingSeconds >= 0 &&
    (timeRemainingSeconds <= Math.max(totalDurationSeconds * 0.1, 60) ||
      timeRemainingSeconds <= 90);

  const isWarning =
    !isDanger &&
    totalDurationSeconds > 0 &&
    timeRemainingSeconds <= totalDurationSeconds * 0.25;

  return {
    timeRemainingSeconds,
    totalDurationSeconds,
    isWarning,
    isDanger,
    isExpired: totalDurationSeconds > 0 && timeRemainingSeconds <= 0,
    getAdjustedFinishedAt: () => {
      const activeElapsedMs = Math.max(
        0,
        Date.now() - new Date(startedAt).getTime() - totalPausedMsRef.current,
      );
      return new Date(new Date(startedAt).getTime() + activeElapsedMs).toISOString();
    },
  };
}


export function formatCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  const minutes = Math.floor(s / 60);
  const secs = s % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}
