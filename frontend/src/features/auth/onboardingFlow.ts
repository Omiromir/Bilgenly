import type { UserRole } from "../../lib/auth";
import type {
    AuthResponse,
    OnboardingAnswers,
    StoredAuthUserProfile,
} from "./types";

export const LEGACY_ONBOARDING_KEY = "bilgenly_onboarding_done";

const ACCOUNT_REGISTRY_KEY = "bilgenly_completed_accounts";

interface StoredAccountRecord {
    completedAt: string;
    createdAt: string;
    email: string;
    fullName: string;
    onboardingAnswers: OnboardingAnswers | null;
    onboardingCompleted: boolean;
    role: UserRole;
    updatedAt: string;
    userId: string;
}

type StoredAccountRegistry = Record<string, StoredAccountRecord>;

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function isUserRole(role: string): role is UserRole {
    return role === "teacher" || role === "student" || role === "moderator";
}

function assertAuthAccountState(response: AuthResponse) {
    const normalizedRole = response.role.trim().toLowerCase();

    if (!isUserRole(normalizedRole)) {
        throw new Error(
            "Your account is missing a valid role in the auth response. Please contact support.",
        );
    }

    if (typeof response.onboardingCompleted !== "boolean") {
        throw new Error(
            "Your account is missing onboarding status in the auth response. Please contact support.",
        );
    }
}

function getAccountStorageKey(email: string) {
    return normalizeEmail(email);
}

function readStoredAccountRegistry() {
    const storedValue = localStorage.getItem(ACCOUNT_REGISTRY_KEY);

    if (!storedValue) {
        return {} as StoredAccountRegistry;
    }

    try {
        const parsedValue = JSON.parse(storedValue) as StoredAccountRegistry;
        return parsedValue && typeof parsedValue === "object"
            ? parsedValue
            : ({} as StoredAccountRegistry);
    } catch {
        localStorage.removeItem(ACCOUNT_REGISTRY_KEY);
        return {} as StoredAccountRegistry;
    }
}

function writeStoredAccountRegistry(registry: StoredAccountRegistry) {
    localStorage.setItem(ACCOUNT_REGISTRY_KEY, JSON.stringify(registry));
}

export function getCompletedAccountRecord(identity: {
    email?: string | null;
    userId?: string | null;
}) {
    const registry = readStoredAccountRegistry();

    if (identity.email) {
        const record = registry[getAccountStorageKey(identity.email)];
        if (record) {
            return record;
        }
    }

    if (!identity.userId) {
        return null;
    }

    return (
        Object.values(registry).find((record) => record.userId === identity.userId) ?? null
    );
}

export function persistCompletedAccount({
    createdAt,
    email,
    onboardingAnswers,
    role,
    userId,
    username,
}: {
    createdAt?: string;
    email: string;
    onboardingAnswers: OnboardingAnswers;
    role: UserRole;
    userId: string;
    username: string;
}) {
    const registry = readStoredAccountRegistry();
    const existingRecord = getCompletedAccountRecord({ email, userId });
    const now = new Date().toISOString();
    const nextRecord: StoredAccountRecord = {
        completedAt: now,
        createdAt: createdAt ?? existingRecord?.createdAt ?? now,
        email: normalizeEmail(email),
        fullName: username.trim(),
        onboardingAnswers,
        onboardingCompleted: true,
        role,
        updatedAt: now,
        userId,
    };

    registry[getAccountStorageKey(email)] = nextRecord;
    writeStoredAccountRegistry(registry);

    return nextRecord;
}

export function resolveStoredOnboardingState(profile: {
    email: string;
    onboardingAnswers?: OnboardingAnswers | null;
    onboardingCompleted?: boolean;
    role: string;
    userId: string;
    username: string;
}) {
    const normalizedRole = profile.role.trim().toLowerCase();

    if (!isUserRole(normalizedRole)) {
        return {
            onboardingAnswers: null,
            onboardingCompleted: false,
        };
    }

    if (normalizedRole === "moderator") {
        return {
            onboardingAnswers: profile.onboardingAnswers ?? { role: "moderator" },
            onboardingCompleted: true,
        };
    }

    const storedRecord = getCompletedAccountRecord({
        email: profile.email,
        userId: profile.userId,
    });
    const explicitCompleted = profile.onboardingCompleted === true;

    return {
        onboardingAnswers:
            storedRecord?.onboardingAnswers ??
            profile.onboardingAnswers ??
            (explicitCompleted ? { role: normalizedRole } : null),
        onboardingCompleted:
            explicitCompleted ||
            storedRecord?.onboardingCompleted ||
            false,
    };
}

export function hydrateStoredAuthUserProfile(
    profile: Omit<StoredAuthUserProfile, "onboardingAnswers" | "onboardingCompleted"> & {
        onboardingAnswers?: OnboardingAnswers | null;
        onboardingCompleted?: boolean;
    },
) {
    const { onboardingAnswers, onboardingCompleted } = resolveStoredOnboardingState(profile);

    return {
        ...profile,
        onboardingAnswers,
        onboardingCompleted,
    } satisfies StoredAuthUserProfile;
}

export function migrateLegacyOnboardingState(
    profile: Omit<StoredAuthUserProfile, "onboardingAnswers" | "onboardingCompleted"> & {
        onboardingCompleted?: boolean;
        onboardingAnswers?: OnboardingAnswers | null;
    },
) {
    const hasLegacyCompletedFlag = localStorage.getItem(LEGACY_ONBOARDING_KEY) === "true";

    if (hasLegacyCompletedFlag) {
        const normalizedRole = profile.role.trim().toLowerCase();

        if (isUserRole(normalizedRole)) {
            persistCompletedAccount({
                email: profile.email,
                onboardingAnswers: { role: normalizedRole },
                role: normalizedRole,
                userId: profile.userId,
                username: profile.username,
            });
        }

        localStorage.removeItem(LEGACY_ONBOARDING_KEY);
    }

    return hydrateStoredAuthUserProfile(profile);
}

export function buildStoredAuthUserProfile(response: AuthResponse) {
    assertAuthAccountState(response);

    return migrateLegacyOnboardingState({
        email: response.email,
        onboardingCompleted: response.onboardingCompleted,
        role: response.role,
        userId: response.userId,
        username: response.username,
        bio: response.bio,
        avatarUrl: response.avatarUrl,
        createdAt: response.createdAt,
    });
}
