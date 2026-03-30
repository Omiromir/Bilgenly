import type { LucideIcon } from "lucide-react";

export type QuizLibraryOwnerRole = "teacher" | "student";
export type QuizLibraryStatus =
  | "draft"
  | "generated"
  | "edited"
  | "published-private"
  | "published-public"
  | "archived";

export type QuizLibraryVisibility = "private" | "public";
export type QuizDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type QuizPracticeState = "ready" | "in-progress" | "completed";
export type QuizLibrarySource =
  | "assigned"
  | "discover"
  | "generated"
  | "saved"
  | "history";

export interface QuizAssignmentContext {
  assignmentId: string;
  classId: string;
  className: string;
  classSubject: string;
  assignedAt: string;
  assignedBy: string;
  assignedByName: string;
  visibility: "class-members";
  status: "assigned";
}

export interface QuizQuestionRecord {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface QuizRecord {
  id: string;
  ownerRole: QuizLibraryOwnerRole;
  ownerName: string;
  sourceQuizId?: string;
  savedByRoles?: QuizLibraryOwnerRole[];
  title: string;
  description: string;
  topic: string;
  difficulty: QuizDifficulty;
  language: string;
  questionCount: number;
  durationMinutes: number;
  updatedAt: string;
  status: QuizLibraryStatus;
  visibility: QuizLibraryVisibility;
  tags: string[];
  sourceLabel: string;
  note?: string;
  questions: QuizQuestionRecord[];
  learnerCount?: number;
  averageScore?: string;
  saveCount?: number;
  attemptCount?: number;
  practiceState?: QuizPracticeState;
  practiceProgressLabel?: string;
}

export interface QuizLibraryItem {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: QuizDifficulty;
  language: string;
  creatorName: string;
  questionCount: number;
  durationMinutes: number;
  updatedAt: string;
  status: QuizLibraryStatus;
  visibility: QuizLibraryVisibility;
  tags: string[];
  sourceLabel: string;
  note?: string;
  sourceType?: QuizLibrarySource;
  assignmentContext?: QuizAssignmentContext;
  isOwner?: boolean;
  isSaved?: boolean;
  isRecommended?: boolean;
  isAssigned?: boolean;
  isGeneratedByCurrentUser?: boolean;
  learnerCount?: number;
  averageScore?: string;
  saveCount?: number;
  attemptCount?: number;
  practiceState?: QuizPracticeState;
  practiceProgressLabel?: string;
}

export interface QuizLibraryTab<TTab extends string = string> {
  id: TTab;
  label: string;
  description: string;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
}

export interface QuizLibraryFilterOption {
  label: string;
  value: string;
}

export interface QuizLibraryFilterDefinition {
  id: string;
  label: string;
  value: string;
  options: QuizLibraryFilterOption[];
  onChange: (value: string) => void;
}

export interface QuizCardMetadataItem {
  icon: LucideIcon;
  label: string;
}

export interface QuizCardAction {
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "soft" | "ghost";
  onClick?: () => void;
}
