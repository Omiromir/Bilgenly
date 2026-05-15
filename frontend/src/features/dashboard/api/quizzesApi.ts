import { apiRequest } from "../../../lib/apiClient";
import type {
  CreateQuizRequest,
  QuizDto,
  UpdateQuizRequest,
} from "./dashboardApiTypes";

export function createQuiz(payload: CreateQuizRequest) {
  return apiRequest<QuizDto>("/api/Quiz", {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Unable to save quiz to backend.",
  });
}

export function getMyQuizzes() {
  return apiRequest<QuizDto[]>("/api/Quiz/My", {
    fallbackErrorMessage: "Unable to load your quizzes.",
  });
}

export function getQuizById(quizId: string) {
  return apiRequest<QuizDto>(`/api/Quiz/${quizId}`, {
    fallbackErrorMessage: "Unable to load quiz details.",
  });
}

export function updateQuiz(quizId: string, payload: UpdateQuizRequest) {
  return apiRequest<QuizDto>(`/api/Quiz/${quizId}`, {
    method: "PUT",
    body: payload,
    fallbackErrorMessage: "Unable to update quiz.",
  });
}

export function deleteQuiz(quizId: string) {
  return apiRequest<{ message: string }>(`/api/Quiz/${quizId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Unable to delete quiz.",
  });
}
