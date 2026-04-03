import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
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
  createTeacherClassAssignmentId,
  createTeacherClassId,
  createTeacherInviteCode,
  createTeacherStudentId,
  matchesTeacherClassStudentIdentity,
  normalizeTeacherClassFormValues,
  type StudentIdentity,
  sortTeacherClasses,
  sortTeacherClassStudents,
} from "../../features/dashboard/components/classes/teacherClassesUtils";
import { normalizeEmail } from "../../features/auth/validation";
import { useNotifications } from "./NotificationsProvider";
import {
  getNotificationRecipientUserIdByEmail,
  mockTeacherUser,
} from "../../features/dashboard/mock/mockUsers";
import { useAuth } from "./AuthProvider";
import {
  getScopedStorageValue,
  getUserStorageScope,
  getUserScopedStorageKey,
} from "./userScopedStorage";

const TEACHER_CLASSES_STORAGE_KEY = "bilgenly_teacher_classes";

export interface StudentClassMembershipRecord {
  teacherClass: TeacherClassRecord;
  membership: TeacherClassStudent;
}

interface TeacherClassesContextValue {
  classes: TeacherClassRecord[];
  createClass: (values: TeacherClassFormValues) => TeacherClassRecord;
  updateClass: (
    classId: string,
    values: TeacherClassFormValues,
  ) => TeacherClassRecord | null;
  setClassStatus: (classId: string, status: TeacherClassStatus) => void;
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
    quiz: Pick<TeacherClassAssignedQuiz, "quizId" | "title" | "topic" | "questionCount">,
    classIds: string[],
  ) => string[];
  removeQuizFromClass: (classId: string, quizId: string) => void;
  deleteClass: (classId: string) => void;
  getClassById: (classId: string) => TeacherClassRecord | undefined;
  getStudentMemberships: (studentIdentity: StudentIdentity) => StudentClassMembershipRecord[];
}

const TeacherClassesContext = createContext<
  TeacherClassesContextValue | undefined
>(undefined);

interface TeacherClassesProviderProps {
  children: ReactNode;
}

