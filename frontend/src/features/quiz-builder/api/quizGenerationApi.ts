import { getToken } from "../../auth/api";
import { apiRequest, getApiBaseUrl } from "../../../lib/apiClient";

export interface GenerateQuizConfigRequest {
  title: string;
  topic: string;
  topicFocus: string;
  questionCount: number;
  questionType: "MCQ" | "TrueFalse";
  additionalInstructions: string;
  text?: string;
}

export interface GeneratedQuizAnswerDto {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuizQuestionDto {
  id: string;
  text: string;
  questionType: string;
  explanation: string;
  position: number;
  answers: GeneratedQuizAnswerDto[];
  tags?: string[];
}

export interface GeneratedQuizResultDto {
  quizId: string;
  status: string;
  questionsGenerated: number;
  sourceSummary: string;
  generationTimeSeconds: number;
  questions: GeneratedQuizQuestionDto[];
}

export interface UpdateGeneratedQuizRequest {
  title: string;
  description: string;
  isPublic: boolean;
  questions: Array<{
    id?: string;
    text: string;
    questionType: string;
    explanation: string;
    position: number;
    answers: Array<{
      id?: string;
      text: string;
      isCorrect: boolean;
    }>;
    tags: string[];
  }>;
}

function extractResponseMessage(payload: unknown, fallbackMessage: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallbackMessage;
}

async function parseResponse<T>(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(extractResponseMessage(payload, fallbackMessage));
  }

  return payload as T;
}

export async function generateQuizFromText(payload: GenerateQuizConfigRequest) {
  return apiRequest<GeneratedQuizResultDto>("/api/quiz-generation/from-text", {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Unable to generate quiz from text.",
  });
}

export async function generateQuizFromPdf(
  file: File,
  payload: Omit<GenerateQuizConfigRequest, "text">,
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("title", payload.title);
  formData.set("topic", payload.topic);
  formData.set("topicFocus", payload.topicFocus);
  formData.set("questionCount", String(payload.questionCount));
  formData.set("questionType", payload.questionType);
  formData.set("additionalInstructions", payload.additionalInstructions);

  const response = await fetch(`${getApiBaseUrl()}/api/quiz-generation/from-pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken() ?? ""}`,
    },
    body: formData,
  });

  return parseResponse<GeneratedQuizResultDto>(
    response,
    "Unable to generate quiz from PDF.",
  );
}

export async function saveGeneratedQuizReview(
  quizId: string,
  payload: UpdateGeneratedQuizRequest,
) {
  const response = await fetch(`${getApiBaseUrl()}/api/quiz-generation/${quizId}/review`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken() ?? ""}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<GeneratedQuizResultDto>(
    response,
    "Unable to save generated quiz review.",
  );
}
