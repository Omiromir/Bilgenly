export type DashboardNotificationType = "class_invitation";
export type DashboardNotificationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "removed";

export interface DashboardNotification {
  id: string;
  type: DashboardNotificationType;
  recipientUserId: string;
  recipientEmail: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
  actionType: "class_invitation";
  relatedClassId: string;
  relatedClassName: string;
  senderName: string;
  senderEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: DashboardNotificationStatus;
}

export interface ClassInvitationNotificationInput {
  recipientUserId: string;
  recipientEmail: string;
  relatedClassId: string;
  relatedClassName: string;
  senderName: string;
  senderEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}
