import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ClassInvitationStatus,
  TeacherClassAssignedQuiz,
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStatus,
  TeacherClassStudent,
} from "../../features/dashboard/components/classes/teacherClassesTypes";
import {
  buildTeacherStudentNameFromEmail,
  matchesTeacherClassStudentIdentity,
  sortTeacherClasses,
  sortTeacherClassStudents,
  type StudentIdentity,
} from "../../features/dashboard/components/classes/teacherClassesUtils";
import { normalizeEmail } from "../../features/auth/validation";
import { useNotifications } from "./NotificationsProvider";
import {
  getNotificationRecipientUserIdByEmail,
  type MockDashboardUser,
} from "../../features/dashboard/users/dashboardUser";
import {
  archiveClass as archiveClassRequest,
  assignQuizToClass as assignQuizToClassRequest,
  createClass as createClassRequest,
  deleteClass as deleteClassRequest,
  getStudentClasses,
  getTeacherClasses,
  joinClassByInviteCode as joinClassByInviteCodeRequest,
  removeClassAssignment as removeClassAssignmentRequest,
  removeStudentFromClass as removeStudentFromClassRequest,
  updateClass as updateClassRequest,
} from "../../features/dashboard/api/classesApi";
import {
  mapAssignmentDtoToTeacherAssignedQuiz,
  mapClassDtoToTeacherClassRecord,
  toCreateClassRequest,
} from "../../features/dashboard/api/classesAdapters";
import { getRequestErrorMessage, isGuidString } from "../../lib/apiClient";
import type { UserRole } from "../../features/auth/api";
import { useAuth } from "./AuthProvider";
import { revokeClassInvitation, sendClassInvitations } from "../../features/dashboard/api/classInvitationsApi";
import { toast } from "sonner";
import {
  getUserScopedStorageKey,
  getUserStorageScope,
} from "./userScopedStorage";

const HIDDEN_ASSIGNMENTS_STORAGE_KEY = "bilgenly_hidden_class_assignments";

export interface StudentClassMembershipRecord {
  teacherClass: TeacherClassRecord;
  membership: TeacherClassStudent;
}

interface TeacherClassesContextValue {
  classes: TeacherClassRecord[];
  isLoading: boolean;
  error: string | null;
  refreshClasses: () => Promise<void>;
  createClass: (values: TeacherClassFormValues) => Promise<TeacherClassRecord>;
  updateClass: (
    classId: string,
    values: TeacherClassFormValues,
  ) => Promise<TeacherClassRecord | null>;
  setClassStatus: (
    classId: string,
    status: TeacherClassStatus,
  ) => Promise<void>;
  addStudentsToClass: (
    classId: string,
    emails: string[],
  ) => TeacherClassStudent[];
  removeStudentFromClass: (classId: string, studentId: string) => void;
  resendStudentInvite: (classId: string, studentId: string) => void;
  respondToClassInvitation: (
    classId: string,
    studentId: string,
    response: Extract<ClassInvitationStatus, "accepted" | "declined">,
    studentIdentity?: StudentIdentity,
  ) => void;
  assignQuizToClasses: (
    quiz: Pick<
      TeacherClassAssignedQuiz,
      "quizId" | "title" | "topic" | "questionCount"
    >,
    classIds: string[],
    settings?: Pick<
      TeacherClassAssignedQuiz,
      "deadline" | "maxAttempts" | "allowLateSubmissions"
    >,
  ) => Promise<string[]>;
  syncAssignedQuizDetails: (
    quizId: string,
    values: Pick<TeacherClassAssignedQuiz, "title" | "topic" | "questionCount">,
  ) => void;
  removeQuizFromClass: (classId: string, assignmentId: string) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  getClassById: (classId: string) => TeacherClassRecord | undefined;
  getStudentMemberships: (
    studentIdentity: StudentIdentity,
  ) => StudentClassMembershipRecord[];
  joinClassByInviteCode: (inviteCode: string) => Promise<TeacherClassRecord>;
}

const TeacherClassesContext = createContext<
  TeacherClassesContextValue | undefined
>(undefined);

