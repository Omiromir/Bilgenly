import {
  Bell,
  Check,
  Clock3,
  MailCheck,
  MailOpen,
  MailX,
  UserPlus,
} from "lucide-react";
import { cn } from "../../../../components/ui/utils";
import { EmptyStateBlock } from "../EmptyStateBlock";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardInsetBlockClassName,
  dashboardMetaTextClassName,
} from "../DashboardPrimitives";
import type { DashboardNotification } from "./notificationTypes";
import {
  formatDashboardNotificationDateTime,
  getNotificationStatusLabel,
  getNotificationStatusTone,
} from "./notificationUtils";

interface NotificationListProps {
  notifications: DashboardNotification[];
  onAcceptInvitation?: (notification: DashboardNotification) => void;
  onDeclineInvitation?: (notification: DashboardNotification) => void;
  onMarkRead?: (notification: DashboardNotification) => void;
}

export function NotificationList({
  notifications,
  onAcceptInvitation,
  onDeclineInvitation,
  onMarkRead,
}: NotificationListProps) {
  if (!notifications.length) {
    return (
      <EmptyStateBlock
        title="No notifications yet"
        description="Class invitations and other important student updates will appear here once they exist in the shared workspace."
        icon={Bell}
        className="border-dashed"
      />
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <ClassInvitationNotificationCard
          key={notification.id}
          notification={notification}
          onAccept={() => onAcceptInvitation?.(notification)}
          onDecline={() => onDeclineInvitation?.(notification)}
          onMarkRead={() => onMarkRead?.(notification)}
        />
      ))}
    </div>
  );
}

interface ClassInvitationNotificationCardProps {
  notification: DashboardNotification;
  onAccept?: () => void;
  onDecline?: () => void;
  onMarkRead?: () => void;
}

export function ClassInvitationNotificationCard({
  notification,
  onAccept,
  onDecline,
  onMarkRead,
}: ClassInvitationNotificationCardProps) {
  const isPending = notification.status === "pending";

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read ? "bg-white" : "bg-[var(--dashboard-brand-soft-alt)]/45",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={dashboardIconChipVariants({ tone: "brand", size: "lg" })}>
              <UserPlus className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone={getNotificationStatusTone(notification.status)}>
                  {getNotificationStatusLabel(notification.status)}
                </DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {notification.status === "accepted" ? (
              <div className={dashboardIconChipVariants({ tone: "success", size: "md" })}>
                <MailCheck className="h-4 w-4" />
              </div>
            ) : notification.status === "declined" ? (
              <div className={dashboardIconChipVariants({ tone: "danger", size: "md" })}>
                <MailX className="h-4 w-4" />
              </div>
            ) : (
              <div className={dashboardIconChipVariants({ tone: "warning", size: "md" })}>
                <Clock3 className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Teacher</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {notification.senderName}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Class</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {notification.relatedClassName}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Received</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {formatDashboardNotificationDateTime(notification.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--dashboard-border-soft)] pt-4">
          <div className="flex items-center gap-2 text-sm text-[var(--dashboard-text-soft)]">
            {notification.read ? (
              <>
                <MailOpen className="h-4 w-4" />
                Marked as read
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Needs your attention
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!notification.read ? (
              <DashboardButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onMarkRead}
              >
                <Check className="h-4 w-4" />
                Mark read
              </DashboardButton>
            ) : null}

            {isPending ? (
              <DashboardButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={onDecline}
              >
                Decline
              </DashboardButton>
            ) : null}

            {isPending ? (
              <DashboardButton type="button" size="sm" onClick={onAccept}>
                Accept
              </DashboardButton>
            ) : null}
          </div>
        </div>
      </article>
    </DashboardSurface>
  );
}
