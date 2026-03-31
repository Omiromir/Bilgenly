import { getToken, getRole } from "../features/auth/api";
import type { UserRole } from "../features/auth/api";

export type { UserRole };

export function getDashboardPathByRole(role: UserRole) {
    switch (role) {
        case "teacher":
            return "/dashboard/teacher";
        case "student":
            return "/dashboard/student";
        case "moderator":
            return "/dashboard/moderator";
        default:
            return "/signin";
    }
}

export function isAuthenticated() {
    return !!getToken();
}

export function getCurrentRole(): UserRole | null {
    return getRole() as UserRole | null;
}