interface TeacherClassesProviderProps {
  children: ReactNode;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function buildFallbackDashboardUser(
  role: UserRole | null,
): MockDashboardUser | null {
  if (role !== "teacher" && role !== "student") {
    return null;
  }

  const fullName = role === "teacher" ? "Teacher" : "Student";

  return {
    id: `fallback-${role}`,
    role,
    fullName,
    email: "",
    initials: getInitials(fullName),
    joinedLabel: "Join date unavailable",
    location: "",
    bio: "",
  };
}

function getInvitationStatusFromLegacyStatus(
  status: string | undefined,
): ClassInvitationStatus {
  switch (status) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "removed":
      return "removed";
    default:
      return "pending";
  }
}

function sanitizeTeacherClassStudent(
  student: Partial<TeacherClassStudent>,
): TeacherClassStudent | null {
  if (typeof student?.id !== "string") {
    return null;
  }

  const email =
    typeof student.email === "string" ? normalizeEmail(student.email) : "";

  if (!email) {
    return null;
  }

  const fallbackTimestamp =
    typeof student.joinedAt === "string"
      ? student.joinedAt
      : typeof student.invitedAt === "string"
        ? student.invitedAt
        : new Date().toISOString();
  const nextStatus =
    student.status === "joined" || student.status === "active"
      ? "joined"
      : student.status === "declined"
        ? "declined"
        : student.status === "removed"
          ? "removed"
          : "invited";
  const invitationStatus =
    student.invitationStatus ??
    (nextStatus === "joined"
      ? "accepted"
      : nextStatus === "declined"
        ? "declined"
        : nextStatus === "removed"
          ? "removed"
          : getInvitationStatusFromLegacyStatus(
              (student as { invitationState?: string }).invitationState,
            ));

  return {
    id: student.id,
    fullName:
      typeof student.fullName === "string" && student.fullName.trim()
        ? student.fullName.trim()
        : typeof (student as { name?: string })?.name === "string" &&
            (student as { name?: string }).name?.trim()
          ? (student as { name?: string }).name!.trim()
          : buildTeacherStudentNameFromEmail(email),
    email,
    status: nextStatus,
    invitationStatus,
    invitedAt:
      typeof student.invitedAt === "string"
        ? student.invitedAt
        : fallbackTimestamp,
    joinedAt:
      typeof student.joinedAt === "string" && student.joinedAt
        ? student.joinedAt
        : nextStatus === "joined"
          ? fallbackTimestamp
          : undefined,
    respondedAt:
      typeof student.respondedAt === "string"
        ? student.respondedAt
        : invitationStatus === "accepted" || invitationStatus === "declined"
          ? fallbackTimestamp
          : undefined,
    removedAt:
      typeof student.removedAt === "string"
        ? student.removedAt
        : nextStatus === "removed"
          ? fallbackTimestamp
          : undefined,
    linkedUserId:
      typeof student.linkedUserId === "string"
        ? student.linkedUserId
        : getNotificationRecipientUserIdByEmail(email),
    avatar: typeof student.avatar === "string" ? student.avatar : undefined,
    role: typeof student.role === "string" ? student.role : undefined,
  };
}

function sanitizeTeacherClassRecord(
  teacherClass: Partial<TeacherClassRecord>,
): TeacherClassRecord | null {
  if (typeof teacherClass.id !== "string" || !teacherClass.id) {
    return null;
  }

  const students = Array.isArray(teacherClass.students)
    ? sortTeacherClassStudents(
        teacherClass.students
          .map((student) => sanitizeTeacherClassStudent(student))
          .filter(
            (student): student is TeacherClassStudent => student !== null,
          ),
      )
    : [];
  const assignedQuizzes = Array.isArray(teacherClass.assignedQuizzes)
    ? teacherClass.assignedQuizzes.filter(
        (quiz) =>
          typeof quiz.assignmentId === "string" &&
          typeof quiz.quizId === "string" &&
          typeof quiz.title === "string",
      )
    : [];

  return {
    id: teacherClass.id,
    name:
      typeof teacherClass.name === "string"
        ? teacherClass.name
        : "Untitled class",
    description:
      typeof teacherClass.description === "string"
        ? teacherClass.description
        : "",
    subject:
      typeof teacherClass.subject === "string" ? teacherClass.subject : "",
    teacherName:
      typeof (teacherClass as { teacherName?: unknown }).teacherName ===
      "string"
        ? (teacherClass as { teacherName: string }).teacherName
        : undefined,
    inviteCode:
      typeof teacherClass.inviteCode === "string"
        ? teacherClass.inviteCode
        : "",
    createdAt:
      typeof teacherClass.createdAt === "string"
        ? teacherClass.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof teacherClass.updatedAt === "string"
        ? teacherClass.updatedAt
        : typeof teacherClass.createdAt === "string"
          ? teacherClass.createdAt
          : new Date().toISOString(),
    studentCount:
      typeof teacherClass.studentCount === "number"
        ? teacherClass.studentCount
        : students.filter((student) => student.status !== "removed").length,
    quizCount:
      typeof teacherClass.quizCount === "number"
        ? teacherClass.quizCount
        : assignedQuizzes.length,
    status: teacherClass.status === "archived" ? "archived" : "active",
    students,
    assignedQuizzes,
  };
}

