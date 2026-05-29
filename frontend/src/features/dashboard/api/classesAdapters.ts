import {
  buildTeacherStudentNameFromEmail,
  createTeacherClassAssignmentId,
  isTeacherStudentPlaceholderName,
  normalizeTeacherClassFormValues,
  sortTeacherClasses,
  sortTeacherClassStudents,
  type StudentIdentity,
} from "../components/classes/teacherClassesUtils";
import { normalizeEmail } from "../../auth/validation";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassFormValues,
  TeacherClassRecord,
  TeacherClassStudent,
} from "../components/classes/teacherClassesTypes";
import type { AssignmentDto, ClassDto, ClassQuizDto, PendingInvitationDto } from "./dashboardApiTypes";

export function toCreateClassRequest(values: TeacherClassFormValues) {
  return normalizeTeacherClassFormValues(values);
}

function mapPendingInvitationDto(invitation: PendingInvitationDto): TeacherClassStudent {
  return {
    id: invitation.id,
    fullName: buildTeacherStudentNameFromEmail(invitation.recipientEmail),
    email: invitation.recipientEmail,
    status: "invited" as const,
    invitationStatus: "pending" as const,
    invitedAt: invitation.createdAt,
    joinedAt: undefined,
    respondedAt: undefined,
    linkedUserId: undefined,
    avatar: undefined,
    role: undefined,
  } satisfies TeacherClassStudent;
}

function mapStudentDto(
  student: ClassDto["students"][number],
  existingStudent?: TeacherClassStudent,
) {
  const fallbackNameFromEmail = buildTeacherStudentNameFromEmail(
    student.email || existingStudent?.email || "",
  );
  const existingName =
    existingStudent?.fullName &&
    !isTeacherStudentPlaceholderName(existingStudent.fullName)
      ? existingStudent.fullName
      : "";

  return {
    id: student.studentId,
    fullName: student.username || existingName || fallbackNameFromEmail,
    email: student.email || existingStudent?.email || "",
    status: "joined" as const,
    invitationStatus: "accepted" as const,
    invitedAt: existingStudent?.invitedAt ?? student.joinedAt,
    joinedAt: student.joinedAt,
    respondedAt: existingStudent?.respondedAt ?? student.joinedAt,
    linkedUserId: student.studentId,
    avatar: existingStudent?.avatar,
    role: existingStudent?.role,
  } satisfies TeacherClassStudent;
}

export function mapAssignmentDtoToTeacherAssignedQuiz(
  assignment: AssignmentDto,
): TeacherClassAssignedQuiz {
  return {
    id: assignment.assignmentId || assignment.id,
    assignmentId: assignment.assignmentId || assignment.id,
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
    visibility: "class-members",
    status: assignment.status === "expired" ? "expired" : "active",
  };
}

function mapClassQuizDtoToTeacherAssignedQuiz(
  quiz: ClassQuizDto,
  teacherClass: ClassDto,
  existingAssignment?: TeacherClassAssignedQuiz,
) {
  const assignmentId =
    quiz.assignmentId ||
    existingAssignment?.assignmentId ||
    `${teacherClass.id}:${quiz.quizId}` ||
    createTeacherClassAssignmentId();

  return {
    id: assignmentId,
    assignmentId,
    classId: teacherClass.id,
    quizId: quiz.quizId,
    title: quiz.quizTitle,
    topic: quiz.topic || existingAssignment?.topic || "",
    questionCount: quiz.questionCount || existingAssignment?.questionCount || 0,
    assignedAt: quiz.assignedAt,
    deadline: quiz.deadline ?? existingAssignment?.deadline ?? null,
    maxAttempts: quiz.maxAttempts ?? existingAssignment?.maxAttempts ?? null,
    allowLateSubmissions:
      quiz.allowLateSubmissions ?? existingAssignment?.allowLateSubmissions ?? false,
    assignedBy: quiz.assignedBy || existingAssignment?.assignedBy || "",
    assignedByName: quiz.assignedByName || existingAssignment?.assignedByName || "",
    visibility: "class-members",
    status: quiz.status === "expired" ? "expired" : existingAssignment?.status ?? "active",
  } satisfies TeacherClassAssignedQuiz;
}

function mergeStudents(
  remoteStudents: TeacherClassStudent[],
  existingStudents: TeacherClassStudent[],
) {
  const merged = new Map<string, TeacherClassStudent>();

  remoteStudents.forEach((student) => {
    const key = student.linkedUserId || normalizeEmail(student.email);
    merged.set(key, student);
  });

  existingStudents.forEach((student) => {
    const key = student.linkedUserId || normalizeEmail(student.email);
    if (merged.has(key)) {
      return;
    }

    if (student.status === "joined") {
      return;
    }

    merged.set(key, student);
  });

  return sortTeacherClassStudents(Array.from(merged.values()));
}

