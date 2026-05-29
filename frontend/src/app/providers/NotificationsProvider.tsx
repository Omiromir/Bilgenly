import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthProvider";
import { getUserScopedStorageKey } from "./userScopedStorage";
import {
  buildClassInvitationNotification,
  buildQuizFollowUpNotification,
  sortDashboardNotifications,
} from "../../features/dashboard/components/notifications/notificationUtils";
import type {
  ClassInvitationNotificationInput,
  ClassInvitationNotificationStatus,
  DashboardNotification,
  QuizFollowUpKind,
  QuizFollowUpNotificationInput,
} from "../../features/dashboard/components/notifications/notificationTypes";
import {
  createDefaultUserSettings,
  getSettingsStorageScope,
  readUserSettings,
} from "../../features/dashboard/settings/userSettings";
import type { BackendNotificationDto } from "../../features/dashboard/api/notificationsApi";
import {
  createQuizFollowUpNotification,
  deleteNotificationApi,
  deleteNotificationsForClassApi,
  getMyNotifications,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  updateNotificationStatusApi,
  upsertClassInvitationNotification,
} from "../../features/dashboard/api/notificationsApi";

const NOTIFICATIONS_BASE_KEY = "bilgenly_notifications";
const AUTH_TOKEN_KEY = "bilgenly_token";

function hasAuthToken() {
  return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
}

/** Returns a user-scoped cache key, or the base key for anonymous sessions. */
function getNotificationsStorageKey(userId?: string | null): string {
  return userId
    ? getUserScopedStorageKey(
        NOTIFICATIONS_BASE_KEY,
        `user:${userId.trim().toLowerCase()}`,
      )
    : NOTIFICATIONS_BASE_KEY;
}

function fromBackendDto(dto: BackendNotificationDto): DashboardNotification | null {
  const base = {
    id: dto.id,
    recipientUserId: dto.recipientUserId,
    recipientEmail: dto.recipientEmail,
    title: dto.title,
    message: dto.message,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    read: dto.read,
    relatedClassId: dto.relatedClassId,
    relatedClassName: dto.relatedClassName,
    senderName: dto.senderName,
    senderEmail: dto.senderEmail,
    studentId: dto.studentId,
    studentName: dto.studentName,
    studentEmail: dto.studentEmail,
  };

  if (dto.type === "class_invitation") {
    return {
      ...base,
      type: "class_invitation",
      actionType: "class_invitation",
      inviteCode: dto.inviteCode ?? "",
      status: (dto.status as ClassInvitationNotificationStatus) ?? "pending",
    };
  }

  if (dto.type === "quiz_follow_up") {
    if (!dto.quizId || !dto.quizTitle || !dto.assignmentId || !dto.followUpKind) return null;
    return {
      ...base,
      type: "quiz_follow_up",
      actionType: "open_assigned_quiz",
      status: "sent",
      quizId: dto.quizId,
      quizTitle: dto.quizTitle,
      assignmentId: dto.assignmentId,
      attemptId: dto.attemptId ?? undefined,
      followUpKind: dto.followUpKind as QuizFollowUpKind,
    };
  }

  if (dto.type === "quiz_removed_by_admin") {
    if (!dto.quizId || !dto.quizTitle) return null;
    return {
      ...base,
      type: "quiz_removed_by_admin",
      actionType: "",
      status: "sent",
      quizId: dto.quizId,
      quizTitle: dto.quizTitle,
    };
  }

  return null;
}

