import { useEffect, useMemo, useState } from "react";
import { Bell, Inbox, Users } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { useTeacherClasses } from "../../../app/providers/TeacherClassesProvider";
import { DashboardPageHeader } from "../../../features/dashboard/components/DashboardPageHeader";
import {
  DashboardBadge,
  DashboardButton,
  dashboardPageClassName,
  dashboardSelectVariants,
} from "../../../features/dashboard/components/DashboardPrimitives";
import { SectionCard } from "../../../features/dashboard/components/SectionCard";
import { StatCard } from "../../../features/dashboard/components/StatCard";
import { NotificationList } from "../../../features/dashboard/components/notifications/NotificationsComponents";
import type { DashboardNotification } from "../../../features/dashboard/components/notifications/notificationTypes";
import { useDashboardPageMeta } from "../../../features/dashboard/hooks/useDashboardPageMeta";

export function StudentNotificationsPage() {
  const meta = useDashboardPageMeta();
  const {
    availableStudents,
    currentStudent,
    setCurrentStudentId,
  } = useAuth();
  const {
    getNotificationsForRecipient,
    getUnreadCountForRecipient,
    markAllNotificationsRead,
    markNotificationRead,
  } = useNotifications();
  const { updateStudentStatus } = useTeacherClasses();
  const [feedback, setFeedback] = useState<string | null>(null);

  const notifications = useMemo(
    () =>
      currentStudent ? getNotificationsForRecipient(currentStudent.id) : [],
    [currentStudent, getNotificationsForRecipient],
  );
  const unreadCount = currentStudent
    ? getUnreadCountForRecipient(currentStudent.id)
    : 0;
  const pendingCount = notifications.filter(
    (notification) => notification.status === "pending",
  ).length;

  useEffect(() => {
    setFeedback(null);
  }, [currentStudent?.id]);

  const handleAcceptInvitation = (notification: DashboardNotification) => {
    updateStudentStatus(
      notification.relatedClassId,
      notification.studentId,
      "active",
    );
    setFeedback(
      `You joined ${notification.relatedClassName}. Any quizzes assigned to that class are now available in your Quiz Library.`,
    );
  };

  const handleDeclineInvitation = (notification: DashboardNotification) => {
    updateStudentStatus(
      notification.relatedClassId,
      notification.studentId,
      "declined",
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
          currentStudent ? (
            <DashboardButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => markAllNotificationsRead(currentStudent.id)}
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
        <StatCard
          title="Mock Students"
          value={String(availableStudents.length)}
          change="Switch student identity to test targeted notifications"
          icon={Users}
          iconClassName="bg-[var(--dashboard-brand-soft)] text-[var(--dashboard-brand-strong)]"
        />
      </div>

      <SectionCard
        title="Student Inbox"
        description="Notifications are stored in shared frontend state, so invitations stay available as you move through the dashboard."
        contentClassName="space-y-5"
      >
        <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--dashboard-border-soft)] bg-[var(--dashboard-surface-muted)] px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--dashboard-text-strong)]">
              Current mock student
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--dashboard-text-soft)]">
              Use the selector to verify that invitations land in the right student inbox
              before real auth and backend data are wired in.
            </p>
          </div>

          <label className="w-full max-w-[320px]">
            <span className="sr-only">Select current mock student</span>
            <select
              value={currentStudent?.id ?? ""}
              onChange={(event) => setCurrentStudentId(event.target.value)}
              className={dashboardSelectVariants({ size: "md" })}
            >
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} ({student.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        {currentStudent ? (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="info" size="md">
              Viewing as {currentStudent.fullName}
            </DashboardBadge>
            <DashboardBadge tone="neutral" size="md">
              {currentStudent.email}
            </DashboardBadge>
          </div>
        ) : null}

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
