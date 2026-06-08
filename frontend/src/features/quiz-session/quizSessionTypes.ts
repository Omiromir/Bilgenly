import type {
  QuizAssignmentContext,
  QuizLibraryOwnerRole,
  QuizQuestionRecord,
  QuizRecord,
} from "../dashboard/components/quiz-library/quizLibraryTypes";
import type { SubmitAttemptResponseDto } from "./api/attemptsApi";

export type QuizSessionSourceType =
  | "quiz-library"
  | "assigned"
  | "generate-quiz"
  | "discover"
  | "saved"
  | "history"
  | "join-quiz"
  | "classes"
  | "overview";

export type QuizSessionStatus = "in-progress" | "completed";

export interface QuizSessionLaunchContext {
  viewerRole: "teacher" | "student";
  sourceType: QuizSessionSourceType;
  sourceLabel?: string;
  assignmentContext?: QuizAssignmentContext;
}

export interface QuizSessionQuestionState {
  questionId: string;
  selectedIndex: number | null;
  selectedIndices: number[];
  submitted: boolean;
  submittedAt?: string;
  isCorrect?: boolean;
}

export interface QuizSessionSnapshot {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: QuizRecord["difficulty"];
  language: string;
  questionCount: number;
  durationMinutes: number;
  creatorName: string;
  ownerRole: QuizLibraryOwnerRole;
  sourceLabel: string;
  note?: string;
  questions: QuizQuestionRecord[];
}

export interface QuizSessionRecord {
  id: string;
  quizId: string;
  viewerRole: "teacher" | "student";
  syncMode: "local" | "backend";
  backendAttemptId?: string;
  status: QuizSessionStatus;
  attemptNumber: number;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  completionReason?: "submitted" | "deadline-expired" | "time-limit-reached";
  sourceType: QuizSessionSourceType;
  sourceLabel: string;
  assignmentContext?: QuizAssignmentContext;
  quiz: QuizSessionSnapshot;
  currentQuestionIndex: number;
  questionStates: QuizSessionQuestionState[];
  correctCount: number;
  earnedPoints: number;
  backendSubmitResult?: SubmitAttemptResponseDto;
}

export interface QuizPlaybackSummary {
  practiceState: QuizRecord["practiceState"];
  practiceProgressLabel?: string;
  attemptCount?: number;
  averageScore?: string;
}

export interface QuizSessionResultSummary {
  correctCount: number;
  totalQuestions: number;
  incorrectCount: number;
  percentage: number;
  earnedPoints: number;
  totalPoints: number;
}

export interface QuizSessionStudentSummary {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface SharedAssignedQuizSessionRecord {
  id: string;
  quizId: string;
  assignmentId: string;
  classId: string;
  className: string;
  student: QuizSessionStudentSummary;
  session: QuizSessionRecord;
}
