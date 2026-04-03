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
  DashboardSearchField,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardSectionDividerClassName,
} from "./DashboardPrimitives";
import {
  formatDashboardNotificationDateTime,
  getNotificationStatusLabel,
  getNotificationStatusTone,
} from "./notifications/notificationUtils";

interface DashboardHeaderProps {
  onOpenSidebar: () => void;
}

export function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const { currentUser, role, signOut } = useAuth();
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
    const name = currentUser?.fullName ?? "Bilgenly User";
    const email = currentUser?.email ?? "user@bilgenly.com";

    switch (role) {
      case "teacher":
        return {
          name,
          email,
          profilePath: "/dashboard/teacher/profile",
          settingsPath: "/dashboard/teacher/settings",
        };
      case "student":
        return {
          name,
          email,
          profilePath: "/dashboard/student/profile",
          settingsPath: "/dashboard/student/settings",
        };
      case "moderator":
        return {
          name,
          email,
          profilePath: "/dashboard/moderator",
          settingsPath: "/dashboard/moderator",
        };
      default:
        return {
          name,
          email,
          profilePath: "/signin",
          settingsPath: "/signin",
        };
    }
  }, [currentUser, role]);
  const notificationsPath =
    role === "student" ? "/dashboard/student/notifications" : userMeta.settingsPath;

  const initials = userMeta.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dropdownBaseClassName =
    "absolute right-0 top-0 z-30 overflow-hidden transition";

  return (
    <header className="dashboard-topbar sticky top-0 z-20 border-b backdrop-blur">
      <div ref={headerRef} className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center justify-between gap-3 xl:flex-1">
              <DashboardButton
                type="button"
                onClick={onOpenSidebar}
                variant="secondary"
                size="icon"
                className="border border-[var(--dashboard-border)] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </DashboardButton>

              <DashboardSearchField
                containerClassName="hidden w-full max-w-xl lg:block"
                placeholder="Search..."
                size="lg"
              />
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
                aria-label="Profile"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {initials}
                </div>
              </DashboardButton>
            </div>
          </div>

          <div className="relative flex justify-end">
            <DashboardSurface
              className={cn(
                "fixed left-4 right-4 top-[84px] z-30 overflow-hidden rounded-[20px] shadow-2xl shadow-slate-900/10 sm:absolute sm:left-auto sm:right-16 sm:top-0 sm:w-[360px] sm:max-w-[360px] sm:rounded-[24px]",
                isNotificationsOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
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
                  className="pt-1 text-sm font-medium text-[var(--dashboard-brand)] transition hover:text-[var(--dashboard-brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
                          ? "bg-white"
                          : "bg-[var(--dashboard-brand-soft-alt)]/60",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={dashboardIconChipVariants({
                            tone: getNotificationStatusTone(notification.status),
                            size: "md",
                          })}
                        >
                          <NotificationIcon status={notification.status} />
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
                                  tone={getNotificationStatusTone(
                                    notification.status,
                                  )}
                                >
                                  {getNotificationStatusLabel(notification.status)}
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
                                className="text-[var(--dashboard-text-faint)] transition hover:text-[var(--dashboard-text-soft)]"
                                aria-label={`Mark ${notification.title} as read`}
                              >
                                <CircleCheckBig className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-[var(--dashboard-text-soft)]">
                    No notifications yet.
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
                "w-full max-w-[260px] rounded-[16px] shadow-2xl shadow-slate-900/10",
                isProfileOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              radius="lg"
              padding="none"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dashboard-brand)] text-lg font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[1.05rem] font-semibold text-[var(--dashboard-text-strong)]">
                    {userMeta.name}
                  </p>
                  <p className="truncate text-[15px] capitalize text-[var(--dashboard-text-soft)]">
                    {role ?? "user"}
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
                  className="flex w-full items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--dashboard-text)] transition hover:bg-[var(--dashboard-surface-muted)]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
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
  status,
}: {
  status: "pending" | "accepted" | "declined" | "removed";
}) {
  switch (status) {
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
