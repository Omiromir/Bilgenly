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

export function sortTeacherClassStudents(students: TeacherClassStudent[]) {
  const statusRank = {
    active: 0,
    invited: 1,
    declined: 2,
  } satisfies Record<TeacherClassStudent["status"], number>;

  return [...students].sort((left, right) => {
    if (left.status !== right.status) {
      return statusRank[left.status] - statusRank[right.status];
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
