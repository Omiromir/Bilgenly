import { apiRequest } from "../../../lib/apiClient";
import type {
  AssignmentDto,
  AssignQuizToClassRequest,
  ClassDto,
  CreateClassRequest,
  JoinClassRequest,
  UpdateClassRequest,
} from "./dashboardApiTypes";

export function getTeacherClasses() {
  return apiRequest<ClassDto[]>("/api/classes/teacher", {
    fallbackErrorMessage: "Unable to load teacher classes.",
  });
}

export function createClass(payload: CreateClassRequest) {
  return apiRequest<ClassDto>("/api/classes", {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Unable to create class.",
  });
}

export function updateClass(classId: string, payload: UpdateClassRequest) {
  return apiRequest<ClassDto>(`/api/classes/${classId}`, {
    method: "PUT",
    body: payload,
    fallbackErrorMessage: "Unable to update class.",
  });
}

export function archiveClass(classId: string) {
  return apiRequest<{ message: string }>(`/api/classes/${classId}/archive`, {
    method: "PATCH",
    fallbackErrorMessage: "Unable to update class archive status.",
  });
}

export function deleteClass(classId: string) {
  return apiRequest<{ message: string }>(`/api/classes/${classId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Unable to delete class.",
  });
}

export function assignQuizToClass(
  classId: string,
  payload: AssignQuizToClassRequest,
) {
  return apiRequest<AssignmentDto>(`/api/classes/${classId}/assignments`, {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Unable to assign quiz to class.",
  });
}

export function getClassAssignments(classId: string) {
  return apiRequest<AssignmentDto[]>(`/api/classes/${classId}/assignments`, {
    fallbackErrorMessage: "Unable to load class assignments.",
  });
}

export function removeClassAssignment(classId: string, assignmentId: string) {
  return apiRequest<{ message: string }>(
    `/api/classes/${classId}/assignments/${assignmentId}`,
    {
      method: "DELETE",
      fallbackErrorMessage: "Unable to remove assigned quiz.",
    },
  );
}

export function getStudentClasses() {
  return apiRequest<ClassDto[]>("/api/classes/student", {
    fallbackErrorMessage: "Unable to load student classes.",
  });
}

export function removeStudentFromClass(classId: string, studentId: string) {
  return apiRequest<{ message: string }>(
    `/api/classes/${classId}/students/${studentId}`,
    {
      method: "DELETE",
      fallbackErrorMessage: "Unable to remove student from class.",
    },
  );
}

export function grantExtraAttempt(classId: string, assignmentId: string) {
  return apiRequest<{ message: string; maxAttempts: number | null; unlimited: boolean }>(
    `/api/classes/${classId}/assignments/${assignmentId}/grant-attempt`,
    {
      method: "PATCH",
      fallbackErrorMessage: "Unable to grant extra attempt.",
    },
  );
}

export function joinClassByInviteCode(payload: JoinClassRequest | string) {
  const request = typeof payload === "string" ? { inviteCode: payload } : payload;

  return apiRequest<ClassDto>("/api/classes/join", {
    method: "POST",
    body: request,
    fallbackErrorMessage: "Unable to join class.",
  });
}

export interface StudentSearchResult {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export function searchStudents(query: string) {
  return apiRequest<StudentSearchResult[]>(
    `/api/classes/student-search?q=${encodeURIComponent(query)}`,
    { fallbackErrorMessage: "Unable to search students." },
  );
}
