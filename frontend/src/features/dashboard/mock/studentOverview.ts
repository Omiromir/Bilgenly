import type { LucideIcon } from "lucide-react";
import { BookOpen, Flame, Medal, Sparkles, TrendingUp } from "lucide-react";
import type { OverviewStat } from "./teacherOverview";

export interface StudentAssignment {
  title: string;
  questionCount: string;
  duration: string;
  dueDate: string;
}

export interface StudentResult {
  title: string;
  date: string;
  score: string;
  scoreTone: "blue" | "emerald";
}

export interface StudentMilestone {
  title: string;
  detail: string;
  icon: LucideIcon;
}

export const studentOverviewStats: OverviewStat[] = [
  {
    title: "Current Streak",
    value: "7 days",
    change: "Best: 12 days",
    icon: Flame,
    iconClassName: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
  {
    title: "Quizzes Completed",
    value: "24",
    change: "+3 this week",
    icon: BookOpen,
    iconClassName: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    title: "Average Score",
    value: "88%",
    change: "+5% improvement",
    icon: TrendingUp,
    iconClassName: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
  {
    title: "Badges Earned",
    value: "12",
    icon: Medal,
    iconClassName: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
];

export const studentAssignments: StudentAssignment[] = [
  {
    title: "JavaScript Fundamentals",
    questionCount: "15 questions",
    duration: "30 min",
    dueDate: "Due Mar 18, 2026",
  },
  {
    title: "React Hooks Deep Dive",
    questionCount: "20 questions",
    duration: "45 min",
    dueDate: "Due Mar 20, 2026",
  },
];

export const studentResults: StudentResult[] = [
  {
    title: "Python Data Structures",
    date: "Mar 12, 2026",
    score: "88%",
    scoreTone: "blue",
  },
  {
    title: "SQL Queries Practice",
    date: "Mar 10, 2026",
    score: "92%",
    scoreTone: "emerald",
  },
  {
    title: "HTML & CSS Basics",
    date: "Mar 8, 2026",
    score: "85%",
    scoreTone: "blue",
  },
];

export const studentMilestones: StudentMilestone[] = [
  {
    title: "Quick Learner",
    detail: "Earned for finishing 5 quizzes in one week.",
    icon: Sparkles,
  },
  {
    title: "Perfect Score",
    detail: "Unlocked by hitting 100% on a recent assignment.",
    icon: TrendingUp,
  },
];
