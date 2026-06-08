import { Link } from "react-router";
import { useQuizSessions } from "../../../../app/providers/QuizSessionProvider";
import {
  Bell,
  BookOpen,
  Check,
  Clock3,
  MailCheck,
  MailOpen,
  MailX,
  Send,
  ShieldCheck,
  Timer,
  Trophy,
  UserPlus,
  XCircle,
} from "../../../../components/icons/AppIcons";
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
import type {
  AchievementAlertNotification,
  ClassInvitationNotification,
  DashboardNotification,
  DeadlineReminderNotification,
  InvitationResponseNotification,
  QuizFollowUpNotification,
  QuizRemovedByAdminNotification,
} from "./notificationTypes";
import {
  formatDashboardNotificationDateTime,
  getNotificationStatusLabel,
  getNotificationStatusTone,
  getQuizFollowUpLabel,
} from "./notificationUtils";
import {
  buildQuizSessionPath,
  buildQuizSessionSearch,
} from "../../../quiz-session/quizRouting";

interface NotificationListProps {
  notifications: DashboardNotification[];
  onAcceptInvitation?: (notification: ClassInvitationNotification) => void;
  onDeclineInvitation?: (notification: ClassInvitationNotification) => void;
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
        description="Class invites and assigned quiz follow-ups appear here when in-app notification delivery is enabled."
        icon={Bell}
        className="border-dashed"
      />
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        if (notification.type === "class_invitation") {
          return (
            <ClassInvitationNotificationCard
              key={notification.id}
              notification={notification}
              onAccept={() => onAcceptInvitation?.(notification)}
              onDecline={() => onDeclineInvitation?.(notification)}
              onMarkRead={() => onMarkRead?.(notification)}
            />
          );
        }
        if (notification.type === "quiz_removed_by_admin") {
          return (
            <QuizRemovedByAdminNotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead?.(notification)}
            />
          );
        }
        if (notification.type === "invitation_response") {
          return (
            <InvitationResponseNotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead?.(notification)}
            />
          );
        }
        if (notification.type === "achievement_alert") {
          return (
            <AchievementAlertNotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead?.(notification)}
            />
          );
        }
        if (notification.type === "deadline_reminder") {
          return (
            <DeadlineReminderNotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => onMarkRead?.(notification)}
            />
          );
        }
        return (
          <QuizFollowUpNotificationCard
            key={notification.id}
            notification={notification}
            onMarkRead={() => onMarkRead?.(notification)}
          />
        );
      })}
    </div>
  );
}

interface ClassInvitationNotificationCardProps {
  notification: ClassInvitationNotification;
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
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : "bg-[var(--dashboard-brand-soft-alt)]/45",
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
                <DashboardBadge tone={getNotificationStatusTone(notification)}>
                  {getNotificationStatusLabel(notification)}
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
            ) : notification.status === "removed" ? (
              <div className={dashboardIconChipVariants({ tone: "neutral", size: "md" })}>
                <XCircle className="h-4 w-4" />
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

interface QuizFollowUpNotificationCardProps {
  notification: QuizFollowUpNotification;
  onMarkRead?: () => void;
}

function QuizFollowUpNotificationCard({
  notification,
  onMarkRead,
}: QuizFollowUpNotificationCardProps) {
  const { getLatestCompletedSession, getLatestInProgressSession } = useQuizSessions();
  const latestCompletedSession = getLatestCompletedSession(
    notification.quizId,
    "student",
    notification.assignmentId,
  );
  const latestInProgressSession = getLatestInProgressSession(
    notification.quizId,
    "student",
    notification.assignmentId,
  );
  const destinationSessionId =
    notification.followUpKind === "needs_review"
      ? latestCompletedSession?.id
      : notification.followUpKind === "reassign_quiz"
        ? latestInProgressSession?.id
        : latestInProgressSession?.id ?? latestCompletedSession?.id;
  const destinationHref = `${buildQuizSessionPath("student", notification.quizId)}${buildQuizSessionSearch({
    sessionId: destinationSessionId,
    assignmentId: notification.assignmentId,
  })}`;
  const actionLabel =
    notification.followUpKind === "needs_review"
      ? "Open Review Request"
      : notification.followUpKind === "reassign_quiz"
        ? "Open Assigned Quiz"
        : "Open Practice Follow-up";

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : "bg-[var(--dashboard-warning-soft)]/35",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={dashboardIconChipVariants({ tone: "warning", size: "lg" })}>
              <Send className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone={getNotificationStatusTone(notification)}>
                  {getNotificationStatusLabel(notification)}
                </DashboardBadge>
                <DashboardBadge tone="warning">
                  {getQuizFollowUpLabel(notification.followUpKind)}
                </DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className={dashboardIconChipVariants({ tone: "accent", size: "md" })}>
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Quiz</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {notification.quizTitle}
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
                In-app follow-up available
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
            <DashboardButton asChild type="button" size="sm" variant="secondary">
              <Link to={destinationHref}>{actionLabel}</Link>
            </DashboardButton>
          </div>
        </div>
      </article>
    </DashboardSurface>
  );
}

interface QuizRemovedByAdminNotificationCardProps {
  notification: QuizRemovedByAdminNotification;
  onMarkRead?: () => void;
}


