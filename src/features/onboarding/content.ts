import { ChoiceOption, RecommendationCard, StepKey } from "./types";

export const progressMap: Record<StepKey, number> = {
  signup: 0,
  email: 0,
  welcome: 0,
  role: 1,
  goal: 2,
  experience: 3,
  pace: 4,
  reminder: 5,
  loading: 5,
  recommendations: 5,
};

export const totalSteps = 5;

export const roleOptions: ChoiceOption[] = [
  {
    id: "student",
    emoji: "🎓",
    label: "Student",
    sub: "I want to take quizzes and track my learning progress",
  },
  {
    id: "teacher",
    emoji: "📚",
    label: "Teacher",
    sub: "I want to upload materials and generate quizzes with AI",
  },
  {
    id: "other",
    emoji: "✨",
    label: "Just exploring",
    sub: "I'm curious about what Bilgenly can do",
  },
];

export const goalOptions: ChoiceOption[] = [
  {
    id: "ace",
    emoji: "🏆",
    label: "Ace my exams",
    sub: "Use AI quizzes to prepare and test my knowledge",
  },
  {
    id: "automate",
    emoji: "⚡",
    label: "Automate quiz creation",
    sub: "Upload lecture PDFs and let AI do the heavy lifting",
  },
  {
    id: "track",
    emoji: "📊",
    label: "Track student progress",
    sub: "Monitor engagement, scores, and performance over time",
  },
  {
    id: "explore",
    emoji: "🔍",
    label: "Just exploring",
    sub: "I want to see what Bilgenly can do",
  },
];

export const experienceOptions: ChoiceOption[] = [
  {
    id: "beginner",
    emoji: "🌱",
    label: "New to digital learning tools",
    sub: "I'm just getting started with online study platforms",
  },
  {
    id: "intermediate",
    emoji: "⚡",
    label: "Some experience",
    sub: "I've used learning tools but want something smarter",
  },
  {
    id: "advanced",
    emoji: "🔥",
    label: "Power user",
    sub: "I'm comfortable with edtech and want advanced features",
  },
];

export const paceOptions: ChoiceOption[] = [
  {
    id: "casual",
    emoji: "🌙",
    label: "Casual",
    sub: "A few quizzes per week when I have time",
  },
  {
    id: "regular",
    emoji: "☀️",
    label: "Regular",
    sub: "One study session per day",
  },
  {
    id: "focused",
    emoji: "⚡",
    label: "Focused",
    sub: "Multiple sessions a day - I'm serious about this",
  },
  {
    id: "sprint",
    emoji: "🔥",
    label: "Exam sprint",
    sub: "I have an upcoming exam and need to move fast",
  },
];

export const reminderTimes = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
];

export const recommendations: RecommendationCard[] = [
  {
    emoji: "🤖",
    tag: "AI Quizzes",
    tagColor: "#7C3AED",
    title: "Take your first AI-generated quiz",
    sub: "Auto-generated · 10 questions",
    time: "~5 min",
  },
  {
    emoji: "🏆",
    tag: "Gamification",
    tagColor: "#059669",
    title: "Earn your first 100 points",
    sub: "Complete quizzes to rank up",
    time: "Today",
  },
];
