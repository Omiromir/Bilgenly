import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserRole } from "../../lib/auth";
import {
  completeRegistration as completeRegistrationRequest,
  getMe,
  updateRole,
} from "../../features/auth/api";
import {
  buildStoredAuthUserProfile,
  hydrateStoredAuthUserProfile,
  persistCompletedAccount,
} from "../../features/auth/onboardingFlow";
import {
  clearOnboardingDraft,
  clearRegistrationDraft,
} from "../../features/auth/registrationDraft";
import type {
  AuthResponse,
  CompleteRegistrationPayload,
  OnboardingAnswers,
  StoredAuthUserProfile,
} from "../../features/auth/types";
import { getDashboardPathByRole } from "../../lib/auth";
import { getRequestErrorMessage } from "../../lib/apiClient";
import {
  type MockDashboardUser,
} from "../../features/dashboard/mock/mockUsers";

interface AuthContextValue {
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  token: string | null;
  currentUser: MockDashboardUser | null;
  onboardingCompleted: boolean;
  defaultRedirectPath: string;
  authenticate: (response: AuthResponse) => StoredAuthUserProfile;
  completeOnboardingForAuthenticatedUser: (
    answers: OnboardingAnswers & { role: UserRole },
  ) => Promise<StoredAuthUserProfile>;
  completeRegistration: (
    payload: CompleteRegistrationPayload,
  ) => Promise<StoredAuthUserProfile>;
  updateCurrentUserProfile: (updates: {
    username?: string;
    email?: string;
  }) => void;
  signOut: () => void;
}

const AUTH_ROLE_KEY = "bilgenly_role";
const AUTH_TOKEN_KEY = "bilgenly_token";
const AUTH_USER_KEY = "bilgenly_current_user";

function readStoredRole(): UserRole | null {
  const savedRole = localStorage.getItem(AUTH_ROLE_KEY);

  if (
    savedRole === "teacher" ||
    savedRole === "student" ||
    savedRole === "moderator"
  ) {
    return savedRole;
  }

  return null;
}

function readStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function readStoredUser(): StoredAuthUserProfile | null {
  const savedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(savedUser) as Partial<StoredAuthUserProfile>;

    if (
      typeof parsedUser.userId !== "string" ||
      typeof parsedUser.username !== "string" ||
      typeof parsedUser.email !== "string" ||
      typeof parsedUser.role !== "string"
    ) {
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }

    return hydrateStoredAuthUserProfile({
      email: parsedUser.email,
      onboardingAnswers: parsedUser.onboardingAnswers,
      onboardingCompleted: parsedUser.onboardingCompleted,
      role: parsedUser.role,
      userId: parsedUser.userId,
      username: parsedUser.username,
      bio: parsedUser.bio,
      avatarUrl: parsedUser.avatarUrl,
      createdAt: parsedUser.createdAt,
    });
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function readInitialRole() {
  const storedUser = readStoredUser();
  const storedUserRole = storedUser ? normalizeRole(storedUser.role) : null;

  return storedUserRole ?? readStoredRole();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const joinedFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

function formatJoinedLabel(createdAt?: string | null) {
  if (!createdAt) {
    return "Member";
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Member";
  }
  return `Joined ${joinedFormatter.format(date)}`;
}

function mapAuthUserToDashboardUser(
  authUser: StoredAuthUserProfile,
  fallbackRole: UserRole | null,
): MockDashboardUser | null {
  const normalizedRole = authUser.role.toLowerCase() as UserRole;
  const role = fallbackRole ?? normalizedRole;

  if (role !== "teacher" && role !== "student" && role !== "moderator") {
    return null;
  }

  return {
    id: authUser.userId || `email:${authUser.email.trim().toLowerCase()}`,
    role,
    fullName: authUser.username,
    email: authUser.email,
    initials: getInitials(authUser.username),
    joinedLabel: formatJoinedLabel(authUser.createdAt ?? null),
    location: "",
    bio: authUser.bio ?? "",
    avatarUrl: authUser.avatarUrl ?? null,
  };
}

function normalizeRole(role: string) {
  const normalizedRole = role.trim().toLowerCase();

  if (
    normalizedRole === "teacher" ||
    normalizedRole === "student" ||
    normalizedRole === "moderator"
  ) {
    return normalizedRole;
  }

  return null;
}

function buildCompletedUserProfile(
  response: AuthResponse,
  onboardingAnswers: OnboardingAnswers & { role: UserRole },
  createdAt?: string,
) {
  persistCompletedAccount({
    createdAt,
    email: response.email,
    onboardingAnswers,
    role: onboardingAnswers.role,
    userId: response.userId,
    username: response.username,
  });

  return hydrateStoredAuthUserProfile({
    email: response.email,
    onboardingAnswers,
    onboardingCompleted: true,
    role: response.role,
    userId: response.userId,
    username: response.username,
  });
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [role, setRoleState] = useState<UserRole | null>(() => readInitialRole());
  const [token, setTokenState] = useState<string | null>(() => readStoredToken());
  const [authUser, setAuthUser] = useState<StoredAuthUserProfile | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredToken()));
  const [authError, setAuthError] = useState<string | null>(null);

  const persistSession = (nextUser: StoredAuthUserProfile, nextToken: string) => {
    const normalizedRole = normalizeRole(nextUser.role);

    setAuthUser(nextUser);
    setTokenState(nextToken);
    setRoleState(normalizedRole);
    setAuthError(null);
    setIsLoading(false);

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);

    if (normalizedRole) {
      localStorage.setItem(AUTH_ROLE_KEY, normalizedRole);
    } else {
      localStorage.removeItem(AUTH_ROLE_KEY);
    }
  };

  const authenticate = (response: AuthResponse) => {
    const nextUser = buildStoredAuthUserProfile(response);
    clearRegistrationDraft();
    clearOnboardingDraft();
    persistSession(nextUser, response.token);
    return nextUser;
  };

  useEffect(() => {
    if (!token) {
      setAuthUser(null);
      setRoleState(null);
      setAuthError(null);
      setIsLoading(false);
      localStorage.removeItem(AUTH_USER_KEY);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchUser = async () => {
      try {
        const user = await getMe();

        if (!isMounted) {
          return;
        }

        const hydratedUser = buildStoredAuthUserProfile({
          ...user,
          token,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
        });
        persistSession(hydratedUser, token);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = getRequestErrorMessage(
          error,
          "We could not restore your account state from the server.",
        );

        setAuthUser(null);
        setRoleState(null);
        setTokenState(null);
        setAuthError(message);
        setIsLoading(false);
        localStorage.removeItem(AUTH_ROLE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    };

    void fetchUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const signOut = () => {
    setRoleState(null);
    setTokenState(null);
    setAuthUser(null);
    setAuthError(null);
    setIsLoading(false);
    clearRegistrationDraft();
    clearOnboardingDraft();
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const updateCurrentUserProfile = ({
    username,
    email,
  }: {
    username?: string;
    email?: string;
  }) => {
    setAuthUser((current) => {
      if (!current) {
        return current;
      }

      const nextUser = hydrateStoredAuthUserProfile({
        ...current,
        email: typeof email === "string" ? email.trim() || current.email : current.email,
        username:
          typeof username === "string" ? username.trim() || current.username : current.username,
      });

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const completeRegistration = async (payload: CompleteRegistrationPayload) => {
    const response = await completeRegistrationRequest(payload);
    const nextUser = buildCompletedUserProfile(
      response,
      payload.onboarding,
      payload.registration.createdAt,
    );

    clearRegistrationDraft();
    clearOnboardingDraft();
    persistSession(nextUser, response.token);

    return nextUser;
  };

  const completeOnboardingForAuthenticatedUser = async (
    answers: OnboardingAnswers & { role: UserRole },
  ) => {
    if (!authUser || !token) {
      throw new Error("Please sign in or start sign up again to complete onboarding.");
    }

    const currentRole = normalizeRole(authUser.role);
    const roleDidChange = currentRole !== answers.role;
    const response = roleDidChange
      ? await updateRole(answers.role.charAt(0).toUpperCase() + answers.role.slice(1))
      : ({
          email: authUser.email,
          onboardingCompleted: true,
          role: authUser.role,
          token,
          userId: authUser.userId,
          username: authUser.username,
        } satisfies AuthResponse);
    const nextUser = buildCompletedUserProfile(response, answers);

    clearOnboardingDraft();
    persistSession(nextUser, response.token);

    return nextUser;
  };

  const onboardingCompleted = authUser?.onboardingCompleted ?? false;
  const currentUser = authUser
    ? mapAuthUserToDashboardUser(authUser, role)
    : null;
  const defaultRedirectPath = !token || !role
    ? "/signin"
    : onboardingCompleted
      ? getDashboardPathByRole(role)
      : "/onboarding";

  const value = useMemo(
    () => ({
      role,
      token,
      isAuthenticated: role !== null && token !== null && authUser !== null,
      isLoading,
      authError,
      currentUser,
      onboardingCompleted,
      defaultRedirectPath,
      authenticate,
      completeOnboardingForAuthenticatedUser,
      completeRegistration,
      updateCurrentUserProfile,
      signOut,
    }),
    [
      authenticate,
      currentUser,
      completeOnboardingForAuthenticatedUser,
      completeRegistration,
      defaultRedirectPath,
      authError,
      isLoading,
      onboardingCompleted,
      role,
      signOut,
      token,
      updateCurrentUserProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
