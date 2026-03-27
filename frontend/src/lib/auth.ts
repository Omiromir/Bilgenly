export type UserRole = "teacher" | "student" | "moderator";

export function getDashboardPathByRole(role: UserRole) {
  switch (role) {
    case "teacher":
      return "/dashboard/teacher/overview";
    case "student":
      return "/dashboard/student/overview";
    case "moderator":
      return "/dashboard/moderator";
    default:
      return "/signin";
  }
}