interface NotificationsContextValue {
  notifications: DashboardNotification[];
  getNotificationsForRecipient: (recipientUserId: string) => DashboardNotification[];
  getNotificationsForRecipientIdentity: (
    recipientUserId: string | null | undefined,
    recipientEmail?: string | null,
  ) => DashboardNotification[];
  getUnreadCountForRecipient: (recipientUserId: string) => number;
  getUnreadCountForRecipientIdentity: (
    recipientUserId: string | null | undefined,
    recipientEmail?: string | null,
  ) => number;
  upsertClassInvitationNotification: (
    input: ClassInvitationNotificationInput,
  ) => DashboardNotification | null;
  sendQuizFollowUpNotification: (
    input: QuizFollowUpNotificationInput,
  ) => DashboardNotification | null;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (recipientUserId: string) => void;
  updateClassInvitationStatus: (
    notificationId: string,
    status: ClassInvitationNotificationStatus,
  ) => void;
  updateClassInvitationStatusByStudent: (
    relatedClassId: string,
    studentId: string,
    status: ClassInvitationNotificationStatus,
  ) => void;
  removeClassInvitationNotification: (
    relatedClassId: string,
    studentId: string,
  ) => void;
  syncClassInvitationMetadata: (
    relatedClassId: string,
    metadata: Pick<
      ClassInvitationNotificationInput,
      "relatedClassName" | "senderName" | "senderEmail"
    >,
  ) => void;
  removeNotificationsForClass: (relatedClassId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined,
);

function sanitizeNotificationRecord(
  notification: Partial<DashboardNotification>,
): DashboardNotification | null {
  if (
    typeof notification.id !== "string" ||
    (notification.type !== "class_invitation" &&
      notification.type !== "quiz_follow_up" &&
      notification.type !== "quiz_removed_by_admin") ||
    typeof notification.recipientUserId !== "string" ||
    typeof notification.recipientEmail !== "string" ||
    typeof notification.relatedClassId !== "string" ||
    typeof notification.relatedClassName !== "string" ||
    (notification.type === "class_invitation" &&
      typeof notification.inviteCode !== "string") ||
    typeof notification.senderName !== "string" ||
    typeof notification.senderEmail !== "string" ||
    typeof notification.studentId !== "string" ||
    typeof notification.studentName !== "string" ||
    typeof notification.studentEmail !== "string"
  ) {
    return null;
  }

  const timestamp =
    typeof notification.createdAt === "string"
      ? notification.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof notification.updatedAt === "string"
      ? notification.updatedAt
      : timestamp;
  const status =
    notification.status === "accepted" ||
    notification.status === "declined" ||
    notification.status === "removed"
      ? notification.status
      : notification.type === "quiz_follow_up"
        ? "sent"
        : "pending";

  if (notification.type === "quiz_follow_up") {
    if (
      typeof notification.quizId !== "string" ||
      typeof notification.quizTitle !== "string" ||
      typeof notification.assignmentId !== "string" ||
      (notification.followUpKind !== "needs_review" &&
        notification.followUpKind !== "reassign_quiz" &&
        notification.followUpKind !== "follow_up_practice")
    ) {
      return null;
    }

    return {
      id: notification.id,
      type: "quiz_follow_up",
      recipientUserId: notification.recipientUserId,
      recipientEmail: notification.recipientEmail,
      title:
        typeof notification.title === "string" && notification.title.trim()
          ? notification.title
          : `Assigned quiz follow-up: ${notification.quizTitle}`,
      message:
        typeof notification.message === "string" && notification.message.trim()
          ? notification.message
          : `${notification.senderName} added an assigned quiz follow-up for ${notification.quizTitle}.`,
      createdAt: timestamp,
      updatedAt,
      read: Boolean(notification.read),
      actionType: "open_assigned_quiz",
      relatedClassId: notification.relatedClassId,
      relatedClassName: notification.relatedClassName,
      senderName: notification.senderName,
      senderEmail: notification.senderEmail,
      studentId: notification.studentId,
      studentName: notification.studentName,
      studentEmail: notification.studentEmail,
      status: "sent",
      quizId: notification.quizId,
      quizTitle: notification.quizTitle,
      assignmentId: notification.assignmentId,
      attemptId:
        typeof notification.attemptId === "string" ? notification.attemptId : undefined,
      followUpKind: notification.followUpKind,
    };
  }

  return {
    id: notification.id,
    type: "class_invitation",
    recipientUserId: notification.recipientUserId,
    recipientEmail: notification.recipientEmail,
    title:
      typeof notification.title === "string" && notification.title.trim()
        ? notification.title
        : `Class invite: ${notification.relatedClassName}`,
    message:
      typeof notification.message === "string" && notification.message.trim()
        ? notification.message
        : `${notification.senderName} invited you to join ${notification.relatedClassName}.`,
    createdAt: timestamp,
    updatedAt,
    read: Boolean(notification.read),
    actionType: "class_invitation",
    relatedClassId: notification.relatedClassId,
    relatedClassName: notification.relatedClassName,
    inviteCode: notification.inviteCode,
    senderName: notification.senderName,
    senderEmail: notification.senderEmail,
    studentId: notification.studentId,
    studentName: notification.studentName,
    studentEmail: notification.studentEmail,
    status,
  };
}

interface NotificationsProviderProps {
  children: ReactNode;
}

function rebuildInvitationNotification(
  notification: DashboardNotification,
  status: ClassInvitationNotificationStatus,
): DashboardNotification {
  if (notification.type !== "class_invitation") {
    return notification;
  }

  return buildClassInvitationNotification(
    {
      recipientUserId: notification.recipientUserId,
      recipientEmail: notification.recipientEmail,
      relatedClassId: notification.relatedClassId,
      relatedClassName: notification.relatedClassName,
      inviteCode: notification.inviteCode,
      senderName: notification.senderName,
      senderEmail: notification.senderEmail,
      studentId: notification.studentId,
      studentName: notification.studentName,
      studentEmail: notification.studentEmail,
    },
    {
      existingId: notification.id,
      createdAt: notification.createdAt,
      updatedAt: new Date().toISOString(),
      read: true,
      status,
    },
  );
}

function getNotificationRecipientSettings(
  recipientUserId: string | null | undefined,
  recipientEmail?: string | null,
) {
  const scope = getSettingsStorageScope({
    userId: recipientUserId,
    email: recipientEmail,
    role: null,
    token: null,
  });

  return readUserSettings(
    scope,
    createDefaultUserSettings({
      user: null,
    }),
  );
}

function isNotificationEnabled(
  notification: DashboardNotification,
  recipientUserId: string | null | undefined,
  recipientEmail?: string | null,
) {
  const recipientSettings = getNotificationRecipientSettings(
    recipientUserId,
    recipientEmail,
  );

  if (!recipientSettings.notifications.push.realTimeUpdates) {
    return false;
  }

  if (notification.type === "class_invitation") {
    return recipientSettings.notifications.email.quizAssignments;
  }

  if (notification.followUpKind === "needs_review") {
    return recipientSettings.notifications.email.gradingUpdates;
  }

  return recipientSettings.notifications.email.quizAssignments;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;

  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchFromBackend = useCallback(() => {
    if (!hasAuthToken()) return;
    getMyNotifications()
      .then((dtos) => {
        const fromBackend = dtos
          .map(fromBackendDto)
          .filter((n): n is DashboardNotification => n !== null);
        setNotifications(sortDashboardNotifications(fromBackend));
      })
      .catch(() => {});
  }, []);

  // Re-hydrate whenever the authenticated user changes (login / logout / switch)
  useEffect(() => {
    setIsHydrated(false);
    setNotifications([]);

    if (hasAuthToken()) {
      getMyNotifications()
        .then((dtos) => {
          const fromBackend = dtos
            .map(fromBackendDto)
            .filter((n): n is DashboardNotification => n !== null);
          setNotifications(sortDashboardNotifications(fromBackend));
        })
        .catch(() => {
          hydrateFromLocalStorage();
        })
        .finally(() => {
          setIsHydrated(true);
        });
    } else {
      hydrateFromLocalStorage();
      setIsHydrated(true);
    }

    function hydrateFromLocalStorage() {
      // Try user-scoped key first, then fall back to legacy global key
      const scopedKey = getNotificationsStorageKey(userId);
      const savedValue =
        localStorage.getItem(scopedKey) ??
        (scopedKey !== NOTIFICATIONS_BASE_KEY
          ? localStorage.getItem(NOTIFICATIONS_BASE_KEY)
          : null);
      if (!savedValue) return;
      try {
        const parsed = JSON.parse(savedValue) as Partial<DashboardNotification>[];
        setNotifications(
          Array.isArray(parsed)
            ? sortDashboardNotifications(
                parsed
                  .map(sanitizeNotificationRecord)
                  .filter((item): item is DashboardNotification => item !== null),
              )
            : [],
        );
      } catch {
        setNotifications([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!isHydrated || !hasAuthToken()) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFromBackend();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(fetchFromBackend, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isHydrated, fetchFromBackend]);

  // Persist to user-scoped key so each user's cache is isolated
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(
      getNotificationsStorageKey(userId),
      JSON.stringify(notifications),
    );
  }, [isHydrated, notifications, userId]);

  const matchesRecipientIdentity = (
    notification: DashboardNotification,
    recipientUserId: string | null | undefined,
    recipientEmail?: string | null,
  ) => {
    const normalizedRecipientEmail = recipientEmail?.trim().toLowerCase();

    if (recipientUserId && notification.recipientUserId === recipientUserId) {
      return true;
    }

    if (
      normalizedRecipientEmail &&
      notification.recipientEmail.trim().toLowerCase() === normalizedRecipientEmail
    ) {
      return true;
    }

    return false;
  };

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      getNotificationsForRecipient: (recipientUserId) =>
        notifications.filter(
          (notification) =>
            notification.recipientUserId === recipientUserId &&
            isNotificationEnabled(
              notification,
              notification.recipientUserId,
              notification.recipientEmail,
            ),
        ),
      getNotificationsForRecipientIdentity: (recipientUserId, recipientEmail) =>
        notifications.filter(
          (notification) =>
            matchesRecipientIdentity(
              notification,
              recipientUserId,
              recipientEmail,
            ) &&
            isNotificationEnabled(notification, recipientUserId, recipientEmail),
        ),
      getUnreadCountForRecipient: (recipientUserId) =>
        notifications.filter(
          (notification) =>
            notification.recipientUserId === recipientUserId &&
            !notification.read &&
            isNotificationEnabled(
              notification,
              notification.recipientUserId,
              notification.recipientEmail,
            ),
        ).length,
      getUnreadCountForRecipientIdentity: (recipientUserId, recipientEmail) =>
        notifications.filter(
          (notification) =>
            matchesRecipientIdentity(notification, recipientUserId, recipientEmail) &&
            !notification.read &&
            isNotificationEnabled(notification, recipientUserId, recipientEmail),
        ).length,
      upsertClassInvitationNotification: (input) => {
        const existingNotification = notifications.find(
          (notification) =>
            notification.type === "class_invitation" &&
            notification.relatedClassId === input.relatedClassId &&
            notification.studentId === input.studentId,
        );

        const nextNotification = buildClassInvitationNotification(input, {
          existingId: existingNotification?.id,
          createdAt: existingNotification?.createdAt,
          updatedAt: new Date().toISOString(),
          read: false,
          status: "pending",
        });

        if (
          !isNotificationEnabled(
            nextNotification,
            input.recipientUserId,
            input.recipientEmail,
          )
        ) {
          return null;
        }

        setNotifications((current) =>
          sortDashboardNotifications(
            existingNotification
              ? current.map((notification) =>
                  notification.id === existingNotification.id
                    ? nextNotification
                    : notification,
                )
              : [nextNotification, ...current],
          ),
        );

        if (hasAuthToken()) {
          upsertClassInvitationNotification({
            type: "class_invitation",
            recipientUserId: input.recipientUserId,
            recipientEmail: input.recipientEmail,
            title: nextNotification.title,
            message: nextNotification.message,
            actionType: "class_invitation",
            relatedClassId: input.relatedClassId,
            relatedClassName: input.relatedClassName,
            inviteCode: input.inviteCode,
            senderName: input.senderName,
            senderEmail: input.senderEmail,
            studentId: input.studentId,
            studentName: input.studentName,
            studentEmail: input.studentEmail,
            status: "pending",
            createdAt: nextNotification.createdAt,
            existingId: existingNotification?.id,
          }).catch(() => {});
        }

        return nextNotification;
      },
      sendQuizFollowUpNotification: (input) => {
        const nextNotification = buildQuizFollowUpNotification(input, {
          updatedAt: new Date().toISOString(),
          read: false,
        });

        if (
          !isNotificationEnabled(
            nextNotification,
            input.recipientUserId,
            input.recipientEmail,
          )
        ) {
          return null;
        }

        // Spam guard: throttle identical follow-up notifications to the
        // same student/quiz/kind to once every 60 seconds. Without this,
        // a teacher rapidly clicking "Ask for another attempt" would flood
        // the student's inbox with duplicate nudges (and pump duplicate
        // backend writes).
        const SPAM_COOLDOWN_MS = 60_000;
        const now = Date.now();
        const isDuplicateBurst = notifications.some((existing) => {
          if (existing.type !== "quiz_follow_up") return false;
          if (existing.recipientUserId !== input.recipientUserId) return false;
          if (existing.followUpKind !== input.followUpKind) return false;
          if (existing.quizId !== input.quizId) return false;
          const existingTimestamp = new Date(existing.createdAt).getTime();
          return now - existingTimestamp < SPAM_COOLDOWN_MS;
        });

        if (isDuplicateBurst) {
          return null;
        }

        setNotifications((current) =>
          sortDashboardNotifications([nextNotification, ...current]),
        );

        if (hasAuthToken()) {
          createQuizFollowUpNotification({
            type: "quiz_follow_up",
            recipientUserId: input.recipientUserId,
            recipientEmail: input.recipientEmail,
            title: nextNotification.title,
            message: nextNotification.message,
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
            createdAt: nextNotification.createdAt,
          }).catch(() => {});
        }

        return nextNotification;
      },
      markNotificationRead: (notificationId) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    read: true,
                    updatedAt: notification.updatedAt,
                  }
                : notification,
            ),
          ),
        );
        if (hasAuthToken()) {
          markNotificationReadApi(notificationId).catch(() => {});
        }
      },
      markAllNotificationsRead: (recipientUserId) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.recipientUserId === recipientUserId
                ? {
                    ...notification,
                    read: true,
                  }
                : notification,
            ),
          ),
        );
        if (hasAuthToken()) {
          markAllNotificationsReadApi().catch(() => {});
        }
      },
      updateClassInvitationStatus: (notificationId, status) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.id === notificationId
                ? rebuildInvitationNotification(notification, status)
                : notification,
            ),
          ),
        );
        if (hasAuthToken()) {
          updateNotificationStatusApi(notificationId, status).catch(() => {});
        }
      },
      updateClassInvitationStatusByStudent: (relatedClassId, studentId, status) => {
        const target = notifications.find(
          (n) =>
            n.type === "class_invitation" &&
            n.relatedClassId === relatedClassId &&
            n.studentId === studentId,
        );
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.type === "class_invitation" &&
              notification.relatedClassId === relatedClassId &&
              notification.studentId === studentId
                ? rebuildInvitationNotification(notification, status)
                : notification,
            ),
          ),
        );
        if (hasAuthToken() && target) {
          updateNotificationStatusApi(target.id, status).catch(() => {});
        }
      },
      removeClassInvitationNotification: (relatedClassId, studentId) => {
        const target = notifications.find(
          (n) =>
            n.type === "class_invitation" &&
            n.relatedClassId === relatedClassId &&
            n.studentId === studentId,
        );
        setNotifications((current) =>
          current.filter(
            (notification) =>
              !(
                notification.type === "class_invitation" &&
                notification.relatedClassId === relatedClassId &&
                notification.studentId === studentId
              ),
          ),
        );
        if (hasAuthToken() && target) {
          deleteNotificationApi(target.id).catch(() => {});
        }
      },
      syncClassInvitationMetadata: (relatedClassId, metadata) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.relatedClassId === relatedClassId &&
              notification.type === "class_invitation"
                ? buildClassInvitationNotification(
                    {
                      recipientUserId: notification.recipientUserId,
                      recipientEmail: notification.recipientEmail,
                      relatedClassId: notification.relatedClassId,
                      relatedClassName: metadata.relatedClassName,
                      inviteCode: notification.inviteCode,
                      senderName: metadata.senderName,
                      senderEmail: metadata.senderEmail,
                      studentId: notification.studentId,
                      studentName: notification.studentName,
                      studentEmail: notification.studentEmail,
                    },
                    {
                      existingId: notification.id,
                      createdAt: notification.createdAt,
                      updatedAt: new Date().toISOString(),
                      read: notification.read,
                      status: notification.status,
                    },
                  )
                : notification,
            ),
          ),
        );
      },
      removeNotificationsForClass: (relatedClassId) => {
        setNotifications((current) =>
          current.filter(
            (notification) => notification.relatedClassId !== relatedClassId,
          ),
        );
        if (hasAuthToken()) {
          deleteNotificationsForClassApi(relatedClassId).catch(() => {});
        }
      },
    }),
    [notifications],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider.",
    );
  }

  return context;
}
