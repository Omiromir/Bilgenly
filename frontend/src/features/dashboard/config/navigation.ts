import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  FilePlus2,
  Home,
  LogIn,
  Layers3,
  Medal,
  User,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { UserRole } from "../../../lib/auth";

export interface DashboardRouteMeta {
  path: string;
  role: UserRole;
  label: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  navVisible?: boolean;
  badge?: string;
  headerCtaLabel?: string;
  headerCtaTo?: string;
}

const dashboardRoutes: DashboardRouteMeta[] = [
  {
    path: "/dashboard/teacher/overview",
    role: "teacher",
    label: "Overview",
    title: "Teacher Overview",
    subtitle: "Monitor classroom activity, new quiz opportunities, and review priorities.",
    icon: Home,
    navVisible: true,
    badge: "Live today",
    headerCtaLabel: "Generate quiz",
    headerCtaTo: "/dashboard/teacher/generate-quiz",
  },
  {
    path: "/dashboard/teacher/generate-quiz",
    role: "teacher",
    label: "Generate Quiz",
    title: "Generate Quiz with AI",
    subtitle: "Start a new AI-assisted quiz workflow from lecture material, notes, or direct text input.",
    icon: FilePlus2,
    navVisible: true,
    badge: "Builder",
  },
  {
    path: "/dashboard/teacher/quiz-library",
    role: "teacher",
    label: "Quiz Library",
    title: "Quiz Library",
    subtitle: "Manage reusable drafts, published quizzes, and content ready to assign.",
    icon: BookOpen,
    navVisible: true,
    badge: "Content hub",
  },
  {
    path: "/dashboard/teacher/classes",
    role: "teacher",
    label: "Classes",
    title: "Classes",
    subtitle: "Organize rosters, active groups, and the next round of assignments.",
    icon: Users,
    navVisible: true,
    badge: "Roster",
  },
  {
    path: "/dashboard/teacher/analytics",
    role: "teacher",
    label: "Analytics",
    title: "Analytics",
    subtitle: "Track quiz performance, weak topics, and class-level learning trends.",
    icon: BarChart3,
    navVisible: true,
    badge: "Insights",
  },
  {
    path: "/dashboard/teacher/profile",
    role: "teacher",
    label: "My Profile",
    title: "My Profile",
    subtitle: "Review your teacher account details, activity metrics, and profile status.",
    icon: User,
    navVisible: false,
    badge: "Profile",
  },
  {
    path: "/dashboard/teacher/settings",
    role: "teacher",
    label: "Settings",
    title: "Settings",
    subtitle: "Control teaching preferences, notifications, and workspace defaults.",
    icon: Settings,
    navVisible: true,
  },
  {
    path: "/dashboard/student/overview",
    role: "student",
    label: "Overview",
    title: "Student Overview",
    subtitle: "Stay on top of assigned quizzes, progress, and your latest achievements.",
    icon: Home,
    navVisible: true,
    badge: "Keep going",
    headerCtaLabel: "Join quiz",
    headerCtaTo: "/dashboard/student/join-quiz",
  },
  {
    path: "/dashboard/student/join-quiz",
    role: "student",
    label: "Join Quiz",
    title: "Join a Quiz",
    subtitle: "Enter a quiz code and jump directly into your next assignment or class session.",
    icon: LogIn,
    navVisible: true,
    badge: "Quick entry",
  },
  {
    path: "/dashboard/student/quiz-library",
    role: "student",
    label: "Quiz Library",
    title: "Quiz Library",
    subtitle: "Discover public quizzes, revisit saved study sets, and launch self-paced practice from one library experience.",
    icon: BookOpen,
    navVisible: true,
    badge: "Discover",
  },
  {
    path: "/dashboard/student/generate-quiz",
    role: "student",
    label: "Generate Quiz",
    title: "Generate Self-Study Quiz",
    subtitle: "Turn your own notes or reading material into a personal practice quiz for revision and self-checking.",
    icon: FilePlus2,
    navVisible: true,
    badge: "AI practice",
  },
  {
    path: "/dashboard/student/results",
    role: "student",
    label: "My Results",
    title: "My Results",
    subtitle: "Review quiz history, score trends, and areas to improve next.",
    icon: Layers3,
    navVisible: true,
    badge: "History",
  },
  {
    path: "/dashboard/student/badges",
    role: "student",
    label: "Achievements",
    title: "Achievements",
    subtitle: "Track your milestones, earned rewards, and standing in class.",
    icon: Medal,
    navVisible: true,
    badge: "Milestones",
  },
  {
    path: "/dashboard/student/profile",
    role: "student",
    label: "My Profile",
    title: "My Profile",
    subtitle: "Review your student account details, learning metrics, and profile status.",
    icon: User,
    navVisible: false,
    badge: "Profile",
  },
  {
    path: "/dashboard/student/settings",
    role: "student",
    label: "Settings",
    title: "Settings",
    subtitle: "Adjust learning preferences, alerts, and your personal dashboard setup.",
    icon: Settings,
    navVisible: true,
  },
  {
    path: "/dashboard/moderator",
    role: "moderator",
    label: "Moderator",
    title: "Moderator Dashboard",
    subtitle: "Access moderation tools and keep the existing moderator workflow stable.",
    icon: ShieldCheck,
    navVisible: true,
    badge: "Stable",
  },
];

export interface DashboardNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export function getDashboardNavigation(role: UserRole | null) {
  if (!role) {
    return [];
  }

  return dashboardRoutes
    .filter((route) => route.role === role && route.navVisible)
    .map(({ label, path, icon }) => ({
      label,
      path,
      icon,
    })) satisfies DashboardNavItem[];
}

export function getDashboardRoutes() {
  return dashboardRoutes;
}
