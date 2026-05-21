import {
  Bell,
  CircleAlert,
  CircleCheckBig,
  Info,
  LogOut,
  Menu,
  Settings,
  User,
} from "../../../components/icons/AppIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { cn } from "../../../components/ui/utils";
import {
  DashboardBadge,
  DashboardButton,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardSectionDividerClassName,
} from "./DashboardPrimitives";
import {
  formatDashboardNotificationDateTime,
  getNotificationStatusLabel,
  getNotificationStatusTone,
} from "./notifications/notificationUtils";
import type { DashboardNotification } from "./notifications/notificationTypes";
import { useDashboardViewer } from "../hooks/useDashboardViewer";
import { resolveAvatarUrl } from "../../profile/avatars";

interface DashboardHeaderProps {
  onOpenSidebar: () => void;
}

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const { currentUser, role, signOut } = useAuth();
  const dashboardViewer = useDashboardViewer();
  const {
    getNotificationsForRecipientIdentity,
    getUnreadCountForRecipientIdentity,
    markNotificationRead,
  } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const recipientUserId = currentUser?.id ?? "";
  const recipientEmail = currentUser?.email ?? "";
  const notifications = useMemo(
    () =>
      recipientUserId
        ? getNotificationsForRecipientIdentity(
            recipientUserId,
            recipientEmail,
          ).slice(0, 5)
        : [],
    [getNotificationsForRecipientIdentity, recipientEmail, recipientUserId],
  );
  const unreadCount = recipientUserId
    ? getUnreadCountForRecipientIdentity(recipientUserId, recipientEmail)
    : 0;

  const userMeta = useMemo(() => {
    const name = dashboardViewer?.fullName ?? "Bilgenly User";
    const email = dashboardViewer?.email ?? "";
    const roleLabel = dashboardViewer?.roleLabel ?? (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User");

    switch (role) {
      case "teacher":
        return {
          name,
          email,
          roleLabel,
          profilePath: "/dashboard/teacher/profile",
          settingsPath: "/dashboard/teacher/settings",
        };
      case "student":
        return {
          name,
          email,
          roleLabel,
          profilePath: "/dashboard/student/profile",
          settingsPath: "/dashboard/student/settings",
        };
      case "moderator":
        return {
          name,
          email,
          roleLabel,
          profilePath: "/dashboard/moderator",
          settingsPath: "/dashboard/moderator",
        };
      default:
        return {
          name,
          email,
          roleLabel,
          profilePath: "/signin",
          settingsPath: "/signin",
        };
    }
  }, [dashboardViewer?.email, dashboardViewer?.fullName, dashboardViewer?.roleLabel, role]);
  const notificationsPath =
    role === "student"
      ? "/dashboard/student/notifications"
      : role === "teacher"
        ? "/dashboard/teacher/notifications"
        : userMeta.settingsPath;

  const initials = userMeta.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = resolveAvatarUrl(dashboardViewer?.avatarUrl ?? null);
  const dropdownBaseClassName =
    "absolute right-0 top-0 z-30 overflow-hidden transition";

  return (
    <header className="dashboard-topbar sticky top-0 z-20 border-b backdrop-blur">
      <div ref={headerRef} className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DashboardButton
                type="button"
                onClick={onOpenSidebar}
                variant="secondary"
                size="icon"
                className="border border-[var(--dashboard-border)] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </DashboardButton>
            </div>

            <div className="flex items-center justify-between gap-4 xl:justify-end">
              <DashboardButton
                type="button"
                onClick={() => {
                  setIsNotificationsOpen((current) => !current);
                  setIsProfileOpen(false);
                }}
                variant="ghost"
                size="icon"
                className="relative text-[var(--dashboard-text)]"
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
                aria-haspopup="true"
              >
                <Bell className="h-5 w-5" />
                {unreadCount ? (
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[var(--dashboard-brand)]" />
                ) : null}
              </DashboardButton>

              <DashboardButton
                type="button"
                onClick={() => {
                  setIsProfileOpen((current) => !current);
                  setIsNotificationsOpen(false);
                }}
                variant="ghost"
                size="md"
                className="px-3"
                aria-label="Profile menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dashboard-surface-elevated)] text-sm font-semibold text-[var(--dashboard-text-strong)] ring-1 ring-[var(--dashboard-border-soft)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${userMeta.name} avatar`}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
              </DashboardButton>
            </div>
          </div>

          <div className="relative flex justify-end">
            <DashboardSurface
              role="region"
              aria-label="Notifications panel"
              className={cn(
                "fixed left-4 right-4 top-[84px] z-30 overflow-hidden rounded-[20px] shadow-[var(--dashboard-shadow-overlay)] transition-[opacity,visibility] sm:absolute sm:left-auto sm:right-16 sm:top-0 sm:w-[360px] sm:max-w-[360px] sm:rounded-[24px]",
                isNotificationsOpen
                  ? "visible pointer-events-auto opacity-100"
                  : "invisible pointer-events-none opacity-0",
              )}
              radius="lg"
              padding="none"
            >
              <div
                className={cn(
                  "flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5",
                  dashboardSectionDividerClassName,
                )}
              >
                <div>
                  <h3 className="text-[1.35rem] font-semibold text-[var(--dashboard-text-strong)] sm:text-[1.6rem]">
                    Notifications
                  </h3>
                  <p className="text-sm text-[var(--dashboard-text-soft)]">
                    {unreadCount} unread
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    notifications.forEach((notification) =>
                      markNotificationRead(notification.id),
                    );
                  }}
                  className="rounded-md pt-1 text-sm font-medium text-[var(--dashboard-brand)] transition hover:text-[var(--dashboard-brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-brand)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!recipientUserId || unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[min(65vh,356px)] overflow-y-auto">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={cn(
                        "border-b px-4 py-4 last:border-b-0 sm:px-5",
                        dashboardSectionDividerClassName,
                        notification.read
                          ? "bg-[var(--dashboard-surface)]"
                          : "bg-[var(--dashboard-brand-soft-alt)]/60",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={dashboardIconChipVariants({
                            tone: getNotificationStatusTone(notification),
                            size: "md",
                          })}
                        >
                          <NotificationIcon notification={notification} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                                  {notification.title}
                                </p>
                                {!notification.read ? (
                                  <span className="h-2 w-2 rounded-full bg-[var(--dashboard-brand)]" />
                                ) : null}
                                <DashboardBadge
                                  tone={getNotificationStatusTone(notification)}
                                >
                                  {getNotificationStatusLabel(notification)}
                                </DashboardBadge>
                              </div>
                              <p className="mt-1 text-[15px] leading-6 text-[var(--dashboard-text-soft)]">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-sm text-[var(--dashboard-text-faint)]">
                                {formatDashboardNotificationDateTime(
                                  notification.createdAt,
                                )}
                              </p>
                            </div>

                            {!notification.read ? (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(notification.id)}
                                className="rounded-md text-[var(--dashboard-text-faint)] transition hover:text-[var(--dashboard-text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-brand)] focus-visible:ring-offset-1"
                                aria-label={`Mark "${notification.title}" as read`}
                              >
                                <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-[var(--dashboard-text-soft)]">
                    No in-app notifications yet.
                  </div>
                )}
              </div>

              <Link
                to={notificationsPath}
                className={cn(
                  "block w-full border-t px-5 py-4 text-center text-[15px] font-semibold text-[var(--dashboard-brand)] transition hover:bg-[var(--dashboard-surface-muted)]",
                  dashboardSectionDividerClassName,
                )}
                onClick={() => setIsNotificationsOpen(false)}
              >
                View all notifications
              </Link>
            </DashboardSurface>

            <DashboardSurface
              className={cn(
                dropdownBaseClassName,
                "w-full max-w-[280px] rounded-[16px] shadow-[var(--dashboard-shadow-overlay)] transition-[opacity,visibility]",
                isProfileOpen
                  ? "visible pointer-events-auto opacity-100"
                  : "invisible pointer-events-none opacity-0",
              )}
              radius="lg"
              padding="none"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--dashboard-brand)] text-lg font-semibold text-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${userMeta.name} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                    {userMeta.name}
                  </p>
                  <p className="truncate text-[15px] capitalize text-[var(--dashboard-text-soft)]">
                    {userMeta.roleLabel}
                  </p>
                  <p className="truncate pt-1 text-sm text-[var(--dashboard-text-soft)]">
                    {userMeta.email}
                  </p>
                </div>
              </div>

              <div className={cn("border-t py-2", dashboardSectionDividerClassName)}>
                <Link
                  to={userMeta.profilePath}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-surface-muted)]"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link
                  to={userMeta.settingsPath}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-surface-muted)]"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>

              <div className={cn("border-t py-2", dashboardSectionDividerClassName)}>
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--dashboard-brand)]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </DashboardSurface>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationIcon({
  notification,
}: {
  notification: DashboardNotification;
}) {
  if (notification.type === "quiz_follow_up") {
    return <Bell className="h-4 w-4" />;
  }

  switch (notification.status) {
    case "accepted":
      return <CircleCheckBig className="h-4 w-4" />;
    case "declined":
      return <CircleAlert className="h-4 w-4" />;
    case "removed":
      return <Info className="h-4 w-4" />;
    case "pending":
    default:
      return <Info className="h-4 w-4" />;
  }
}
