export interface TeacherQuizStep {
  step: number;
  label: string;
  active?: boolean;
}

export interface TeacherLibraryItem {
  title: string;
  category: string;
  questions: string;
  students: string;
  date: string;
  status: "published" | "draft" | "archived";
  averageScore: string;
}

export interface TeacherClassSummaryItem {
  label: string;
  value: string;
  change?: string;
  iconColor: string;
}

export interface TeacherClassRow {
  name: string;
  students: string;
  quizzes: string;
  avgScore: string;
  active?: boolean;
}

export interface TeacherTopStudent {
  name: string;
  className: string;
  score: string;
}

export interface TeacherAnalyticsSummary {
  title: string;
  value: string;
  change?: string;
  iconColor: string;
}

export interface TeacherScorePoint {
  label: string;
  value: number;
}

export interface TeacherTopicBar {
  label: string;
  value: number;
}

export interface TeacherCompletionSlice {
  label: string;
  value: number;
  color: string;
}

export interface TeacherStudentSupportItem {
  name: string;
  issue: string;
  score: string;
}

export interface TeacherSettingsGroup {
  title: string;
  description: string;
}

export const teacherQuizSteps: TeacherQuizStep[] = [
  { step: 1, label: "Upload", active: true },
  { step: 2, label: "Configure" },
  { step: 3, label: "Generate" },
];

export const teacherLibraryItems: TeacherLibraryItem[] = [
  {
    title: "JavaScript Fundamentals",
    category: "JavaScript",
    questions: "15 questions",
    students: "24 students",
    date: "Mar 10, 2026",
    status: "published",
    averageScore: "85%",
  },
  {
    title: "React Hooks Deep Dive",
    category: "React",
    questions: "20 questions",
    students: "0 students",
    date: "Mar 14, 2026",
    status: "draft",
    averageScore: "0%",
  },
  {
    title: "Python Data Structures",
    category: "Python",
    questions: "18 questions",
    students: "31 students",
    date: "Mar 12, 2026",
    status: "published",
    averageScore: "78%",
  },
  {
    title: "SQL Queries Practice",
    category: "Database",
    questions: "25 questions",
    students: "28 students",
    date: "Mar 8, 2026",
    status: "published",
    averageScore: "82%",
  },
  {
    title: "CSS Flexbox & Grid",
    category: "CSS",
    questions: "12 questions",
    students: "19 students",
    date: "Feb 28, 2026",
    status: "archived",
    averageScore: "88%",
  },
];

export const teacherClassSummary: TeacherClassSummaryItem[] = [
  {
    label: "Total Students",
    value: "102",
    change: "+12 this semester",
    iconColor: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    label: "Active Classes",
    value: "3",
    iconColor: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    label: "Average Class Size",
    value: "28",
    iconColor: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
];

export const teacherClasses: TeacherClassRow[] = [
  {
    name: "CS101 - Intro to Programming",
    students: "24 students",
    quizzes: "8 quizzes",
    avgScore: "Avg Score: 85%",
    active: true,
  },
  {
    name: "CS202 - Web Development",
    students: "31 students",
    quizzes: "12 quizzes",
    avgScore: "Avg Score: 78%",
    active: true,
  },
  {
    name: "CS301 - Data Structures",
    students: "28 students",
    quizzes: "15 quizzes",
    avgScore: "Avg Score: 82%",
    active: true,
  },
  {
    name: "CS150 - Python Basics",
    students: "19 students",
    quizzes: "6 quizzes",
    avgScore: "Avg Score: 88%",
  },
];

export const teacherTopStudents: TeacherTopStudent[] = [
  {
    name: "Aruzhan K.",
    className: "CS101 - Intro to Programming",
    score: "98%",
  },
  {
    name: "Timur S.",
    className: "CS301 - Data Structures",
    score: "96%",
  },
  {
    name: "Malika R.",
    className: "CS202 - Web Development",
    score: "94%",
  },
];

export const teacherAnalyticsSummary: TeacherAnalyticsSummary[] = [
  {
    title: "Overall Average",
    value: "85%",
    change: "+3% vs last month",
    iconColor: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    title: "Total Participants",
    value: "102",
    iconColor: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
  {
    title: "Completion Rate",
    value: "82%",
    change: "+5% improvement",
    iconColor: "bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]",
  },
  {
    title: "Top Score",
    value: "98%",
    iconColor: "bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]",
  },
];

export const teacherScoreTrend: TeacherScorePoint[] = [
  { label: "Week 1", value: 75 },
  { label: "Week 2", value: 78 },
  { label: "Week 3", value: 83 },
  { label: "Week 4", value: 86 },
  { label: "Week 5", value: 84 },
  { label: "Week 6", value: 88 },
];

export const teacherTopicPerformance: TeacherTopicBar[] = [
  { label: "Variables", value: 92 },
  { label: "Functions", value: 86 },
  { label: "Loops", value: 78 },
  { label: "Arrays", value: 81 },
  { label: "Objects", value: 73 },
];

export const teacherCompletionStatus: TeacherCompletionSlice[] = [
    { label: "Completed 82%", value: 82, color: "#5B4CF0" },
    { label: "Pending 18%", value: 18, color: "#E9EEF8" },
  ];

export const teacherStudentsNeedingSupport: TeacherStudentSupportItem[] = [
  {
    name: "Alex Martinez",
    issue: "Struggling with: Async Programming",
    score: "62%",
  },
  {
    name: "Jordan Lee",
    issue: "Struggling with: SQL Joins",
    score: "65%",
  },
  {
    name: "Mia Chen",
    issue: "Struggling with: Array Methods",
    score: "68%",
  },
];

export const teacherSettingsGroups: TeacherSettingsGroup[] = [
  {
    title: "Quiz generation defaults",
    description:
      "Future controls for difficulty, question count, and source parsing.",
  },
  {
    title: "Classroom notifications",
    description:
      "Future preferences for assignment reminders, result summaries, and review alerts.",
  },
];
