import type { UserRole } from "../../lib/auth";

export interface SignInFormValues {
    email: string;
    password: string;
}

export interface SignUpFormValues {
    email: string;
    fullName: string;
    password: string;
}

export interface RegistrationDraft extends SignUpFormValues {
    createdAt: string;
    source?: "signup";
}

export interface OnboardingAnswers {
    role?: UserRole;
    goal?: string;
    experience?: string;
    pace?: string;
    reminderTime?: string | null;
}

export interface CompleteRegistrationPayload {
    registration: RegistrationDraft;
    onboarding: OnboardingAnswers & {
        role: UserRole;
    };
}

export interface AuthResponse {
    userId: string;
    token: string;
    username: string;
    email: string;
    role: string;
    onboardingCompleted?: boolean;
    bio?: string | null;
    avatarUrl?: string | null;
    createdAt?: string | null;
}

export interface StoredAuthUserProfile {
    userId: string;
    username: string;
    email: string;
    role: string;
    onboardingCompleted: boolean;
    onboardingAnswers: OnboardingAnswers | null;
    bio?: string | null;
    avatarUrl?: string | null;
    createdAt?: string | null;
}

export interface ResetPasswordFormValues {
    email: string;
}

export interface SignInFormErrors {
    email?: string;
    password?: string;
}

export interface SignUpFormErrors {
    email?: string;
    fullName?: string;
    password?: string;
}

export interface ResetPasswordFormErrors {
    email?: string;
}
