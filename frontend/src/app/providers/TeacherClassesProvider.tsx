import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStudent,
  TeacherClassStudentStatus,
  TeacherClassStatus,
} from "../../features/dashboard/components/classes/teacherClassesTypes";
import {
  buildTeacherStudentNameFromEmail,
  createTeacherClassAssignmentId,
  createTeacherClassId,
  createTeacherInviteCode,
  createTeacherStudentId,
  normalizeTeacherClassFormValues,
  sortTeacherClasses,
  sortTeacherClassStudents,
} from "../../features/dashboard/components/classes/teacherClassesUtils";
import { normalizeEmail } from "../../features/auth/validation";
import { useNotifications } from "./NotificationsProvider";
import {
  getNotificationRecipientUserIdByEmail,
  mockTeacherUser,
} from "../../features/dashboard/mock/mockUsers";

const TEACHER_CLASSES_STORAGE_KEY = "bilgenly_teacher_classes";

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
  updateStudentStatus: (
    classId: string,
    studentId: string,
    status: TeacherClassStudentStatus,
  ) => void;
  assignQuizToClasses: (
    quiz: Pick<TeacherClassAssignedQuiz, "quizId" | "title" | "topic" | "questionCount">,
    classIds: string[],
  ) => string[];
  removeQuizFromClass: (classId: string, quizId: string) => void;
  deleteClass: (classId: string) => void;
  getClassById: (classId: string) => TeacherClassRecord | undefined;
}

const TeacherClassesContext = createContext<
  TeacherClassesContextValue | undefined
>(undefined);

interface TeacherClassesProviderProps {
  children: ReactNode;
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
          .filter((student) => typeof student?.id === "string")
          .map((student) => {
            const email =
              typeof student?.email === "string" ? normalizeEmail(student.email) : "";

            return {
              id: student.id,
              fullName:
                typeof student?.fullName === "string" && student.fullName.trim()
                  ? student.fullName.trim()
                  : typeof (student as { name?: string })?.name === "string" &&
                      (student as { name?: string }).name?.trim()
                    ? (student as { name?: string }).name!.trim()
                    : buildTeacherStudentNameFromEmail(email),
              email,
              status:
                student?.status === "active"
                  ? "active"
                  : student?.status === "declined"
                    ? "declined"
                    : "invited",
              joinedAt:
                typeof student?.joinedAt === "string"
                  ? student.joinedAt
                  : new Date().toISOString(),
              linkedUserId:
                typeof student?.linkedUserId === "string"
                  ? student.linkedUserId
                  : getNotificationRecipientUserIdByEmail(email),
              avatar:
                typeof student?.avatar === "string" ? student.avatar : undefined,
              role: typeof student?.role === "string" ? student.role : undefined,
            } satisfies TeacherClassStudent;
          })
          .filter((student) => student.email),
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
    id:
      resolvedClassId,
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
    studentCount: students.length || Math.max(teacherClass.studentCount ?? 0, 0),
    quizCount: assignedQuizzes.length || Math.max(teacherClass.quizCount ?? 0, 0),
    status: teacherClass.status === "archived" ? "archived" : "active",
    students,
    assignedQuizzes,
  };
}

export function TeacherClassesProvider({
  children,
}: TeacherClassesProviderProps) {
  const [classes, setClasses] = useState<TeacherClassRecord[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const {
    removeClassInvitationNotification,
    removeNotificationsForClass,
    syncClassInvitationMetadata,
    updateClassInvitationStatusByStudent,
    upsertClassInvitationNotification,
  } = useNotifications();

  useEffect(() => {
    const savedValue = localStorage.getItem(TEACHER_CLASSES_STORAGE_KEY);

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
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(TEACHER_CLASSES_STORAGE_KEY, JSON.stringify(classes));
  }, [classes, isHydrated]);

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

        if (!existingClass) {
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
          senderName: mockTeacherUser.fullName,
          senderEmail: mockTeacherUser.email,
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

        if (!targetClass) {
          return [];
        }

        const existingEmails = new Set(
          targetClass.students.map((student) => normalizeEmail(student.email)),
        );
        const createdAt = new Date().toISOString();
        const newStudents = sortTeacherClassStudents(
          emails
            .map((email) => normalizeEmail(email))
            .filter((email) => email && !existingEmails.has(email))
            .map((email) => ({
              id: createTeacherStudentId(),
              fullName: buildTeacherStudentNameFromEmail(email),
              email,
              status: "invited" as const,
              joinedAt: createdAt,
              linkedUserId: getNotificationRecipientUserIdByEmail(email),
            })),
        );

        if (!newStudents.length) {
          return [];
        }

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const students = sortTeacherClassStudents([
                ...item.students,
                ...newStudents,
              ]);

              return {
                ...item,
                students,
                studentCount: students.length,
                updatedAt: createdAt,
              };
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
            senderName: mockTeacherUser.fullName,
            senderEmail: mockTeacherUser.email,
            studentId: student.id,
            studentName: student.fullName,
            studentEmail: student.email,
          });
        });

        return newStudents;
      },
      removeStudentFromClass: (classId, studentId) => {
        removeClassInvitationNotification(classId, studentId);

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const students = item.students.filter(
                (student) => student.id !== studentId,
              );

              return {
                ...item,
                students,
                studentCount: students.length,
                updatedAt: new Date().toISOString(),
              };
            }),
          ),
        );
      },
      resendStudentInvite: (classId, studentId) => {
        const targetClass = classes.find((item) => item.id === classId);
        const targetStudent =
          targetClass?.students.find((student) => student.id === studentId) ?? null;

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const students = item.students.map((student) =>
                student.id === studentId && student.status !== "active"
                  ? {
                      ...student,
                      status: "invited" as const,
                      joinedAt: new Date().toISOString(),
                    }
                  : student,
              );

              return {
                ...item,
                students,
                updatedAt: new Date().toISOString(),
              };
            }),
          ),
        );

        if (targetClass && targetStudent) {
          upsertClassInvitationNotification({
            recipientUserId:
              targetStudent.linkedUserId ??
              getNotificationRecipientUserIdByEmail(targetStudent.email),
            recipientEmail: targetStudent.email,
            relatedClassId: targetClass.id,
            relatedClassName: targetClass.name,
            senderName: mockTeacherUser.fullName,
            senderEmail: mockTeacherUser.email,
            studentId: targetStudent.id,
            studentName: targetStudent.fullName,
            studentEmail: targetStudent.email,
          });
        }
      },
      updateStudentStatus: (classId, studentId, status) => {
        if (status === "active") {
          updateClassInvitationStatusByStudent(classId, studentId, "accepted");
        }

        if (status === "declined") {
          updateClassInvitationStatusByStudent(classId, studentId, "declined");
        }

        setClasses((current) =>
          sortTeacherClasses(
            current.map((item) => {
              if (item.id !== classId) {
                return item;
              }

              const students = sortTeacherClassStudents(
                item.students.map((student) =>
                  student.id === studentId
                    ? {
                        ...student,
                        status,
                        joinedAt:
                          status === "active"
                            ? new Date().toISOString()
                            : student.joinedAt,
                      }
                    : student,
                ),
              );

              return {
                ...item,
                students,
                studentCount: students.length,
                updatedAt: new Date().toISOString(),
              };
            }),
          ),
        );
      },
      assignQuizToClasses: (quiz, classIds) => {
        const uniqueClassIds = Array.from(new Set(classIds));

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
                  assignedBy: mockTeacherUser.id,
                  assignedByName: mockTeacherUser.fullName,
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
    }),
    [classes],
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