function mergeAssignments(
  remoteAssignments: TeacherClassAssignedQuiz[],
  existingAssignments: TeacherClassAssignedQuiz[],
  hiddenAssignmentIds: Set<string>,
) {
  const existingByKey = new Map<string, TeacherClassAssignedQuiz>();

  existingAssignments.forEach((assignment) => {
    existingByKey.set(assignment.assignmentId, assignment);
    existingByKey.set(`quiz:${assignment.quizId}`, assignment);
  });

  return remoteAssignments
    .map((assignment) => {
      const existing =
        existingByKey.get(assignment.assignmentId) ??
        existingByKey.get(`quiz:${assignment.quizId}`);

      return existing
        ? {
            ...existing,
            ...assignment,
          }
        : assignment;
    })
    .filter((assignment) => !hiddenAssignmentIds.has(assignment.assignmentId));
}

export function mapClassDtoToTeacherClassRecord(
  teacherClass: ClassDto,
  assignments: AssignmentDto[] | null,
  existingClass?: TeacherClassRecord | null,
  hiddenAssignmentIds: Set<string> = new Set(),
) {
  const existingStudents = existingClass?.students ?? [];
  const remoteStudents = teacherClass.students.map((student) => {
    const existingStudent =
      existingStudents.find((candidate) => candidate.linkedUserId === student.studentId) ??
      existingStudents.find(
        (candidate) => normalizeEmail(candidate.email) === normalizeEmail(student.email),
      );

    return mapStudentDto(student, existingStudent);
  });

  // Map pending invitations from backend — these survive page refresh
  const joinedEmails = new Set(remoteStudents.map((s) => normalizeEmail(s.email)));
  const remotePending = (teacherClass.pendingInvitations ?? [])
    .filter((inv) => !joinedEmails.has(normalizeEmail(inv.recipientEmail)))
    .map(mapPendingInvitationDto);

  const students = mergeStudents([...remoteStudents, ...remotePending], existingStudents);
  const remoteAssignments = assignments
    ? assignments.map(mapAssignmentDtoToTeacherAssignedQuiz)
    : teacherClass.quizzes.map((quiz) =>
        mapClassQuizDtoToTeacherAssignedQuiz(
          quiz,
          teacherClass,
          existingClass?.assignedQuizzes.find(
            (candidate) =>
              candidate.assignmentId === `${teacherClass.id}:${quiz.quizId}` ||
              candidate.quizId === quiz.quizId,
          ),
        ),
      );
  const assignedQuizzes = mergeAssignments(
    remoteAssignments,
    existingClass?.assignedQuizzes ?? [],
    hiddenAssignmentIds,
  );

  return {
    id: teacherClass.id,
    name: teacherClass.name,
    description: teacherClass.description,
    subject: teacherClass.subject,
    teacherName: teacherClass.teacherName || existingClass?.teacherName || "",
    inviteCode: teacherClass.inviteCode,
    createdAt: teacherClass.createdAt,
    updatedAt: teacherClass.updatedAt,
    studentCount: teacherClass.studentCount,
    quizCount: teacherClass.quizCount,
    status: teacherClass.isArchived ? "archived" : "active",
    students,
    assignedQuizzes,
  } satisfies TeacherClassRecord;
}

export function mergeRemoteClassesWithLocalCache(
  remoteClasses: TeacherClassRecord[],
  localClasses: TeacherClassRecord[],
  role: "teacher" | "student",
  studentIdentity?: StudentIdentity,
) {
  const remoteById = new Map(remoteClasses.map((teacherClass) => [teacherClass.id, teacherClass]));
  const merged = remoteClasses.map((teacherClass) => {
    const localClass = localClasses.find((candidate) => candidate.id === teacherClass.id);
    return localClass
      ? {
          ...teacherClass,
          students: mergeStudents(teacherClass.students, localClass.students),
          assignedQuizzes: mergeAssignments(
            teacherClass.assignedQuizzes,
            localClass.assignedQuizzes,
            new Set(),
          ),
        }
      : teacherClass;
  });

  if (role === "student" && studentIdentity) {
    localClasses.forEach((teacherClass) => {
      if (remoteById.has(teacherClass.id)) {
        return;
      }

      const hasRelevantStudent = teacherClass.students.some((student) => {
        if (studentIdentity.userId && student.linkedUserId === studentIdentity.userId) {
          return true;
        }

        if (!studentIdentity.email) {
          return false;
        }

        return normalizeEmail(student.email) === normalizeEmail(studentIdentity.email);
      });

      if (hasRelevantStudent) {
        merged.push(teacherClass);
      }
    });
  }

  return sortTeacherClasses(merged);
}
