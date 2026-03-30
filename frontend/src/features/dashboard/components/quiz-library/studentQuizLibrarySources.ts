import {
  getQuizLibraryItemsForRole,
  mapQuizRecordToLibraryItem,
} from "../../../../app/providers/QuizLibraryProvider";
import type {
  TeacherClassRecord,
  TeacherClassStudentStatus,
} from "../classes/teacherClassesTypes";
import {
  formatTeacherClassDate,
  sortTeacherClasses,
} from "../classes/teacherClassesUtils";
import type {
  QuizLibraryItem,
  QuizRecord,
} from "./quizLibraryTypes";
import {
  isDraftQuiz,
  isPublicDiscoveryQuiz,
} from "./quizLibraryUtils";

export interface StudentQuizLibraryMembership {
  classId: string;
  className: string;
  classSubject: string;
  inviteCode: string;
  status: TeacherClassStudentStatus;
  joinedAt: string;
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
  myGenerated: QuizLibraryItem[];
  saved: QuizLibraryItem[];
  history: QuizLibraryItem[];
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

function buildStudentMemberships(
  classes: TeacherClassRecord[],
  studentUserId: string,
): StudentQuizLibraryMembership[] {
  return sortTeacherClasses(classes)
    .flatMap((teacherClass) => {
      const matchingStudent = teacherClass.students.find(
        (student) => student.linkedUserId === studentUserId,
      );

      if (!matchingStudent) {
        return [];
      }

      return [
        {
          classId: teacherClass.id,
          className: teacherClass.name,
          classSubject: teacherClass.subject,
          inviteCode: teacherClass.inviteCode,
          status: matchingStudent.status,
          joinedAt: matchingStudent.joinedAt,
          assignedQuizCount: teacherClass.assignedQuizzes.length,
        } satisfies StudentQuizLibraryMembership,
      ];
    });
}

function buildAssignedQuizLibraryItems(
  classes: TeacherClassRecord[],
  quizzes: QuizRecord[],
  studentUserId: string,
): StudentAssignedQuizLibraryItem[] {
  return sortTeacherClasses(classes).flatMap((teacherClass) => {
    const activeMembership = teacherClass.students.find(
      (student) =>
        student.linkedUserId === studentUserId && student.status === "active",
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
  studentUserId: string | null | undefined,
): StudentQuizLibrarySources {
  if (!studentUserId) {
    return {
      assigned: [],
      discover: [],
      myGenerated: [],
      saved: [],
      history: [],
      memberships: [],
      activeMemberships: [],
      pendingMemberships: [],
    };
  }

  const studentLibraryItems = getQuizLibraryItemsForRole(quizzes, "student");
  const memberships = buildStudentMemberships(classes, studentUserId);
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active",
  );
  const pendingMemberships = memberships.filter(
    (membership) => membership.status === "invited",
  );

  const discover = studentLibraryItems
    .filter((item) => isPublicDiscoveryQuiz(item))
    .map((item) => ({
      ...item,
      sourceType: "discover" as const,
    }));

  const myGenerated = studentLibraryItems
    .filter((item) => item.isGeneratedByCurrentUser)
    .map((item) => ({
      ...item,
      sourceType: "generated" as const,
    }));

  const saved = studentLibraryItems
    .filter((item) => item.isSaved && !item.isGeneratedByCurrentUser)
    .map((item) => ({
      ...item,
      sourceType: "saved" as const,
    }));

  const assigned = buildAssignedQuizLibraryItems(classes, quizzes, studentUserId);

  const history = dedupeQuizLibraryItems([
    ...assigned,
    ...saved,
    ...myGenerated,
    ...discover,
  ])
    .filter(
      (item) =>
        item.practiceState === "in-progress" ||
        item.practiceState === "completed",
    )
    .map((item) => ({
      ...item,
      sourceType: "history" as const,
    }));

  return {
    assigned,
    discover,
    myGenerated: myGenerated.sort((left, right) => {
      if (isDraftQuiz(left.status) !== isDraftQuiz(right.status)) {
        return isDraftQuiz(left.status) ? -1 : 1;
      }

      return getQuizDateValue(right.updatedAt) - getQuizDateValue(left.updatedAt);
    }),
    saved,
    history,
    memberships,
    activeMemberships,
    pendingMemberships,
  };
}
