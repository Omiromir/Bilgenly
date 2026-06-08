import { useEffect, useMemo, useState } from "react";
import { Bell, Inbox } from "../../../components/icons/AppIcons";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardButton,
  dashboardPageClassName,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { NotificationList } from "../../../features/dashboard/components/notifications/NotificationsComponents";
import type { ClassInvitationNotification } from "../../../features/dashboard/components/notifications/notificationTypes";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

export function StudentNotificationsPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const {
    getNotificationsForRecipientIdentity,
    getUnreadCountForRecipientIdentity,
    markNotificationRead,
    updateClassInvitationStatus,
  } = useNotifications();
  const { acceptClassInvitation, declineClassInvitation, respondToClassInvitation } =
    useTeacherClasses();
  const [feedback, setFeedback] = useState<string | null>(null);
  const studentViewer = currentUser?.role === "student" ? currentUser : null;
  const studentIdentity = {
    userId: studentViewer?.id,
    email: studentViewer?.email,
  };
  const notificationRecipientId = studentViewer?.id ?? null;
  const notificationRecipientEmail = studentViewer?.email ?? null;

  const notifications = useMemo(
    () => {
      if (studentViewer) {
        return getNotificationsForRecipientIdentity(
          notificationRecipientId,
          notificationRecipientEmail,
        );
      }

      return [];
    },
    [
      getNotificationsForRecipientIdentity,
      notificationRecipientEmail,
      notificationRecipientId,
      studentViewer,
    ],
  );
  const unreadCount = notificationRecipientId || notificationRecipientEmail
    ? getUnreadCountForRecipientIdentity(
        notificationRecipientId,
        notificationRecipientEmail,
      )
    : 0;
  const pendingCount = notifications.filter(
    (notification) =>
      notification.type === "class_invitation" && notification.status === "pending",
  ).length;

  useEffect(() => {
    setFeedback(null);
  }, [studentViewer?.id]);

  const handleAcceptInvitation = async (notification: ClassInvitationNotification) => {
    try {
      await acceptClassInvitation(notification.relatedClassId);
      updateClassInvitationStatus(notification.id, "accepted");
      respondToClassInvitation(
        notification.relatedClassId,
        notification.studentId,
        "accepted",
        studentIdentity,
      );
      setFeedback(
        `You joined ${notification.relatedClassName}. It now appears in My Classes, and any assigned quizzes are unlocked there and in the Assigned tab of your Quiz Library.`,
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to join that class right now.",
      );
    }
  };

  const handleDeclineInvitation = async (notification: ClassInvitationNotification) => {
    updateClassInvitationStatus(notification.id, "declined");
    respondToClassInvitation(
      notification.relatedClassId,
      notification.studentId,
      "declined",
      studentIdentity,
    );

    try {
      await declineClassInvitation(notification.relatedClassId);
      setFeedback(`You declined the class invite to ${notification.relatedClassName}.`);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to decline that invite right now.",
      );
    }
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Notifications"}
        subtitle={
          meta?.subtitle ??
          "Review class invites, review requests, and other supported in-app updates for your student workspace."
        }
        actions={
          studentViewer ? (
            <DashboardButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                notifications.forEach((notification) =>
                  markNotificationRead(notification.id),
                );
              }}
              disabled={!unreadCount}
            >
              Mark all as read
            </DashboardButton>
          ) : null
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Unread"
          value={String(unreadCount)}
          change={unreadCount ? "Still needs your review" : "You are caught up"}
          icon={Bell}
          iconClassName="bg-[var(--dashboard-brand-soft-alt)] text-[var(--dashboard-brand)]"
        />
        <StatCard
          title="Pending Invites"
          value={String(pendingCount)}
          change={pendingCount ? "Ready to accept or decline" : "No pending class invites"}
          icon={Inbox}
          iconClassName="bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning)]"
        />
      </div>

      <SectionCard
        title="Student Inbox"
        description="In-app notifications stay here until you review them. Notifications are stored locally in this browser only — a backend notifications service is not connected yet, so they will not sync across devices or be delivered by email."
        contentClassName="space-y-5"
      >
        {feedback ? (
          <div className="rounded-[18px] border border-[var(--dashboard-success-soft)] bg-[var(--dashboard-success-soft)]/50 px-4 py-3">
            <p className="text-sm leading-6 text-[var(--dashboard-success)]">
              {feedback}
            </p>
          </div>
        ) : null}

        <NotificationList
          notifications={notifications}
          onAcceptInvitation={(notification) => {
            void handleAcceptInvitation(notification);
          }}
          onDeclineInvitation={(notification) => {
            void handleDeclineInvitation(notification);
          }}
          onMarkRead={(notification) => markNotificationRead(notification.id)}
        />
      </SectionCard>
    </div>
  );
}
