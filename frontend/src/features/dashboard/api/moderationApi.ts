import { apiRequest } from "../../../lib/apiClient";

export interface ReportDto {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedQuizId: string | null;
  reportedQuizTitle: string | null;
  reportedUserId: string | null;
  reportedUserName: string | null;
  reason: string;
  category: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface ModeratorDashboardDto {
  pendingReportsCount: number;
  activeSuspensionsCount: number;
  hiddenQuizzesCount: number;
  recentReports: ReportDto[];
}

export interface SuspendedUserDto {
  id: string;
  username: string;
  email: string;
  suspendedUntil: string | null;
  suspensionReason: string | null;
}

export interface HiddenQuizDto {
  id: string;
  title: string;
  authorName: string;
  moderationNote: string | null;
  createdAt: string;
}

export interface CreateReportRequest {
  reportedQuizId?: string | null;
  reportedUserId?: string | null;
  reason: string;
  category: string;
}

export interface ReviewReportRequest {
  status: "reviewed" | "dismissed";
  reviewNote?: string | null;
}

export interface SuspendUserRequest {
  reason: string;
  suspendedUntil?: string | null;
}

export interface HideQuizRequest {
  moderationNote?: string | null;
}

export interface ModerationQuizDto {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  isPublic: boolean;
  isHidden: boolean;
  moderationNote: string | null;
  hiddenAt: string | null;
  status: string;
  questionsCount: number;
  createdAt: string;
}

export interface ModerationUserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  createdAt: string;
}

export function getModeratorDashboard() {
  return apiRequest<ModeratorDashboardDto>("/api/moderation/dashboard", {
    fallbackErrorMessage: "Unable to load moderator dashboard.",
  });
}

export function getAllReports() {
  return apiRequest<ReportDto[]>("/api/moderation/reports", {
    fallbackErrorMessage: "Unable to load reports.",
  });
}

export function createReport(dto: CreateReportRequest) {
  return apiRequest<ReportDto>("/api/moderation/reports", {
    method: "POST",
    body: dto,
    fallbackErrorMessage: "Unable to submit report.",
  });
}

export function reviewReport(reportId: string, dto: ReviewReportRequest) {
  return apiRequest<ReportDto>(`/api/moderation/reports/${reportId}`, {
    method: "PUT",
    body: dto,
    fallbackErrorMessage: "Unable to review report.",
  });
}

export function getSuspendedUsers() {
  return apiRequest<SuspendedUserDto[]>("/api/moderation/users/suspended", {
    fallbackErrorMessage: "Unable to load suspended users.",
  });
}

export function suspendUser(userId: string, dto: SuspendUserRequest) {
  return apiRequest<SuspendedUserDto>(`/api/moderation/users/${userId}/suspend`, {
    method: "PUT",
    body: dto,
    fallbackErrorMessage: "Unable to suspend user.",
  });
}

export function unsuspendUser(userId: string) {
  return apiRequest<void>(`/api/moderation/users/${userId}/unsuspend`, {
    method: "PUT",
    fallbackErrorMessage: "Unable to unsuspend user.",
  });
}

export function getHiddenQuizzes() {
  return apiRequest<HiddenQuizDto[]>("/api/moderation/quizzes/hidden", {
    fallbackErrorMessage: "Unable to load hidden quizzes.",
  });
}

export function hideQuiz(quizId: string, dto: HideQuizRequest) {
  return apiRequest<HiddenQuizDto>(`/api/moderation/quizzes/${quizId}/hide`, {
    method: "PUT",
    body: dto,
    fallbackErrorMessage: "Unable to hide quiz.",
  });
}

export function unhideQuiz(quizId: string) {
  return apiRequest<void>(`/api/moderation/quizzes/${quizId}/unhide`, {
    method: "PUT",
    fallbackErrorMessage: "Unable to unhide quiz.",
  });
}

export function getAllQuizzesForModeration() {
  return apiRequest<ModerationQuizDto[]>("/api/moderation/quizzes", {
    fallbackErrorMessage: "Unable to load quizzes.",
  });
}

export function getAllUsersForModeration() {
  return apiRequest<ModerationUserDto[]>("/api/moderation/users", {
    fallbackErrorMessage: "Unable to load users.",
  });
}
