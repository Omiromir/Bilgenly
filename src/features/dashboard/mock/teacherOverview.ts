import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";

export interface OverviewStat {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  iconClassName: string;
}

export interface TeacherQuizItem {
  title: string;
  questionCount: string;
  className: string;
  accuracy: string;
}

export interface TeacherInsightItem {
  title: string;
  detail: string;
  value: string;
  tone: "blue" | "amber" | "emerald";
}

export const teacherOverviewStats: OverviewStat[] = [
  {
    title: "Quizzes Created",
    value: "28",
    change: "+4 this week",
    icon: FileText,
    iconClassName: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    title: "Active Classes",
    value: "5",
    icon: Users,
    iconClassName: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    title: "Avg Student Accuracy",
    value: "82%",
    change: "+3% vs last month",
    icon: BarChart3,
    iconClassName: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand-strong)]",
  },
  {
    title: "Drafts Needing Review",
    value: "3",
    icon: ClipboardList,
    iconClassName: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
];

export const teacherRecentQuizzes: TeacherQuizItem[] = [
  {
    title: "JavaScript Fundamentals",
    questionCount: "15 questions",
    className: "Frontend Bootcamp A",
    accuracy: "85%",
  },
  {
    title: "React Hooks Deep Dive",
    questionCount: "20 questions",
    className: "Frontend Bootcamp B",
    accuracy: "82%",
  },
  {
    title: "SQL Queries Practice",
    questionCount: "25 questions",
    className: "Database Systems",
    accuracy: "78%",
  },
];

export const teacherInsights: TeacherInsightItem[] = [
  {
    title: "Loops",
    detail: "Students struggle to identify exit conditions and nested iteration.",
    value: "74%",
    tone: "amber",
  },
  {
    title: "Arrays",
    detail: "Index access and mutation are improving after extra review.",
    value: "81%",
    tone: "blue",
  },
  {
    title: "Objects",
    detail: "Property access patterns still cause the most mistakes this week.",
    value: "69%",
    tone: "emerald",
  },
];