function loadHiddenAssignments(scope: string) {
  const storedValue = localStorage.getItem(
    getUserScopedStorageKey(HIDDEN_ASSIGNMENTS_STORAGE_KEY, scope),
  );

  if (!storedValue) {
    return {} as Record<string, string[]>;
  }

  try {
    const parsed = JSON.parse(storedValue) as Record<string, string[]>;
    return Object.fromEntries(
      Object.entries(parsed).map(([classId, assignmentIds]) => [
        classId,
        Array.isArray(assignmentIds) ? assignmentIds.filter(Boolean) : [],
      ]),
    );
  } catch {
    return {} as Record<string, string[]>;
  }
}

function updateTeacherClassStudents(
  teacherClass: TeacherClassRecord,
  updater: (students: TeacherClassStudent[]) => TeacherClassStudent[],
): TeacherClassRecord {
  const students = sortTeacherClassStudents(updater(teacherClass.students));

  return {
    ...teacherClass,
    students,
    studentCount: students.filter((student) => student.status !== "removed")
      .length,
    updatedAt: new Date().toISOString(),
  };
}

async function loadTeacherClassesFromApi(
  currentClasses: TeacherClassRecord[],
  hiddenAssignmentIdsByClass: Record<string, string[]>,
) {
  const teacherClasses = await getTeacherClasses();

  return teacherClasses.map((teacherClass) =>
    mapClassDtoToTeacherClassRecord(
      teacherClass,
      null,
      currentClasses.find((candidate) => candidate.id === teacherClass.id) ??
        null,
      new Set(hiddenAssignmentIdsByClass[teacherClass.id] ?? []),
    ),
  );
}

async function loadStudentClassesFromApi(
  currentClasses: TeacherClassRecord[],
  hiddenAssignmentIdsByClass: Record<string, string[]>,
) {
  const studentClasses = await getStudentClasses();

  return studentClasses.map((teacherClass) =>
    mapClassDtoToTeacherClassRecord(
      teacherClass,
      null,
      currentClasses.find((candidate) => candidate.id === teacherClass.id) ??
        null,
      new Set(hiddenAssignmentIdsByClass[teacherClass.id] ?? []),
    ),
  );
}

