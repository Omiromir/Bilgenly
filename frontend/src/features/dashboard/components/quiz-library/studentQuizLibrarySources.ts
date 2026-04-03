import {
  getQuizLibraryItemsForRole,
  mapQuizRecordToLibraryItem,
} from "../../../../app/providers/QuizLibraryProvider";
import { mockTeacherUser } from "../../mock/mockUsers";
import type {
  TeacherClassRecord,
  TeacherClassStudent,
  TeacherClassStudentStatus,
} from "../classes/teacherClassesTypes";
import {
  formatTeacherClassDate,
  matchesTeacherClassStudentIdentity,
  sortTeacherClasses,
  type StudentIdentity,
} from "../classes/teacherClassesUtils";
import type { QuizLibraryItem, QuizRecord } from "./quizLibraryTypes";
import { isDraftQuiz, isPublicDiscoveryQuiz } from "./quizLibraryUtils";

export interface StudentQuizLibraryMembership {
  classId: string;
  className: string;
  classSubject: string;
  classDescription: string;
  teacherName: string;
  teacherEmail: string;
  inviteCode: string;
  status: TeacherClassStudentStatus;
  invitationStatus: TeacherClassStudent["invitationStatus"];
  invitedAt: string;
  joinedAt?: string;
  lastActivityAt: string;
  assignedQuizCount: number;
}

export interface StudentAssignedQuizLibraryItem extends QuizLibraryItem {
  sourceType: "assigned";
  isAssigned: true;
  assignmentContext: NonNullable<QuizLibraryItem["assignmentContext"]>;
}

export interface StudentQuizLibrarySources {
  assigned: StudentAssignedQuizLibraryItem[];
  discover: QuizLibraryItem[];
  personalLibrary: QuizLibraryItem[];
  personalGenerated: QuizLibraryItem[];
  personalSaved: QuizLibraryItem[];
  personalRecent: QuizLibraryItem[];
  memberships: StudentQuizLibraryMembership[];
  activeMemberships: StudentQuizLibraryMembership[];
  pendingMemberships: StudentQuizLibraryMembership[];
}

