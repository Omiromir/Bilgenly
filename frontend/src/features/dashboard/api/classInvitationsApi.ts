import { apiRequest } from "../../../lib/apiClient";

export interface ClassInvitationDto {
  id: string;
  classId: string;
  className: string;
  recipientEmail: string;
  inviteCode: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface SendInvitationsResult {
  sent: ClassInvitationDto[];
  failed: string[];
}

export function sendClassInvitations(classId: string, emails: string[]) {
  return apiRequest<SendInvitationsResult>(`/api/classes/${classId}/invite`, {
    method: "POST",
    body: { emails },
    fallbackErrorMessage: "Unable to send class invitations.",
  });
}

export function getClassInvitations(classId: string) {
  return apiRequest<ClassInvitationDto[]>(`/api/classes/${classId}/invitations`, {
    fallbackErrorMessage: "Unable to load class invitations.",
  });
}

export function revokeClassInvitation(classId: string, invitationId: string) {
  return apiRequest<{ message: string }>(
    `/api/classes/${classId}/invitations/${invitationId}`,
    {
      method: "DELETE",
      fallbackErrorMessage: "Unable to revoke invitation.",
    },
  );
}