export function TeacherClassesProvider({
  children,
}: TeacherClassesProviderProps) {
  const { currentUser, role, token } = useAuth();
  const userId = currentUser?.id ?? null;
  const userEmail = currentUser?.email ?? null;
  const storageScope = useMemo(
    () =>
      getUserStorageScope({
        userId,
        email: userEmail,
        role,
        token,
      }),
    [userId, userEmail, role, token],
  );
  const hiddenAssignmentsStorageKey = useMemo(
    () => getUserScopedStorageKey(HIDDEN_ASSIGNMENTS_STORAGE_KEY, storageScope),
    [storageScope],
  );
  const [classes, setClasses] = useState<TeacherClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenAssignmentIdsByClass, setHiddenAssignmentIdsByClass] = useState<
    Record<string, string[]>
  >({});
  // Bump to retrigger the classes/assignments fetch — used by the focus
  // listener and the `bilgenly:quiz-deleted` event so a quiz removed by
  // admin disappears from class assignment lists and overview stats
  // without a hard reload.
  const [refetchTick, setRefetchTick] = useState(0);
  const {
    notifications,
    removeClassInvitationNotification,
    removeNotificationsForClass,
    syncClassInvitationMetadata,
    updateClassInvitationStatusByStudent,
    upsertClassInvitationNotification,
  } = useNotifications();
  const teacherActor =
    role === "teacher" && currentUser
      ? currentUser
      : buildFallbackDashboardUser("teacher")!;
  const studentUserId = currentUser?.role === "student" ? currentUser.id : null;
  const studentEmail =
    currentUser?.role === "student" ? currentUser.email : null;
  const classesRef = useRef(classes);
  const hiddenAssignmentsRef = useRef(hiddenAssignmentIdsByClass);

  // Keep teacherActor values up-to-date via ref
  const teacherActorRef = useRef(teacherActor);
  useEffect(() => {
    teacherActorRef.current = teacherActor;
  }, [teacherActor]);

  useEffect(() => {
    classesRef.current = classes;
  }, [classes]);

  useEffect(() => {
    hiddenAssignmentsRef.current = hiddenAssignmentIdsByClass;
  }, [hiddenAssignmentIdsByClass]);

  useEffect(() => {
    setHiddenAssignmentIdsByClass(loadHiddenAssignments(storageScope));
  }, [storageScope]);

  useEffect(() => {
    localStorage.setItem(
      hiddenAssignmentsStorageKey,
      JSON.stringify(hiddenAssignmentIdsByClass),
    );
  }, [hiddenAssignmentIdsByClass, hiddenAssignmentsStorageKey]);

  // Auto-refresh classes when authentication is ready
  useEffect(() => {
    if (!token || (role !== "teacher" && role !== "student")) {
      setClasses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchClasses = async () => {
      try {
        const remoteClasses =
          role === "teacher"
            ? await loadTeacherClassesFromApi(
                classesRef.current,
                hiddenAssignmentsRef.current,
              )
            : await loadStudentClassesFromApi(
                classesRef.current,
                hiddenAssignmentsRef.current,
              );

        setClasses(sortTeacherClasses(remoteClasses));
        setError(null);
      } catch (nextError) {
        setError(
          getRequestErrorMessage(
            nextError,
            role === "teacher"
              ? "Unable to load teacher classes."
              : "Unable to load student classes.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClasses();
  }, [token, role, refetchTick]);

  // Refetch classes/assignments when the tab regains focus or when another
  // part of the app broadcasts that a quiz was deleted. This is what makes
  // an admin-deleted quiz disappear from a teacher's overview cards, class
  // assignment lists, and student class views without a hard reload.
  useEffect(() => {
    function bump() {
      setRefetchTick((tick) => tick + 1);
    }
    function onVisibility() {
      if (document.visibilityState === "visible") bump();
    }
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("bilgenly:quiz-deleted", bump as EventListener);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(
        "bilgenly:quiz-deleted",
        bump as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (
      role !== "student" ||
      (!studentUserId && !studentEmail) ||
      !notifications.length
    ) {
      return;
    }

    const normalizedStudentEmail = studentEmail
      ? normalizeEmail(studentEmail)
      : "";
    const teacherNameByClassId = notifications.reduce<Record<string, string>>(
      (accumulator, notification) => {
        if (notification.type !== "class_invitation") {
          return accumulator;
        }

        const matchesStudent =
          (studentUserId && notification.recipientUserId === studentUserId) ||
          (normalizedStudentEmail &&
            normalizeEmail(notification.recipientEmail) ===
              normalizedStudentEmail);

        if (!matchesStudent) {
          return accumulator;
        }

        const senderName = notification.senderName.trim();

        if (senderName) {
          accumulator[notification.relatedClassId] = senderName;
        }

        return accumulator;
      },
      {},
    );

    if (!Object.keys(teacherNameByClassId).length) {
      return;
    }

    setClasses((current) => {
      let hasChanges = false;

      const nextClasses = current.map((teacherClass) => {
        const nextTeacherName = teacherNameByClassId[teacherClass.id]?.trim();

        if (
          !nextTeacherName ||
          teacherClass.teacherName?.trim() === nextTeacherName
        ) {
          return teacherClass;
        }

        hasChanges = true;
        return {
          ...teacherClass,
          teacherName: nextTeacherName,
        };
      });

      return hasChanges ? nextClasses : current;
    });
  }, [notifications, role, studentEmail, studentUserId]);

  const refreshClasses = useCallback(async () => {
    if (!token || (role !== "teacher" && role !== "student")) {
      setClasses([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const remoteClasses =
        role === "teacher"
          ? await loadTeacherClassesFromApi(
              classesRef.current,
              hiddenAssignmentsRef.current,
            )
          : await loadStudentClassesFromApi(
              classesRef.current,
              hiddenAssignmentsRef.current,
            );

      setClasses(sortTeacherClasses(remoteClasses));
    } catch (nextError) {
      setError(
        getRequestErrorMessage(
          nextError,
          role === "teacher"
            ? "Unable to load teacher classes."
            : "Unable to load student classes.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [role, token]);

  const value = useMemo<TeacherClassesContextValue>(
    () => ({
      classes,
      isLoading,
      error,
      refreshClasses,
      createClass: async (values) => {
        const createdClass = await createClassRequest(
          toCreateClassRequest(values),
        );
        const mappedClass = mapClassDtoToTeacherClassRecord(
          createdClass,
          [],
          null,
          new Set(),
        );

        await refreshClasses();
        setError(null);

        return mappedClass;
      },
      updateClass: async (classId, values) => {
        const existingClass = classes.find((item) => item.id === classId);

        if (!existingClass || existingClass.status !== "active") {
          return null;
        }

        const updatedClass = await updateClassRequest(
          classId,
          toCreateClassRequest(values),
        );
        const mappedClass = mapClassDtoToTeacherClassRecord(
          updatedClass,
          existingClass.assignedQuizzes.map((assignment) => ({
            id: assignment.assignmentId,
            assignmentId: assignment.assignmentId,
            classId: assignment.classId,
            quizId: assignment.quizId,
            title: assignment.title,
            topic: assignment.topic,
            questionCount: assignment.questionCount,
            assignedAt: assignment.assignedAt,
            deadline: assignment.deadline,
            maxAttempts: assignment.maxAttempts,
            allowLateSubmissions: assignment.allowLateSubmissions,
            assignedBy: assignment.assignedBy,
            assignedByName: assignment.assignedByName,
            visibility: assignment.visibility,
            status: assignment.status,
          })),
          existingClass,
          new Set(hiddenAssignmentIdsByClass[classId] ?? []),
        );

        await refreshClasses();
        syncClassInvitationMetadata(classId, {
          relatedClassName: mappedClass.name,
          senderName: teacherActorRef.current.fullName,
          senderEmail: teacherActorRef.current.email,
        });
        setError(null);

        return mappedClass;
      },
      setClassStatus: async (classId, _status) => {
        const existingClass = classes.find((item) => item.id === classId);

        if (!existingClass) {
          return;
        }

        await archiveClassRequest(classId);
        await refreshClasses();
        setError(null);
      },
      addStudentsToClass: (classId, emails) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!targetClass || targetClass.status !== "active") {
          return [];
        }

        const createdAt = new Date().toISOString();
        const normalizedEmails = Array.from(
          new Set(emails.map((email) => normalizeEmail(email)).filter(Boolean)),
        );
        const existingEmails = new Set(
          targetClass.students.map((student) => normalizeEmail(student.email)),
        );
        const newStudents = normalizedEmails
          .filter((email) => !existingEmails.has(email))
          .map((email) => ({
            id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fullName: buildTeacherStudentNameFromEmail(email),
            email,
            status: "invited" as const,
            invitationStatus: "pending" as const,
            invitedAt: createdAt,
            linkedUserId: getNotificationRecipientUserIdByEmail(email),
          }));

        if (!newStudents.length) {
          return [];
        }

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const existingByEmail = new Map(
                item.students.map((student) => [
                  normalizeEmail(student.email),
                  student,
                ]),
              );

              newStudents.forEach((student) => {
                existingByEmail.set(normalizeEmail(student.email), student);
              });

              return updateTeacherClassStudents(item, () =>
                Array.from(existingByEmail.values()),
              );
            }),
          ),
        );

        newStudents.forEach((student) => {
          upsertClassInvitationNotification({
            recipientUserId:
              student.linkedUserId ??
              getNotificationRecipientUserIdByEmail(student.email),
            recipientEmail: student.email,
            relatedClassId: targetClass.id,
            relatedClassName: targetClass.name,
            inviteCode: targetClass.inviteCode,
            senderName: teacherActorRef.current.fullName,
            senderEmail: teacherActorRef.current.email,
            studentId: student.id,
            studentName: student.fullName,
            studentEmail: student.email,
          });
        });

        if (isGuidString(classId)) {
          // Properly handle the backend response. Previously, the result was
          // discarded with `.catch(() => {})`, which let invitations to
          // non-existent accounts or wrong-role accounts silently land as
          // local-only ghost students. Now: reconcile local state with the
          // backend's view of what actually succeeded, and surface failures.
          const emailsToInvite = newStudents.map((s) => s.email);
          const idsByNormalizedEmail = new Map(
            newStudents.map((s) => [normalizeEmail(s.email), s.id]),
          );

          sendClassInvitations(classId, emailsToInvite)
            .then((response) => {
              const sentEmails = new Set(
                response.sent.map((dto) => normalizeEmail(dto.recipientEmail)),
              );
              const failedEmails = response.failed.map(normalizeEmail);
              const failedStudentIds = new Set(
                failedEmails
                  .map((email) => idsByNormalizedEmail.get(email))
                  .filter((id): id is string => Boolean(id)),
              );

              // Strip locally-added students whose backend invite failed —
              // e.g. emails that don't belong to a registered account, or
              // belong to a non-student role.
              if (failedStudentIds.size > 0) {
                setClasses((current) =>
                  current.map((item) => {
                    if (item.id !== classId) return item;
                    return updateTeacherClassStudents(item, (students) =>
                      students.filter((student) => !failedStudentIds.has(student.id)),
                    );
                  }),
                );

                toast.warning(
                  `Could not invite ${failedEmails.length} ${
                    failedEmails.length === 1 ? "email" : "emails"
                  }: ${failedEmails.join(", ")}.  ` +
                    "They may not have a student account yet.",
                );
              }

              // Also drop any locally-created student whose email the backend
              // didn't acknowledge at all (defensive — backend should put
              // unknown ones in `failed`, but we mirror its truth either way).
              const acknowledgedIds = new Set(
                Array.from(sentEmails)
                  .map((email) => idsByNormalizedEmail.get(email))
                  .filter((id): id is string => Boolean(id)),
              );
              const orphanIds = newStudents
                .map((s) => s.id)
                .filter(
                  (id) => !acknowledgedIds.has(id) && !failedStudentIds.has(id),
                );
              if (orphanIds.length > 0) {
                const orphanSet = new Set(orphanIds);
                setClasses((current) =>
                  current.map((item) => {
                    if (item.id !== classId) return item;
                    return updateTeacherClassStudents(item, (students) =>
                      students.filter((student) => !orphanSet.has(student.id)),
                    );
                  }),
                );
              }
            })
            .catch(() => {
              // Network error — keep local optimistic state, but flag it so
              // the teacher knows the invitations didn't reach the server.
              toast.error(
                "Class invitations were saved locally but could not be sent to the server. Please retry.",
              );
            });
        }

        return newStudents;
      },
      removeStudentFromClass: (classId, studentId) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!targetClass || targetClass.status !== "active") {
          return;
        }

        const targetStudent =
          targetClass.students.find((student) => student.id === studentId) ??
          null;

        if (!targetStudent) {
          return;
        }

        removeClassInvitationNotification(classId, studentId);

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              return updateTeacherClassStudents(item, (students) =>
                students.filter((student) => student.id !== studentId),
              );
            }),
          ),
        );

        // Pending students have no real userId — their "id" is the invitation id.
        // Use the correct endpoint based on whether the student has joined.
        if (targetStudent.status === "invited") {
          revokeClassInvitation(classId, studentId).catch(() => {});
        } else {
          removeStudentFromClassRequest(classId, studentId).catch(() => {});
        }
      },
      resendStudentInvite: (classId, studentId) => {
        const targetClass = classes.find((item) => item.id === classId);
        const targetStudent =
          targetClass?.students.find((student) => student.id === studentId) ??
          null;

        if (
          !targetClass ||
          targetClass.status !== "active" ||
          !targetStudent ||
          targetStudent.status === "joined"
        ) {
          return;
        }

        const invitedAt = new Date().toISOString();

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              return updateTeacherClassStudents(item, (students) =>
                students.map((student) =>
                  student.id === studentId && student.status !== "joined"
                    ? {
                        ...student,
                        status: "invited",
                        invitationStatus: "pending",
                        invitedAt,
                        joinedAt: undefined,
                        respondedAt: undefined,
                        removedAt: undefined,
                      }
                    : student,
                ),
              );
            }),
          ),
        );

        upsertClassInvitationNotification({
          recipientUserId:
            targetStudent.linkedUserId ??
            getNotificationRecipientUserIdByEmail(targetStudent.email),
          recipientEmail: targetStudent.email,
          relatedClassId: targetClass.id,
          relatedClassName: targetClass.name,
          inviteCode: targetClass.inviteCode,
          senderName: teacherActorRef.current.fullName,
          senderEmail: teacherActorRef.current.email,
          studentId: targetStudent.id,
          studentName: targetStudent.fullName,
          studentEmail: targetStudent.email,
        });
      },
      respondToClassInvitation: (classId, studentId, response, identity) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!targetClass || targetClass.status !== "active") {
          return;
        }

        const responseTimestamp = new Date().toISOString();

        updateClassInvitationStatusByStudent(classId, studentId, response);
        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              return updateTeacherClassStudents(item, (students) =>
                students.map((student) =>
                  student.id === studentId
                    ? {
                        ...student,
                        status: response === "accepted" ? "joined" : "declined",
                        invitationStatus: response,
                        linkedUserId:
                          response === "accepted"
                            ? (identity?.userId ?? student.linkedUserId)
                            : student.linkedUserId,
                        joinedAt:
                          response === "accepted"
                            ? (student.joinedAt ?? responseTimestamp)
                            : undefined,
                        respondedAt: responseTimestamp,
                        removedAt: undefined,
                      }
                    : student,
                ),
              );
            }),
          ),
        );
      },
      assignQuizToClasses: async (quiz, classIds, settings) => {
        if (!isGuidString(quiz.quizId)) {
          throw new Error(
            "This quiz is only stored in local library data right now. It needs a real backend quiz ID before it can be assigned to a class.",
          );
        }

        const activeClassIds = Array.from(
          new Set(
            classIds.filter((classId) =>
              classes.some(
                (teacherClass) =>
                  teacherClass.id === classId &&
                  teacherClass.status === "active",
              ),
            ),
          ),
        );

        if (!activeClassIds.length) {
          return [];
        }

        const assignedClassIds: string[] = [];
        let firstError: string | null = null;

        await Promise.all(
          activeClassIds.map(async (classId) => {
            try {
              const assignment = await assignQuizToClassRequest(classId, {
                quizId: quiz.quizId,
                deadline:
                  typeof settings?.deadline === "string" && settings.deadline
                    ? settings.deadline
                    : null,
                maxAttempts:
                  settings?.maxAttempts === null
                    ? null
                    : typeof settings?.maxAttempts === "number" &&
                        settings.maxAttempts > 0
                      ? Math.round(settings.maxAttempts)
                      : 1,
                allowLateSubmissions: Boolean(settings?.allowLateSubmissions),
              });
              const mappedAssignment =
                mapAssignmentDtoToTeacherAssignedQuiz(assignment);

              setHiddenAssignmentIdsByClass((current) => {
                if (!current[classId]?.length) {
                  return current;
                }

                return {
                  ...current,
                  [classId]: current[classId].filter(
                    (assignmentId) =>
                      assignmentId !== mappedAssignment.assignmentId,
                  ),
                };
              });
              assignedClassIds.push(classId);
            } catch (nextError) {
              const message = getRequestErrorMessage(
                nextError,
                "Unable to assign quiz to class.",
              );

              if (!message.toLowerCase().includes("already assigned")) {
                firstError = firstError ?? message;
              }
            }
          }),
        );

        if (!assignedClassIds.length && firstError) {
          throw new Error(firstError);
        }

        if (firstError) {
          setError(firstError);
        } else {
          setError(null);
        }

        await refreshClasses();

        return assignedClassIds;
      },
      syncAssignedQuizDetails: (quizId, values) => {
        const normalizedTitle = values.title.trim();
        const normalizedTopic = values.topic.trim();
        const normalizedQuestionCount = Math.max(
          0,
          Math.round(values.questionCount),
        );

        setClasses((current) => {
          let hasChanges = false;

          const nextClasses = current.map((item) => {
            let classChanged = false;
            const assignedQuizzes = item.assignedQuizzes.map((assignment) => {
              if (assignment.quizId !== quizId) {
                return assignment;
              }

              if (
                assignment.title === normalizedTitle &&
                assignment.topic === normalizedTopic &&
                assignment.questionCount === normalizedQuestionCount
              ) {
                return assignment;
              }

              classChanged = true;
              return {
                ...assignment,
                title: normalizedTitle,
                topic: normalizedTopic,
                questionCount: normalizedQuestionCount,
              };
            });

            if (!classChanged) {
              return item;
            }

            hasChanges = true;
            return {
              ...item,
              assignedQuizzes,
            };
          });

          return hasChanges ? sortTeacherClasses(nextClasses) : current;
        });
      },
      removeQuizFromClass: async (classId, assignmentId) => {
        const targetClass = classes.find((teacherClass) => teacherClass.id === classId);
        const targetAssignment =
          targetClass?.assignedQuizzes.find(
            (assignment) => assignment.assignmentId === assignmentId,
          ) ?? null;

        if (!targetClass || !targetAssignment) {
          return;
        }

        if (isGuidString(classId) && isGuidString(assignmentId)) {
          await removeClassAssignmentRequest(classId, assignmentId);
          await refreshClasses();
          setError(null);
          return;
        }

        setHiddenAssignmentIdsByClass((previous) => ({
          ...previous,
          [classId]: Array.from(
            new Set([...(previous[classId] ?? []), assignmentId]),
          ),
        }));

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const assignedQuizzes = item.assignedQuizzes.filter(
                (assignment) => assignment.assignmentId !== assignmentId,
              );

              return {
                ...item,
                assignedQuizzes,
                quizCount: assignedQuizzes.length,
                updatedAt: new Date().toISOString(),
              };
            }),
          ),
        );
        setError(null);
      },
      deleteClass: async (classId) => {
        await deleteClassRequest(classId);
        removeNotificationsForClass(classId);
        await refreshClasses();
        setHiddenAssignmentIdsByClass((current) => {
          if (!(classId in current)) {
            return current;
          }

          const nextState = { ...current };
          delete nextState[classId];
          return nextState;
        });
        setError(null);
      },
      getClassById: (classId) => classes.find((item) => item.id === classId),
      getStudentMemberships: (identity) =>
        classes
          .flatMap((teacherClass) => {
            const membership = teacherClass.students.find((student) =>
              matchesTeacherClassStudentIdentity(student, identity),
            );

            if (!membership) {
              return [];
            }

            return [{ teacherClass, membership }];
          })
          .sort((left, right) => {
            if (
              left.membership.status === "joined" &&
              right.membership.status !== "joined"
            ) {
              return -1;
            }

            if (
              left.membership.status !== "joined" &&
              right.membership.status === "joined"
            ) {
              return 1;
            }

            return (
              new Date(right.teacherClass.updatedAt).getTime() -
              new Date(left.teacherClass.updatedAt).getTime()
            );
          }),
      joinClassByInviteCode: async (inviteCode) => {
        const joinedClass = await joinClassByInviteCodeRequest(inviteCode);
        const mappedClass = mapClassDtoToTeacherClassRecord(
          joinedClass,
          null,
          classes.find((teacherClass) => teacherClass.id === joinedClass.id) ??
            null,
          new Set(hiddenAssignmentIdsByClass[joinedClass.id] ?? []),
        );

        await refreshClasses();
        setError(null);

        return mappedClass;
      },
    }),
    [
      classes,
      error,
      hiddenAssignmentIdsByClass,
      isLoading,
      refreshClasses,
      removeClassInvitationNotification,
      removeNotificationsForClass,
      syncClassInvitationMetadata,
      updateClassInvitationStatusByStudent,
      upsertClassInvitationNotification,
    ],
  );

  return (
    <TeacherClassesContext.Provider value={value}>
      {children}
    </TeacherClassesContext.Provider>
  );
}

export function useTeacherClasses() {
  const context = useContext(TeacherClassesContext);

  if (!context) {
    throw new Error(
      "useTeacherClasses must be used within TeacherClassesProvider.",
    );
  }

  return context;
}
