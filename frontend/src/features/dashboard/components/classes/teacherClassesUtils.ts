import type {
  TeacherClassStudent,
  TeacherClassFormValues,
  TeacherClassRecord,
} from "./teacherClassesTypes";
import { normalizeEmail } from "../../../auth/validation";

const teacherClassDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function createTeacherClassId() {
  return `class-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTeacherInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  return Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
}

export function createTeacherStudentId() {
  return `student-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTeacherClassAssignmentId() {
  return `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeTeacherClassText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeTeacherClassFormValues(
  values: TeacherClassFormValues,
): TeacherClassFormValues {
  return {
    name: normalizeTeacherClassText(values.name),
    description: values.description.trim(),
    subject: normalizeTeacherClassText(values.subject),
  };
}

export function formatTeacherClassDate(date: string | Date) {
  const resolvedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(resolvedDate.getTime())) {
    return "Invalid date";
  }

  return teacherClassDateFormatter.format(resolvedDate);
}

export function buildTeacherStudentNameFromEmail(email: string) {
  const localPart = normalizeEmail(email).split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  if (!cleaned) {
    return "Invited student";
  }

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseTeacherStudentEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

export interface StudentIdentity {
  userId?: string | null;
  email?: string | null;
}

function getEmailIdentityKey(email: string) {
  return `email:${normalizeEmail(email)}`;
}

export function matchesTeacherClassStudentIdentity(
  student: TeacherClassStudent,
  identity: StudentIdentity,
) {
  const normalizedIdentityEmail = identity.email
    ? normalizeEmail(identity.email)
    : "";
  const normalizedStudentEmail = normalizeEmail(student.email);

  if (identity.userId && student.linkedUserId === identity.userId) {
    return true;
  }

  if (!normalizedIdentityEmail) {
    return false;
  }

  if (normalizedStudentEmail === normalizedIdentityEmail) {
    return true;
  }

  return student.linkedUserId === getEmailIdentityKey(normalizedIdentityEmail);
}

export function getTeacherClassStudentActivityDate(student: TeacherClassStudent) {
  return (
    student.removedAt ??
    student.joinedAt ??
    student.respondedAt ??
    student.invitedAt
  );
}

export function getTeacherClassStudentStateLabel(student: TeacherClassStudent) {
  if (student.status === "joined") {
    return "Joined";
  }

  if (student.status === "declined") {
    return "Declined";
  }

  if (student.status === "removed") {
    return "Removed";
  }

  return student.invitationStatus === "pending" ? "Invited" : "Invited";
}

export function sortTeacherClassStudents(students: TeacherClassStudent[]) {
  const statusRank = {
    joined: 0,
    invited: 1,
    declined: 2,
    removed: 3,
  } satisfies Record<TeacherClassStudent["status"], number>;

  return [...students].sort((left, right) => {
    if (left.status !== right.status) {
      return statusRank[left.status] - statusRank[right.status];
    }

    const rightActivity = new Date(
      getTeacherClassStudentActivityDate(right),
    ).getTime();
    const leftActivity = new Date(
      getTeacherClassStudentActivityDate(left),
    ).getTime();

    if (rightActivity !== leftActivity) {
      return rightActivity - leftActivity;
    }

    return left.fullName.localeCompare(right.fullName);
  });
}

export function matchesTeacherClassSearch(
  teacherClass: TeacherClassRecord,
  search: string,
) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    teacherClass.name,
    teacherClass.subject,
    teacherClass.description,
    teacherClass.inviteCode,
  ].some((value) => value.toLowerCase().includes(query));
}

export function sortTeacherClasses(classes: TeacherClassRecord[]) {
  return [...classes].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}
