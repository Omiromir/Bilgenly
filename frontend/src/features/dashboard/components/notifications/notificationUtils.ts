import type {
  ClassInvitationNotification,
  ClassInvitationNotificationInput,
  ClassInvitationNotificationStatus,
  DashboardNotification,
  QuizFollowUpKind,
  QuizFollowUpNotification,
  QuizFollowUpNotificationInput,
} from "./notificationTypes";
import { formatCurrentDateTime } from "../../settings/settingsPreferences";

export function createDashboardNotificationId() {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildClassInvitationNotification(
  input: ClassInvitationNotificationInput,
  options?: {
    existingId?: string;
    createdAt?: string;
    updatedAt?: string;
    read?: boolean;
    status?: ClassInvitationNotificationStatus;
  },
): ClassInvitationNotification {
  const timestamp = options?.updatedAt ?? new Date().toISOString();
  const status = options?.status ?? "pending";
  const message =
    status === "accepted"
      ? `You accepted ${input.senderName}'s invitation to join ${input.relatedClassName}.`
      : status === "declined"
        ? `You declined ${input.senderName}'s invitation to join ${input.relatedClassName}.`
        : status === "removed"
          ? `${input.senderName}'s invitation to join ${input.relatedClassName} is no longer active.`
          : `${input.senderName} invited you to join ${input.relatedClassName}.`;

  return {
    id: options?.existingId ?? createDashboardNotificationId(),
    type: "class_invitation",
    recipientUserId: input.recipientUserId,
    recipientEmail: input.recipientEmail,
    title: `Class invite: ${input.relatedClassName}`,
    message,
    createdAt: options?.createdAt ?? timestamp,
    updatedAt: timestamp,
    read: options?.read ?? false,
    actionType: "class_invitation",
    relatedClassId: input.relatedClassId,
    relatedClassName: input.relatedClassName,
    inviteCode: input.inviteCode,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    status,
  };
}

function getQuizFollowUpCopy(kind: QuizFollowUpKind) {
  switch (kind) {
    case "reassign_quiz":
      return {
        titlePrefix: "Another Attempt Requested",
        messagePrefix: "Your teacher asked you to try another attempt on",
      };
    case "follow_up_practice":
      return {
        titlePrefix: "Practice Follow-up",
        messagePrefix: "Your teacher suggested extra practice for",
      };
    case "needs_review":
    default:
      return {
        titlePrefix: "Review Request",
        messagePrefix: "Your teacher asked you to review",
      };
  }
}

export function buildQuizFollowUpNotification(
  input: QuizFollowUpNotificationInput,
  options?: {
    existingId?: string;
    createdAt?: string;
    updatedAt?: string;
    read?: boolean;
  },
): QuizFollowUpNotification {
  const timestamp = options?.updatedAt ?? new Date().toISOString();
  const copy = getQuizFollowUpCopy(input.followUpKind);

  return {
    id: options?.existingId ?? createDashboardNotificationId(),
    type: "quiz_follow_up",
    recipientUserId: input.recipientUserId,
    recipientEmail: input.recipientEmail,
    title: `${copy.titlePrefix}: ${input.quizTitle}`,
    message: `${copy.messagePrefix} ${input.quizTitle} in ${input.relatedClassName}. Open your class workspace to continue.`,
    createdAt: options?.createdAt ?? timestamp,
    updatedAt: timestamp,
    read: options?.read ?? false,
    actionType: "open_assigned_quiz",
    relatedClassId: input.relatedClassId,
    relatedClassName: input.relatedClassName,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    status: "sent",
    quizId: input.quizId,
    quizTitle: input.quizTitle,
    assignmentId: input.assignmentId,
    attemptId: input.attemptId,
    followUpKind: input.followUpKind,
  };
}

export function sortDashboardNotifications(
  notifications: DashboardNotification[],
) {
  return [...notifications].sort((left, right) => {
    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });
}

export function formatDashboardNotificationDateTime(date: string) {
  return formatCurrentDateTime(date);
}

export function getNotificationStatusLabel(notification: DashboardNotification) {
  if (notification.type === "quiz_follow_up") {
    return "In app";
  }
  if (notification.type === "quiz_removed_by_admin") {
    return "Admin action";
  }

  switch (notification.status) {
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "removed":
      return "Removed";
    case "pending":
    default:
      return "Pending";
  }
}

export function getNotificationStatusTone(notification: DashboardNotification) {
  if (notification.type === "quiz_follow_up") {
    return "info" as const;
  }
  if (notification.type === "quiz_removed_by_admin") {
    return "danger" as const;
  }

  switch (notification.status) {
    case "accepted":
      return "success" as const;
    case "declined":
      return "danger" as const;
    case "removed":
      return "neutral" as const;
    case "pending":
    default:
      return "warning" as const;
  }
}

export function getQuizFollowUpLabel(kind: QuizFollowUpKind) {
  switch (kind) {
    case "reassign_quiz":
      return "Another attempt";
    case "follow_up_practice":
      return "Practice";
    case "needs_review":
    default:
      return "Review request";
  }
}
