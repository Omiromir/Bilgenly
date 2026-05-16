import { apiRequest, getRequestErrorMessage } from "../../lib/apiClient";
import type {
  AuthResponse,
  CompleteRegistrationPayload,
  ResetPasswordFormValues,
  SignInFormValues,
} from "./types";

const AUTH_TOKEN_KEY = "bilgenly_token";
const AUTH_ROLE_KEY = "bilgenly_role";

export type UserRole = "teacher" | "student" | "moderator";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface SecurityActionResult {
  mode: "local-only" | "remote";
}

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(AUTH_ROLE_KEY);
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem("bilgenly_current_user");
}

export async function signIn(data: SignInFormValues & { rememberMe: boolean }) {
  try {
    const result = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: {
        email: data.email,
        password: data.password,
      },
      skipAuth: true,
      fallbackErrorMessage: "Login failed",
    });

    return result;
  } catch (error) {
    throw new Error(getRequestErrorMessage(error, "Login failed"));
  }
}

export async function completeRegistration(payload: CompleteRegistrationPayload) {
  const { onboarding, registration } = payload;

  try {
    const result = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: {
        username: registration.fullName,
        email: registration.email,
        password: registration.password,
        role: onboarding.role.charAt(0).toUpperCase() + onboarding.role.slice(1),
      },
      skipAuth: true,
      fallbackErrorMessage: "Registration failed",
    });

    return result;
  } catch (error) {
    throw new Error(getRequestErrorMessage(error, "Registration failed"));
  }
}

export async function updateRole(role: string) {
  try {
    const result = await apiRequest<AuthResponse>("/api/auth/role", {
      method: "PATCH",
      body: { role },
      fallbackErrorMessage: "Failed to update role",
    });

    return result;
  } catch (error) {
    throw new Error(getRequestErrorMessage(error, "Failed to update role"));
  }
}

export async function requestPasswordReset(_: ResetPasswordFormValues) {
  return new Promise((resolve) => window.setTimeout(resolve, 400));
}


export async function getMe() {
  return apiRequest<{
    userId: string;
    username: string;
    email: string;
    role: string;
    onboardingCompleted: boolean;
    bio?: string | null;
    avatarUrl?: string | null;
    createdAt?: string | null;
  }>("/api/auth/me", {
    fallbackErrorMessage: "Unauthorized",
  });
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<SecurityActionResult> {
  try {
    await apiRequest<{ message: string }>("/api/auth/password", {
      method: "PATCH",
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      },
      fallbackErrorMessage: "Unable to update password.",
    });

    return { mode: "remote" };
  } catch (error) {
    throw new Error(getRequestErrorMessage(error, "Unable to update password."));
  }
}

export async function revokeSessionById(_: string): Promise<SecurityActionResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ mode: "local-only" }), 250);
  });
}
