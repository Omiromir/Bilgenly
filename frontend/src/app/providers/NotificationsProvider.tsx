import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildClassInvitationNotification,
  sortDashboardNotifications,
} from "../../features/dashboard/components/notifications/notificationUtils";
import type {
  ClassInvitationNotificationInput,
  DashboardNotification,
  DashboardNotificationStatus,
} from "../../features/dashboard/components/notifications/notificationTypes";

const NOTIFICATIONS_STORAGE_KEY = "bilgenly_notifications";

interface NotificationsContextValue {
  notifications: DashboardNotification[];
  getNotificationsForRecipient: (recipientUserId: string) => DashboardNotification[];
  getUnreadCountForRecipient: (recipientUserId: string) => number;
  upsertClassInvitationNotification: (
    input: ClassInvitationNotificationInput,
  ) => DashboardNotification;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (recipientUserId: string) => void;
  updateClassInvitationStatus: (
    notificationId: string,
    status: DashboardNotificationStatus,
  ) => void;
  updateClassInvitationStatusByStudent: (
    relatedClassId: string,
    studentId: string,
    status: DashboardNotificationStatus,
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
    notification.type !== "class_invitation" ||
    typeof notification.recipientUserId !== "string" ||
    typeof notification.recipientEmail !== "string" ||
    typeof notification.relatedClassId !== "string" ||
    typeof notification.relatedClassName !== "string" ||
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
    notification.status === "accepted" || notification.status === "declined"
      ? notification.status
      : "pending";

  return {
    id: notification.id,
    type: "class_invitation",
    recipientUserId: notification.recipientUserId,
    recipientEmail: notification.recipientEmail,
    title:
      typeof notification.title === "string" && notification.title.trim()
        ? notification.title
        : `Class invitation: ${notification.relatedClassName}`,
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

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedValue = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

    if (!savedValue) {
      setIsHydrated(true);
      return;
    }

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
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications),
    );
  }, [isHydrated, notifications]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      getNotificationsForRecipient: (recipientUserId) =>
        notifications.filter(
          (notification) => notification.recipientUserId === recipientUserId,
        ),
      getUnreadCountForRecipient: (recipientUserId) =>
        notifications.filter(
          (notification) =>
            notification.recipientUserId === recipientUserId && !notification.read,
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
      },
      updateClassInvitationStatus: (notificationId, status) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    status,
                    read: true,
                    updatedAt: new Date().toISOString(),
                  }
                : notification,
            ),
          ),
        );
      },
      updateClassInvitationStatusByStudent: (relatedClassId, studentId, status) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.relatedClassId === relatedClassId &&
              notification.studentId === studentId
                ? {
                    ...notification,
                    status,
                    read: true,
                    updatedAt: new Date().toISOString(),
                  }
                : notification,
            ),
          ),
        );
      },
      removeClassInvitationNotification: (relatedClassId, studentId) => {
        setNotifications((current) =>
          current.filter(
            (notification) =>
              !(
                notification.relatedClassId === relatedClassId &&
                notification.studentId === studentId
              ),
          ),
        );
      },
      syncClassInvitationMetadata: (relatedClassId, metadata) => {
        setNotifications((current) =>
          sortDashboardNotifications(
            current.map((notification) =>
              notification.relatedClassId === relatedClassId
                ? buildClassInvitationNotification(
                    {
                      recipientUserId: notification.recipientUserId,
                      recipientEmail: notification.recipientEmail,
                      relatedClassId: notification.relatedClassId,
                      relatedClassName: metadata.relatedClassName,
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