function QuizRemovedByAdminNotificationCard({
  notification,
  onMarkRead,
}: QuizRemovedByAdminNotificationCardProps) {
  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : "bg-[var(--dashboard-danger-soft)]/35",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={dashboardIconChipVariants({ tone: "danger", size: "lg" })}>
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone="danger">Admin action</DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className={dashboardIconChipVariants({ tone: "danger", size: "md" })}>
            <XCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Removed quiz</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {notification.quizTitle}
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
                Removed by {notification.senderName || "an administrator"}
              </>
            )}
          </div>

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
        </div>
      </article>
    </DashboardSurface>
  );
}

interface InvitationResponseNotificationCardProps {
  notification: InvitationResponseNotification;
  onMarkRead?: () => void;
}


function InvitationResponseNotificationCard({
  notification,
  onMarkRead,
}: InvitationResponseNotificationCardProps) {
  const accepted = notification.status === "accepted";
  const tone = accepted ? "success" : "danger";
  const studentLabel = notification.studentName || notification.studentEmail;

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : accepted
            ? "bg-[var(--dashboard-success-soft)]/35"
            : "bg-[var(--dashboard-danger-soft)]/35",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={dashboardIconChipVariants({ tone, size: "lg" })}>
              {accepted ? (
                <MailCheck className="h-5 w-5" />
              ) : (
                <MailX className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone={tone}>
                  {accepted ? "Accepted" : "Declined"}
                </DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className={dashboardIconChipVariants({ tone, size: "md" })}>
            {accepted ? (
              <Check className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Student</p>
            <p className="mt-1 truncate font-semibold text-[var(--dashboard-text-strong)]">
              {studentLabel}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Class</p>
            <p className="mt-1 truncate font-semibold text-[var(--dashboard-text-strong)]">
              {notification.relatedClassName}
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
                <Clock3 className="h-4 w-4" />
                {formatDashboardNotificationDateTime(notification.createdAt)}
              </>
            )}
          </div>

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
        </div>
      </article>
    </DashboardSurface>
  );
}

interface AchievementAlertNotificationCardProps {
  notification: AchievementAlertNotification;
  onMarkRead?: () => void;
}

function AchievementAlertNotificationCard({
  notification,
  onMarkRead,
}: AchievementAlertNotificationCardProps) {
  const pct =
    notification.totalQuestions > 0
      ? Math.round((notification.correctAnswers / notification.totalQuestions) * 100)
      : notification.score;

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : "bg-[var(--dashboard-brand-soft-alt)]/45",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={dashboardIconChipVariants({ tone: "success", size: "lg" })}>
              <Trophy className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone="success">Achievement</DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div className={dashboardIconChipVariants({ tone: "success", size: "md" })}>
            <span className="text-xs font-bold">{pct}%</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Quiz</p>
            <p className="mt-1 truncate font-semibold text-[var(--dashboard-text-strong)]">
              {notification.quizTitle}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Score</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {notification.correctAnswers}/{notification.totalQuestions} ({pct}%)
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
                <Trophy className="h-4 w-4" />
                High score on this quiz
              </>
            )}
          </div>

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
        </div>
      </article>
    </DashboardSurface>
  );
}

interface DeadlineReminderNotificationCardProps {
  notification: DeadlineReminderNotification;
  onMarkRead?: () => void;
}

function DeadlineReminderNotificationCard({
  notification,
  onMarkRead,
}: DeadlineReminderNotificationCardProps) {
  const urgent = notification.hoursUntilDeadline < 3;

  return (
    <DashboardSurface
      radius="xl"
      padding="md"
      className={cn(
        "border transition",
        notification.read
          ? "bg-[var(--dashboard-surface)]"
          : urgent
            ? "bg-[var(--dashboard-danger-soft)]/30"
            : "bg-[var(--dashboard-brand-soft-alt)]/45",
      )}
    >
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={dashboardIconChipVariants({
                tone: urgent ? "danger" : "warning",
                size: "lg",
              })}
            >
              <Timer className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[1.15rem] font-semibold text-[var(--dashboard-text-strong)]">
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <DashboardBadge tone="brand">Unread</DashboardBadge>
                ) : null}
                <DashboardBadge tone={urgent ? "danger" : "warning"}>
                  {urgent ? "Due soon" : "Deadline"}
                </DashboardBadge>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--dashboard-text-soft)]">
                {notification.message}
              </p>
            </div>
          </div>

          <div
            className={dashboardIconChipVariants({
              tone: urgent ? "danger" : "warning",
              size: "md",
            })}
          >
            <Clock3 className="h-4 w-4" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Quiz</p>
            <p className="mt-1 truncate font-semibold text-[var(--dashboard-text-strong)]">
              {notification.quizTitle}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Class</p>
            <p className="mt-1 truncate font-semibold text-[var(--dashboard-text-strong)]">
              {notification.relatedClassName}
            </p>
          </div>
          <div className={dashboardInsetBlockClassName}>
            <p className={dashboardMetaTextClassName}>Deadline</p>
            <p className="mt-1 font-semibold text-[var(--dashboard-text-strong)]">
              {formatDashboardNotificationDateTime(notification.deadline)}
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
                <Timer className="h-4 w-4" />
                Deadline approaching
              </>
            )}
          </div>

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
        </div>
      </article>
    </DashboardSurface>
  );
}
