import type { UserRole } from "../../../lib/auth";

export interface MockDashboardUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  initials: string;
  joinedLabel: string;
  location: string;
  bio: string;
}

export const mockTeacherUser: MockDashboardUser = {
  id: "teacher-professor-doe",
  role: "teacher",
  fullName: "Professor Doe",
  email: "professor@bilgenly.com",
  initials: "PD",
  joinedLabel: "Joined March 2024",
  location: "San Francisco, CA",
  bio: "Computer science instructor focused on practical programming, classroom analytics, and quiz-driven learning.",
};

export const mockStudentUsers: MockDashboardUser[] = [
  {
    id: "student-john-doe",
    role: "student",
    fullName: "John Doe",
    email: "john.doe@bilgenly.com",
    initials: "JD",
    joinedLabel: "Joined March 2025",
    location: "San Francisco, CA",
    bio: "Computer Science student focused on strengthening fundamentals, class performance, and self-paced revision.",
  },
  {
    id: "student-emma-johnson",
    role: "student",
    fullName: "Emma Johnson",
    email: "emma.johnson@bilgenly.com",
    initials: "EJ",
    joinedLabel: "Joined April 2025",
    location: "San Francisco, CA",
    bio: "Learner who enjoys quick iteration, class challenges, and building consistent study habits.",
  },
  {
    id: "student-liam-chen",
    role: "student",
    fullName: "Liam Chen",
    email: "liam.chen@bilgenly.com",
    initials: "LC",
    joinedLabel: "Joined February 2025",
    location: "San Francisco, CA",
    bio: "Student with a strong interest in programming, feedback loops, and topic mastery over time.",
  },
  {
    id: "student-sophia-patel",
    role: "student",
    fullName: "Sophia Patel",
    email: "sophia.patel@bilgenly.com",
    initials: "SP",
    joinedLabel: "Joined January 2025",
    location: "San Francisco, CA",
    bio: "Curious student using Bilgenly to stay organized across quizzes, deadlines, and classroom invitations.",
  },
];

export const defaultMockStudentId = mockStudentUsers[0].id;

export function getMockStudentById(studentId: string | null | undefined) {
  return mockStudentUsers.find((student) => student.id === studentId) ?? null;
}

export function getMockStudentByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    mockStudentUsers.find(
      (student) => student.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

export function getNotificationRecipientUserIdByEmail(email: string) {
  return `email:${email.trim().toLowerCase()}`;
}