function isActiveTeacherClass(
  teacherClass: TeacherClassRecord | undefined | null,
): teacherClass is TeacherClassRecord {
  return Boolean(teacherClass && teacherClass.status === "active");
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
      typeof student.invitedAt === "string" ? student.invitedAt : fallbackTimestamp,
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

function getCurrentStudentCount(students: TeacherClassStudent[]) {
  return students.filter((student) => student.status !== "removed").length;
}

function sanitizeTeacherClassRecord(
  teacherClass: Partial<TeacherClassRecord>,
): TeacherClassRecord {
  const resolvedClassId =
    typeof teacherClass.id === "string" && teacherClass.id
      ? teacherClass.id
      : createTeacherClassId();
  const students = Array.isArray(teacherClass.students)
    ? sortTeacherClassStudents(
        teacherClass.students
          .map((student) => sanitizeTeacherClassStudent(student))
          .filter((student): student is TeacherClassStudent => student !== null),
      )
    : [];
  const assignedQuizzes = Array.isArray(teacherClass.assignedQuizzes)
    ? teacherClass.assignedQuizzes
        .filter(
          (quiz) =>
            typeof quiz?.quizId === "string" && typeof quiz?.title === "string",
        )
        .map((quiz) => ({
          id:
            typeof quiz.id === "string" && quiz.id
              ? quiz.id
              : createTeacherClassAssignmentId(),
          classId:
            typeof quiz.classId === "string" && quiz.classId
              ? quiz.classId
              : resolvedClassId,
          quizId: quiz.quizId,
          title: quiz.title,
          topic: typeof quiz.topic === "string" ? quiz.topic : "",
          questionCount:
            typeof quiz.questionCount === "number" && Number.isFinite(quiz.questionCount)
              ? quiz.questionCount
              : 0,
          assignedAt:
            typeof quiz.assignedAt === "string"
              ? quiz.assignedAt
              : new Date().toISOString(),
          assignedBy:
            typeof quiz.assignedBy === "string" && quiz.assignedBy
              ? quiz.assignedBy
              : mockTeacherUser.id,
          assignedByName:
            typeof quiz.assignedByName === "string" && quiz.assignedByName
              ? quiz.assignedByName
              : mockTeacherUser.fullName,
          visibility: "class-members" as const,
          status: "assigned" as const,
        }))
    : [];
  const createdAt =
    typeof teacherClass.createdAt === "string"
      ? teacherClass.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof teacherClass.updatedAt === "string" ? teacherClass.updatedAt : createdAt;

  return {
    id: resolvedClassId,
    name:
      typeof teacherClass.name === "string" && teacherClass.name.trim()
        ? teacherClass.name.trim()
        : "Untitled class",
    description:
      typeof teacherClass.description === "string"
        ? teacherClass.description.trim()
        : "",
    subject:
      typeof teacherClass.subject === "string" ? teacherClass.subject.trim() : "",
    inviteCode:
      typeof teacherClass.inviteCode === "string" && teacherClass.inviteCode
        ? teacherClass.inviteCode
        : createTeacherInviteCode(),
    createdAt,
    updatedAt,
    studentCount: getCurrentStudentCount(students),
    quizCount: assignedQuizzes.length || Math.max(teacherClass.quizCount ?? 0, 0),
    status: teacherClass.status === "archived" ? "archived" : "active",
    students,
    assignedQuizzes,
  };
}

function updateTeacherClassStudents(
  teacherClass: TeacherClassRecord,
  updater: (students: TeacherClassStudent[]) => TeacherClassStudent[],
): TeacherClassRecord {
  const students = sortTeacherClassStudents(updater(teacherClass.students));

  return {
    ...teacherClass,
    students,
    studentCount: getCurrentStudentCount(students),
    updatedAt: new Date().toISOString(),
  };
}

export function TeacherClassesProvider({
  children,
}: TeacherClassesProviderProps) {
  const { currentUser, role, token } = useAuth();
  const [classes, setClasses] = useState<TeacherClassRecord[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null);
  const {
    removeClassInvitationNotification,
    removeNotificationsForClass,
    syncClassInvitationMetadata,
    updateClassInvitationStatusByStudent,
    upsertClassInvitationNotification,
  } = useNotifications();
  const storageScope = useMemo(
    () =>
      getUserStorageScope({
        userId: currentUser?.id,
        email: currentUser?.email,
        role,
        token,
      }),
    [currentUser?.email, currentUser?.id, role, token],
  );
  const storageKey = useMemo(
    () => getUserScopedStorageKey(TEACHER_CLASSES_STORAGE_KEY, storageScope),
    [storageScope],
  );
  const teacherActor = role === "teacher" && currentUser ? currentUser : mockTeacherUser;

  useEffect(() => {
    setClasses([]);
    setIsHydrated(false);
    setHydratedStorageKey(null);

    const savedValue = getScopedStorageValue(
      TEACHER_CLASSES_STORAGE_KEY,
      storageScope,
    );

    if (!savedValue) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedValue) as Partial<TeacherClassRecord>[];
      setClasses(
        Array.isArray(parsed)
          ? sortTeacherClasses(parsed.map(sanitizeTeacherClassRecord))
          : [],
      );
    } catch {
      setClasses([]);
    } finally {
      setHydratedStorageKey(storageKey);
      setIsHydrated(true);
    }
  }, [storageKey, storageScope]);

  useEffect(() => {
    if (!isHydrated || hydratedStorageKey !== storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(classes));
  }, [classes, hydratedStorageKey, isHydrated, storageKey]);

  const value = useMemo<TeacherClassesContextValue>(
    () => ({
      classes,
      createClass: (values) => {
        const normalized = normalizeTeacherClassFormValues(values);
        const timestamp = new Date().toISOString();
        const nextClass: TeacherClassRecord = {
          id: createTeacherClassId(),
          name: normalized.name,
          description: normalized.description,
          subject: normalized.subject,
          inviteCode: createTeacherInviteCode(),
          createdAt: timestamp,
          updatedAt: timestamp,
          studentCount: 0,
          quizCount: 0,
          status: "active",
          students: [],
          assignedQuizzes: [],
        };

        setClasses((current) => sortTeacherClasses([nextClass, ...current]));
        return nextClass;
      },
      updateClass: (classId, values) => {
        const existingClass = classes.find((item) => item.id === classId);

        if (!isActiveTeacherClass(existingClass)) {
          return null;
        }

        const normalized = normalizeTeacherClassFormValues(values);
        const updatedClass: TeacherClassRecord = {
          ...existingClass,
          name: normalized.name,
          description: normalized.description,
          subject: normalized.subject,
          updatedAt: new Date().toISOString(),
        };

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => (item.id === classId ? updatedClass : item)),
          ),
        );

        syncClassInvitationMetadata(classId, {
          relatedClassName: updatedClass.name,
          senderName: teacherActor.fullName,
          senderEmail: teacherActor.email,
        });

        return updatedClass;
      },
      setClassStatus: (classId, status) => {
        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) =>
              item.id === classId
                ? {
                    ...item,
                    status,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          ),
        );
      },
      addStudentsToClass: (classId, emails) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!isActiveTeacherClass(targetClass)) {
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
            id: createTeacherStudentId(),
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
                item.students.map((student) => [normalizeEmail(student.email), student]),
              );

              newStudents.forEach((student) => {
                existingByEmail.set(normalizeEmail(student.email), student);
              });

              return updateTeacherClassStudents(
                item,
                () => Array.from(existingByEmail.values()),
              );
            }),
          ),
        );

        newStudents.forEach((student) => {
          upsertClassInvitationNotification({
            recipientUserId:
              student.linkedUserId ?? getNotificationRecipientUserIdByEmail(student.email),
            recipientEmail: student.email,
            relatedClassId: targetClass.id,
            relatedClassName: targetClass.name,
            senderName: teacherActor.fullName,
            senderEmail: teacherActor.email,
            studentId: student.id,
            studentName: student.fullName,
            studentEmail: student.email,
          });
        });

        return newStudents;
      },
      removeStudentFromClass: (classId, studentId) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!isActiveTeacherClass(targetClass)) {
          return;
        }

        const targetStudent =
          targetClass.students.find((student) => student.id === studentId) ?? null;

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
      },
      resendStudentInvite: (classId, studentId) => {
        const targetClass = classes.find((item) => item.id === classId);
        const targetStudent =
          targetClass?.students.find((student) => student.id === studentId) ?? null;

        if (
          !isActiveTeacherClass(targetClass) ||
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
          senderName: teacherActor.fullName,
          senderEmail: teacherActor.email,
          studentId: targetStudent.id,
          studentName: targetStudent.fullName,
          studentEmail: targetStudent.email,
        });
      },
      respondToClassInvitation: (classId, studentId, response, studentIdentity) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!isActiveTeacherClass(targetClass)) {
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
                            ? studentIdentity?.userId ?? student.linkedUserId
                            : student.linkedUserId,
                        joinedAt:
                          response === "accepted"
                            ? student.joinedAt ?? responseTimestamp
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
      assignQuizToClasses: (quiz, classIds) => {
        const activeClassIds = new Set(
          classes
            .filter((teacherClass) => teacherClass.status === "active")
            .map((teacherClass) => teacherClass.id),
        );
        const uniqueClassIds = Array.from(
          new Set(classIds.filter((classId) => activeClassIds.has(classId))),
        );

        if (!uniqueClassIds.length) {
          return [];
        }

        const assignedAt = new Date().toISOString();
        const assignedClassIds: string[] = [];

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (!uniqueClassIds.includes(item.id)) {
                return item;
              }

              if (item.assignedQuizzes.some((entry) => entry.quizId === quiz.quizId)) {
                return item;
              }

              assignedClassIds.push(item.id);

              const assignedQuizzes = [
                {
                  id: createTeacherClassAssignmentId(),
                  classId: item.id,
                  ...quiz,
                  assignedAt,
                  assignedBy: teacherActor.id,
                  assignedByName: teacherActor.fullName,
                  visibility: "class-members" as const,
                  status: "assigned" as const,
                },
                ...item.assignedQuizzes,
              ];

              return {
                ...item,
                assignedQuizzes,
                quizCount: assignedQuizzes.length,
                updatedAt: assignedAt,
              };
            }),
          ),
        );

        return assignedClassIds;
      },
      removeQuizFromClass: (classId, quizId) => {
        const targetClass = classes.find((item) => item.id === classId);

        if (!isActiveTeacherClass(targetClass)) {
          return;
        }

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const assignedQuizzes = item.assignedQuizzes.filter(
                (quiz) => quiz.quizId !== quizId,
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
      },
      deleteClass: (classId) => {
        removeNotificationsForClass(classId);
        setClasses((current) => current.filter((item) => item.id !== classId));
      },
      getClassById: (classId) => classes.find((item) => item.id === classId),
      getStudentMemberships: (studentIdentity) =>
        classes
          .flatMap((teacherClass) => {
            const membership = teacherClass.students.find(
              (student) => matchesTeacherClassStudentIdentity(student, studentIdentity),
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
    }),
    [
      classes,
      removeClassInvitationNotification,
      removeNotificationsForClass,
      syncClassInvitationMetadata,
      teacherActor.email,
      teacherActor.fullName,
      teacherActor.id,
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
