import {
  BookOpen,
  Flame,
  Medal,
  TrendingUp,
  type LucideIcon,
} from "../../../../components/icons/AppIcons";
import type { MyAttemptDto } from "../../../quiz-session/api/attemptsApi";
import { formatQuizAttemptDate } from "../../../quiz-session/quizSessionUtils";
import type { StudentQuizLibrarySources } from "../quiz-library/studentQuizLibrarySources";

export interface StudentOverviewStatItem {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  iconClassName: string;
}

export interface StudentOverviewRecentResultItem {
  title: string;
  date: string;
  score: string;
  detail: string;
  scoreTone: "blue" | "emerald";
}

interface StudentOverviewDataInput {
  studentSources: StudentQuizLibrarySources;
  /** Completed attempts from backend /api/attempts/my — sorted newest first. */
  completedAttempts: MyAttemptDto[];
  attemptsLoading: boolean;
  /**
   * Optional map of backendAttemptId → accurate points-based percentage from a
   * local QuizSessionRecord. When present, overrides the backend's
   * (correctAnswers/totalQuestions)-based score with the correct
   * (earnedPoints/totalPoints)-based value.
   */
  correctedScoreByAttemptId?: Map<string, number>;
  /**
   * Backend-authoritative badge count from /api/achievements.
   * When provided, replaces the local heuristic so Overview and Badges page
   * always show the same number.
   */
  badgesEarned?: number;
}

