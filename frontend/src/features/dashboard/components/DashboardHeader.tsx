import {
  Bell,
  Info,
  LogOut,
  Menu,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useNotifications } from "../../../app/providers/NotificationsProvider";
import { cn } from "../../../components/ui/utils";
import {
  DashboardButton,
  DashboardSearchField,
  DashboardSurface,
  dashboardIconChipVariants,
  dashboardSectionDividerClassName,
  dashboardSelectVariants,
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
  const {
    role,
    signOut,
    availableStudents,
    currentStudent,
    currentUser,
    setCurrentStudentId,
  } = useAuth();
  const {
    getNotificationsForRecipient,
    getUnreadCountForRecipient,
    markAllNotificationsRead,
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

  const userMeta = {
    name: currentUser?.fullName ?? "Bilgenly User",
    email: currentUser?.email ?? "user@bilgenly.com",
    initials: currentUser?.initials ?? "BU",
    profilePath:
      role === "teacher"
        ? "/dashboard/teacher/profile"
        : role === "student"
          ? "/dashboard/student/profile"
          : "/dashboard/moderator",
    settingsPath:
      role === "teacher"
        ? "/dashboard/teacher/settings"
        : role === "student"
          ? "/dashboard/student/settings"
          : "/dashboard/moderator",
  };
  const notifications = currentUser
    ? getNotificationsForRecipient(currentUser.id)
    : [];
  const unreadCount = currentUser
    ? getUnreadCountForRecipient(currentUser.id)
    : 0;
  const previewNotifications = notifications.slice(0, 5);
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
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--dashboard-brand)] px-1.5 text-xs font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
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
                  {userMeta.initials}
                </div>
              </DashboardButton>
            </div>
          </div>

          <div className="relative flex justify-end">
            <DashboardSurface
              className={cn(
                "fixed left-4 right-4 top-[84px] z-30 overflow-hidden rounded-[20px] shadow-2xl shadow-slate-900/10 sm:absolute sm:left-auto sm:right-16 sm:top-0 sm:w-[380px] sm:max-w-[380px] sm:rounded-[24px]",
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
                  className="pt-1 text-sm font-medium text-[var(--dashboard-brand)] transition hover:text-[var(--dashboard-brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() =>
                    currentUser ? markAllNotificationsRead(currentUser.id) : undefined
                  }
                  disabled={!currentUser || !unreadCount}
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[min(65vh,380px)] overflow-y-auto">
                {previewNotifications.length ? (
                  previewNotifications.map((item) => (
                    <article
                      key={item.id}
                      className={cn(
                        "border-b px-4 py-4 last:border-b-0 sm:px-5",
                        dashboardSectionDividerClassName,
                        item.read ? "bg-white" : "bg-[var(--dashboard-brand-soft-alt)]/60",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={dashboardIconChipVariants({
                            tone:
                              item.status === "accepted"
                                ? "success"
                                : item.status === "declined"
                                  ? "danger"
                                  : "brand",
                            size: "md",
                          })}
                        >
                          <NotificationPreviewIcon />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                                  {item.title}
                                </p>
                                {!item.read ? (
                                  <span className="h-2 w-2 rounded-full bg-[var(--dashboard-brand)]" />
                                ) : null}
                              </div>
                              <p className="mt-1 text-[15px] leading-6 text-[var(--dashboard-text-soft)]">
                                {item.message}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm text-[var(--dashboard-text-faint)]">
                                  {formatDashboardNotificationDateTime(item.createdAt)}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                                    getNotificationStatusTone(item.status) === "success"
                                      ? "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]"
                                      : getNotificationStatusTone(item.status) === "danger"
                                        ? "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)]"
                                        : "bg-[var(--dashboard-warning-soft)] text-[var(--dashboard-warning)]",
                                  )}
                                >
                                  {getNotificationStatusLabel(item.status)}
                                </span>
                              </div>
                            </div>

                            {!item.read ? (
                              <button
                                type="button"
                                className="text-sm font-medium text-[var(--dashboard-brand)] transition hover:text-[var(--dashboard-brand-strong)]"
                                onClick={() => markNotificationRead(item.id)}
                              >
                                Mark read
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dashboard-surface-muted)] text-[var(--dashboard-text-faint)]">
                      <Info className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-[var(--dashboard-text-strong)]">
                      No notifications yet
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                      New class invitations and other important updates will show up here.
                    </p>
                  </div>
                )}
              </div>

              {role === "student" ? (
                <Link
                  to="/dashboard/student/notifications"
                  className={cn(
                    "block w-full border-t px-5 py-4 text-center text-[15px] font-semibold text-[var(--dashboard-brand)] transition hover:bg-[var(--dashboard-surface-muted)]",
                    dashboardSectionDividerClassName,
                  )}
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  Open notifications
                </Link>
              ) : null}
            </DashboardSurface>

            <DashboardSurface
              className={cn(
                dropdownBaseClassName,
                "w-full max-w-[300px] rounded-[16px] shadow-2xl shadow-slate-900/10",
                isProfileOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              radius="lg"
              padding="none"
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dashboard-brand)] text-lg font-semibold text-white">
                  {userMeta.initials}
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

              {role === "student" && currentStudent ? (
                <div className={cn("border-t px-4 py-4", dashboardSectionDividerClassName)}>
                  <p className="mb-2 text-sm font-semibold text-[var(--dashboard-text-strong)]">
                    Mock student session
                  </p>
                  <select
                    value={currentStudent.id}
                    onChange={(event) => setCurrentStudentId(event.target.value)}
                    className={cn(dashboardSelectVariants({ size: "sm" }), "w-full")}
                  >
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

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

function NotificationPreviewIcon() {
  return <UserPlus className="h-4 w-4" />;
}
