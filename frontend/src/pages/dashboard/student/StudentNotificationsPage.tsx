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
import type { DashboardNotification } from "../../../features/dashboard/components/notifications/notificationTypes";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

export function StudentNotificationsPage() {
  const meta = useDashboardPageMeta();
  const { currentUser } = useAuth();
  const {
    getNotificationsForRecipientIdentity,
    getUnreadCountForRecipientIdentity,
    markNotificationRead,
  } = useNotifications();
  const { respondToClassInvitation } = useTeacherClasses();
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
    (notification) => notification.status === "pending",
  ).length;

  useEffect(() => {
    setFeedback(null);
  }, [studentViewer?.id]);

  const handleAcceptInvitation = (notification: DashboardNotification) => {
    respondToClassInvitation(
      notification.relatedClassId,
      notification.studentId,
      "accepted",
      studentIdentity,
    );
    setFeedback(
      `You joined ${notification.relatedClassName}. It now appears in My Classes, and any assigned quizzes are unlocked there and in the Assigned tab of your Quiz Library.`,
    );
  };

  const handleDeclineInvitation = (notification: DashboardNotification) => {
    respondToClassInvitation(
      notification.relatedClassId,
      notification.studentId,
      "declined",
      studentIdentity,
    );
    setFeedback(`You declined the invitation to ${notification.relatedClassName}.`);
  };

  return (
    <div className={dashboardPageClassName}>
      <DashboardPageHeader
        title={meta?.title ?? "Notifications"}
        subtitle={
          meta?.subtitle ??
          "Review class invitations and the important updates that belong to your student workspace."
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
        description="Notifications are stored in shared frontend state, so invitations stay available as you move through the dashboard."
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
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
          onMarkRead={(notification) => markNotificationRead(notification.id)}
        />
      </SectionCard>
    </div>
  );
}