function dedupeQuizLibraryItems(items: QuizLibraryItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function getQuizDateValue(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortQuizItemsByUpdatedAt(items: QuizLibraryItem[]) {
  return [...items].sort(
    (left, right) => getQuizDateValue(right.updatedAt) - getQuizDateValue(left.updatedAt),
  );
}

function buildStudentMemberships(
  classes: TeacherClassRecord[],
  studentIdentity: StudentIdentity,
): StudentQuizLibraryMembership[] {
  return sortTeacherClasses(classes)
    .flatMap((teacherClass) => {
      const matchingStudent = teacherClass.students.find(
        (student) => matchesTeacherClassStudentIdentity(student, studentIdentity),
      );

      if (!matchingStudent) {
        return [];
      }

      return [
        {
          classId: teacherClass.id,
          className: teacherClass.name,
          classSubject: teacherClass.subject,
          classDescription: teacherClass.description,
          teacherName: mockTeacherUser.fullName,
          teacherEmail: mockTeacherUser.email,
          inviteCode: teacherClass.inviteCode,
          status: matchingStudent.status,
          invitationStatus: matchingStudent.invitationStatus,
          invitedAt: matchingStudent.invitedAt,
          joinedAt: matchingStudent.joinedAt,
          lastActivityAt:
            matchingStudent.removedAt ??
            matchingStudent.joinedAt ??
            matchingStudent.respondedAt ??
            matchingStudent.invitedAt,
          assignedQuizCount: teacherClass.assignedQuizzes.length,
        } satisfies StudentQuizLibraryMembership,
      ];
    });
}

function buildAssignedQuizLibraryItems(
  classes: TeacherClassRecord[],
  quizzes: QuizRecord[],
  studentIdentity: StudentIdentity,
): StudentAssignedQuizLibraryItem[] {
  return sortTeacherClasses(classes).flatMap((teacherClass) => {
    const activeMembership = teacherClass.students.find(
      (student) =>
        matchesTeacherClassStudentIdentity(student, studentIdentity) &&
        student.status === "joined",
    );

    if (!activeMembership) {
      return [];
    }

    return teacherClass.assignedQuizzes.flatMap((assignment) => {
      const quizRecord = quizzes.find((quiz) => quiz.id === assignment.quizId);

      if (!quizRecord) {
        return [];
      }

      const libraryItem = mapQuizRecordToLibraryItem(quizRecord, "student");

      return [
        {
          ...libraryItem,
          sourceType: "assigned" as const,
          isAssigned: true as const,
          sourceLabel: `${teacherClass.name} assignment`,
          note: `Assigned by ${assignment.assignedByName} on ${formatTeacherClassDate(assignment.assignedAt)}.`,
          assignmentContext: {
            assignmentId: assignment.id,
            classId: assignment.classId,
            className: teacherClass.name,
            classSubject: teacherClass.subject,
            assignedAt: assignment.assignedAt,
            assignedBy: assignment.assignedBy,
            assignedByName: assignment.assignedByName,
            visibility: assignment.visibility,
            status: assignment.status,
          },
        } satisfies StudentAssignedQuizLibraryItem,
      ];
    });
  });
}

export function buildStudentQuizLibrarySources(
  classes: TeacherClassRecord[],
  quizzes: QuizRecord[],
  studentIdentity: StudentIdentity,
): StudentQuizLibrarySources {
  if (!studentIdentity.userId && !studentIdentity.email) {
    return {
      assigned: [],
      discover: [],
      personalLibrary: [],
      personalGenerated: [],
      personalSaved: [],
      personalRecent: [],
      memberships: [],
      activeMemberships: [],
      pendingMemberships: [],
    };
  }

  const studentLibraryItems = getQuizLibraryItemsForRole(quizzes, "student");
  const memberships = buildStudentMemberships(classes, studentIdentity);
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "joined",
  );
  const pendingMemberships = memberships.filter(
    (membership) =>
      membership.status === "invited" && membership.invitationStatus === "pending",
  );

  const discover = sortQuizItemsByUpdatedAt(
    studentLibraryItems
      .filter((item) => isPublicDiscoveryQuiz(item))
      .map((item) => ({
        ...item,
        sourceType: "discover" as const,
      })),
  );

  const personalGenerated = studentLibraryItems
    .filter((item) => item.isGeneratedByCurrentUser)
    .map((item) => ({
      ...item,
      sourceType: "generated" as const,
    }))
    .sort((left, right) => {
      if (isDraftQuiz(left.status) !== isDraftQuiz(right.status)) {
        return isDraftQuiz(left.status) ? -1 : 1;
      }

      return getQuizDateValue(right.updatedAt) - getQuizDateValue(left.updatedAt);
    });

  const personalSaved = sortQuizItemsByUpdatedAt(
    studentLibraryItems
      .filter((item) => item.isSaved && !item.isGeneratedByCurrentUser)
      .map((item) => ({
        ...item,
        sourceType: "saved" as const,
      })),
  );

  const assigned = buildAssignedQuizLibraryItems(classes, quizzes, studentIdentity);

  const personalRecent = sortQuizItemsByUpdatedAt(
    dedupeQuizLibraryItems([...personalGenerated, ...personalSaved, ...discover])
      .filter(
        (item) =>
          item.practiceState === "in-progress" ||
          item.practiceState === "completed",
      )
      .map((item) => ({
        ...item,
        sourceType: "history" as const,
      })),
  );

  const personalLibrary = sortQuizItemsByUpdatedAt(
    dedupeQuizLibraryItems([
      ...personalGenerated,
      ...personalSaved,
      ...personalRecent,
    ]),
  );

  return {
    assigned,
    discover,
    personalLibrary,
    personalGenerated,
    personalSaved,
    personalRecent,
    memberships,
    activeMemberships,
    pendingMemberships,
  };
}