function getLocalDayStart(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function pluralize(value: number, noun: string) {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

/** Derive current and best streak from backend attempt dates (no localStorage dependency). */
function getStreaksFromAttempts(completedAttempts: MyAttemptDto[]) {
  const uniqueDayStarts = Array.from(
    new Set(
      completedAttempts
        .map((attempt) => attempt.dateTaken)
        .map((value) => getLocalDayStart(value))
        .filter((date): date is Date => date !== null)
        .map((date) => date.getTime()),
    ),
  )
    .sort((left, right) => left - right)
    .map((value) => new Date(value));

  if (!uniqueDayStarts.length) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let runningBest = 1;

  for (let index = 1; index < uniqueDayStarts.length; index += 1) {
    const previous = uniqueDayStarts[index - 1];
    const current = uniqueDayStarts[index];
    const difference =
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (difference === 1) {
      runningBest += 1;
      best = Math.max(best, runningBest);
    } else {
      runningBest = 1;
    }
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const latestDay = uniqueDayStarts[uniqueDayStarts.length - 1];
  const gapFromToday =
    (todayStart.getTime() - latestDay.getTime()) / (1000 * 60 * 60 * 24);

  if (gapFromToday > 1) {
    return { current: 0, best };
  }

  let current = 1;

  for (let index = uniqueDayStarts.length - 1; index > 0; index -= 1) {
    const latest = uniqueDayStarts[index];
    const previous = uniqueDayStarts[index - 1];
    const difference =
      (latest.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (difference !== 1) {
      break;
    }

    current += 1;
  }

  return { current, best };
}

function getCompletedThisWeek(completedAttempts: MyAttemptDto[]) {
  const sevenDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;

  return completedAttempts.filter((attempt) => {
    return getTimestamp(attempt.dateTaken) >= sevenDaysAgo;
  }).length;
}

/**
 * Badge unlock rules derived entirely from backend attempt data.
 * No localStorage dependency. "Fast finish" rule is omitted because
 * MyAttemptDto only has dateTaken (submit time), not a separate start time.
 */
function getUnlockedBadgeCount(
  studentSources: StudentQuizLibrarySources,
  completedAttempts: MyAttemptDto[],
  averageScore: number | null,
  perfectScores: number,
  currentStreak: number,
  completedThisWeek: number,
) {
  const assignmentCompletions = completedAttempts.filter((attempt) =>
    Boolean(attempt.assignmentId),
  ).length;

  const unlockedRules = [
    completedAttempts.length >= 1,
    completedAttempts.length >= 5,
    completedAttempts.length >= 10,
    perfectScores >= 1,
    currentStreak >= 3,
    currentStreak >= 7,
    completedThisWeek >= 3,
    studentSources.activeMemberships.length >= 2,
    assignmentCompletions >= 3,
    averageScore !== null && averageScore >= 85 && completedAttempts.length >= 3,
    averageScore !== null && averageScore >= 90 && completedAttempts.length >= 5,
  ];

  return unlockedRules.filter(Boolean).length;
}

function buildOverviewStats(
  studentSources: StudentQuizLibrarySources,
  completedAttempts: MyAttemptDto[],
  attemptsLoading: boolean,
  correctedScores?: Map<string, number>,
  badgesEarnedOverride?: number,
) {
  // Prefer session-based (points-accurate) percentage over backend score
  const scores = completedAttempts.map(
    (attempt) => correctedScores?.get(attempt.id) ?? attempt.score,
  );
  const latestAttempt = completedAttempts[0] ?? null;
  const latestScore = scores[0] ?? null;
  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : null;
  const perfectScores = scores.filter((score) => score === 100).length;
  const { current, best } = getStreaksFromAttempts(completedAttempts);
  const completedThisWeek = getCompletedThisWeek(completedAttempts);
  // Prefer backend-authoritative count; fall back to local heuristic only when
  // the achievements API hasn't responded yet.
  const badgeCount =
    badgesEarnedOverride !== undefined
      ? badgesEarnedOverride
      : getUnlockedBadgeCount(
          studentSources,
          completedAttempts,
          averageScore,
          perfectScores,
          current,
          completedThisWeek,
        );

  const latestDetailText =
    latestAttempt !== null
      ? `Latest result ${latestAttempt.correctAnswers}/${latestAttempt.totalQuestions} correct · ${correctedScores?.get(latestAttempt.id) ?? latestAttempt.score}%`
      : "Complete a quiz to track your progress";

  return [
    {
      title: "Current Streak",
      value: attemptsLoading ? "..." : pluralize(current, "day"),
      change:
        best > 0
          ? `Best: ${pluralize(best, "day")}`
          : "Finish quizzes on consecutive days to start a streak",
      icon: Flame,
      iconClassName:
        "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
    },
    {
      title: "Quizzes Completed",
      value: attemptsLoading ? "..." : String(completedAttempts.length),
      change: completedThisWeek
        ? `+${completedThisWeek} this week`
        : "No finished quizzes this week yet",
      icon: BookOpen,
      iconClassName:
        "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
    },
    {
      title: "Average Score",
      value: attemptsLoading ? "..." : averageScore === null ? "--" : `${averageScore}%`,
      change: attemptsLoading ? "Loading your results..." : latestDetailText,
      icon: TrendingUp,
      iconClassName:
        "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
    },
    {
      title: "Badges Earned",
      value: attemptsLoading ? "..." : String(badgeCount),
      change:
        perfectScores > 0
          ? `${perfectScores} perfect score${perfectScores === 1 ? "" : "s"} unlocked`
          : "Calculated from real study activity",
      icon: Medal,
      iconClassName:
        "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
    },
  ] satisfies StudentOverviewStatItem[];
}

function buildRecentResults(
  completedAttempts: MyAttemptDto[],
  correctedScores?: Map<string, number>,
) {
  return completedAttempts.slice(0, 3).map((attempt) => {
    // Prefer session-based (points-accurate) percentage over backend score
    const score = correctedScores?.get(attempt.id) ?? attempt.score;

    return {
      title: attempt.quizTitle,
      date: formatQuizAttemptDate(attempt.dateTaken),
      score: `${score}%`,
      detail: `${attempt.correctAnswers}/${attempt.totalQuestions} correct`,
      scoreTone: score >= 90 ? "emerald" : "blue",
    } satisfies StudentOverviewRecentResultItem;
  });
}

export function buildStudentOverviewData({
  studentSources,
  completedAttempts,
  attemptsLoading,
  correctedScoreByAttemptId,
  badgesEarned,
}: StudentOverviewDataInput) {
  return {
    stats: buildOverviewStats(studentSources, completedAttempts, attemptsLoading, correctedScoreByAttemptId, badgesEarned),
    recentResults: buildRecentResults(completedAttempts, correctedScoreByAttemptId),
  };
}
