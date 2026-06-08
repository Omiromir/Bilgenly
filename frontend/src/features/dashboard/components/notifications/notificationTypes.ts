export type DashboardNotificationType =
  | "class_invitation"
  | "quiz_follow_up"
  | "quiz_removed_by_admin"
  | "invitation_response"
  | "achievement_alert"
  | "deadline_reminder";
export type ClassInvitationNotificationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "removed";
export type QuizFollowUpKind =
  | "needs_review"
  | "reassign_quiz"
  | "follow_up_practice";

interface DashboardNotificationBase {
  id: string;
  type: DashboardNotificationType;
  recipientUserId: string;
  recipientEmail: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  read: boolean;
  relatedClassId: string;
  relatedClassName: string;
  senderName: string;
  senderEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export interface ClassInvitationNotification extends DashboardNotificationBase {
  type: "class_invitation";
  actionType: "class_invitation";
  inviteCode: string;
  status: ClassInvitationNotificationStatus;
}

export interface QuizFollowUpNotification extends DashboardNotificationBase {
  type: "quiz_follow_up";
  actionType: "open_assigned_quiz";
  status: "sent";
  quizId: string;
  quizTitle: string;
  assignmentId: string;
  attemptId?: string;
  followUpKind: QuizFollowUpKind;
}

export interface QuizRemovedByAdminNotification extends DashboardNotificationBase {
  type: "quiz_removed_by_admin";
  actionType: "";
  status: "sent";
  quizId: string;
  quizTitle: string;
}

export interface InvitationResponseNotification extends DashboardNotificationBase {
  type: "invitation_response";
  actionType: "";
  status: "accepted" | "declined";
}

export interface AchievementAlertNotification extends DashboardNotificationBase {
  type: "achievement_alert";
  actionType: "";
  status: "sent";
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface DeadlineReminderNotification extends DashboardNotificationBase {
  type: "deadline_reminder";
  actionType: "";
  status: "sent";
  quizTitle: string;
  assignmentId: string;
  deadline: string;
  hoursUntilDeadline: number;
}

export type DashboardNotification =
  | ClassInvitationNotification
  | QuizFollowUpNotification
  | QuizRemovedByAdminNotification
  | InvitationResponseNotification
  | AchievementAlertNotification
  | DeadlineReminderNotification;

export interface ClassInvitationNotificationInput {
  recipientUserId: string;
  recipientEmail: string;
  relatedClassId: string;
  relatedClassName: string;
  inviteCode: string;
  senderName: string;
  senderEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export interface QuizFollowUpNotificationInput {
  recipientUserId: string;
  recipientEmail: string;
  relatedClassId: string;
  relatedClassName: string;
  senderName: string;
  senderEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  quizId: string;
  quizTitle: string;
  assignmentId: string;
  attemptId?: string;
  followUpKind: QuizFollowUpKind;
}

export interface AchievementAlertNotificationInput {
  recipientUserId: string;
  recipientEmail: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface DeadlineReminderNotificationInput {
  recipientUserId: string;
  recipientEmail: string;
  relatedClassId: string;
  relatedClassName: string;
  quizTitle: string;
  assignmentId: string;
  deadline: string;
  hoursUntilDeadline: number;
}
