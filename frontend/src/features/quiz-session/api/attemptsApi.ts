import { apiRequest } from "../../../lib/apiClient";

export interface AttemptQuestionAnswerDto {
  id: string;
  text: string;
}

export interface AttemptQuestionDto {
  id: string;
  text: string;
  questionType: string;
  position: number;
  answers: AttemptQuestionAnswerDto[];
}

export interface StartAttemptResponseDto {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  questions: AttemptQuestionDto[];
}

export interface SubmitAttemptAnswerDto {
  questionId: string;
  answerId: string;
}

export interface SubmitAttemptRequestDto {
  answers: SubmitAttemptAnswerDto[];
}

export interface AttemptQuestionResultDto {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface SubmitAttemptResponseDto {
  attemptId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  questions: AttemptQuestionResultDto[];
}

export interface MyAttemptDto {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  dateTaken: string;
  finishedAt?: string | null;
  durationSeconds?: number | null;
  isCompleted: boolean;
  totalQuestions: number;
  correctAnswers: number;
  questions: MyAttemptQuestionReviewDto[];
  assignmentId?: string;
}

export interface MyAttemptQuestionReviewOptionDto {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MyAttemptQuestionReviewDto {
  questionId: string;
  questionText: string;
  questionType: string;
  position: number;
  explanation: string;
  selectedAnswerId?: string | null;
  selectedAnswerText?: string | null;
  correctAnswerId?: string | null;
  correctAnswerText?: string | null;
  isCorrect: boolean;
  answerOptions: MyAttemptQuestionReviewOptionDto[];
}

export interface QuizAttemptDto {
  attemptId: string;
  quizId: string;
  score: number;
  isCompleted: boolean;
  dateTaken: string;
}

export function startAttempt(quizId: string) {
  return apiRequest<StartAttemptResponseDto>(`/api/quizzes/${quizId}/attempt`, {
    method: "POST",
    fallbackErrorMessage: "Unable to start quiz attempt.",
  });
}

export function submitAttempt(
  attemptId: string,
  payload: SubmitAttemptRequestDto,
) {
  return apiRequest<SubmitAttemptResponseDto>(`/api/attempts/${attemptId}/submit`, {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Unable to submit quiz attempt.",
  });
}

export function getMyAttempts() {
  return apiRequest<MyAttemptDto[]>("/api/attempts/my", {
    fallbackErrorMessage: "Unable to load your attempts.",
  });
}

export function getAttemptsByQuiz(quizId: string) {
  return apiRequest<QuizAttemptDto[]>(`/api/attempts/quiz/${quizId}`, {
    fallbackErrorMessage: "Unable to load quiz attempts.",
  });
}
