

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getUserScopedStorageKey } from "../providers/userScopedStorage";

const REMINDER_BASE_KEY = "bilgenly_reminder_last_shown";


function msUntilTime(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return -1;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  return target.getTime() - now.getTime();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getReminderKey(userId?: string | null): string {
  return userId
    ? getUserScopedStorageKey(REMINDER_BASE_KEY, `user:${userId.trim().toLowerCase()}`)
    : REMINDER_BASE_KEY;
}

function alreadyShownToday(userId?: string | null): boolean {
  try {
    return localStorage.getItem(getReminderKey(userId)) === todayKey();
  } catch {
    return false;
  }
}

function markShownToday(userId?: string | null): void {
  try {
    localStorage.setItem(getReminderKey(userId), todayKey());
  } catch {
  }
}

let _currentUserId: string | null = null;

async function fireReminder(): Promise<void> {
  markShownToday(_currentUserId);

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification("⏰ Time to study!", {
        body: "Your daily Bilgenly study session is starting now. Keep your streak going!",
        icon: "/logo.png",
        tag: "bilgenly-study-reminder",
      });
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("⏰ Time to study!", {
          body: "Your daily Bilgenly study session is starting now. Keep your streak going!",
          icon: "/logo.png",
          tag: "bilgenly-study-reminder",
        });
        return;
      }
    }
  }

  toast("⏰ Time to study!", {
    description: "Your daily study reminder. Keep your streak going!",
    duration: 10_000,
  });
}

export function useStudyReminder(
  reminderTime: string | null,
  userId?: string | null,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!reminderTime) return;
    _currentUserId = userId ?? null;
    if (alreadyShownToday(userId)) return;

    const ms = msUntilTime(reminderTime);

    if (ms < 0) {
      const msUntilTomorrow = ms + 24 * 60 * 60 * 1000;
      timerRef.current = setTimeout(() => {
        void fireReminder();
      }, msUntilTomorrow);
    } else {
      timerRef.current = setTimeout(() => {
        void fireReminder();
      }, ms);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [reminderTime, userId]);
}
