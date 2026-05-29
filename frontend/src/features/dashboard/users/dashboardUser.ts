import type { UserRole } from "../../../lib/auth";

// Shared shape used by AuthProvider for the current dashboard user and by
// TeacherClassesProvider for student member records. The name "Mock" was a
// leftover from earlier iterations when this file held seeded demo users;
// today the data is fully backend-driven, so the type is named accordingly.
export interface MockDashboardUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  initials: string;
  joinedLabel: string;
  location: string;
  bio: string;
  avatarUrl?: string | null;
}

export function getNotificationRecipientUserIdByEmail(email: string) {
  return `email:${email.trim().toLowerCase()}`;
}
