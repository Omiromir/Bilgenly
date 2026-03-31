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
  defaultMockStudentId,
  getMockStudentById,
  mockStudentUsers,
  mockTeacherUser,
  type MockDashboardUser,
} from "../../features/dashboard/mock/mockUsers";

interface AuthContextValue {
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  currentUser: MockDashboardUser | null;
  currentStudent: MockDashboardUser | null;
  availableStudents: MockDashboardUser[];
  setRole: (role: UserRole | null) => void;
  signInAsRole: (role: UserRole, token: string) => void;
  signOut: () => void;
  setCurrentStudentId: (studentId: string) => void;
}

const AUTH_ROLE_KEY = "bilgenly_role";
const AUTH_TOKEN_KEY = "bilgenly_token";
const AUTH_STUDENT_KEY = "bilgenly_current_student_id";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentIdState] =
    useState(defaultMockStudentId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null;
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedStudentId = localStorage.getItem(AUTH_STUDENT_KEY);

    if (
      savedRole === "teacher" ||
      savedRole === "student" ||
      savedRole === "moderator"
    ) {
      setRoleState(savedRole);
    }
    if (savedToken) {
      setTokenState(savedToken);
    }
    if (savedStudentId && getMockStudentById(savedStudentId)) {
      setCurrentStudentIdState(savedStudentId);
    }
    setIsLoading(false);
  }, []);

  const setRole = (nextRole: UserRole | null) => {
    setRoleState(nextRole);

    if (nextRole) {
      localStorage.setItem(AUTH_ROLE_KEY, nextRole);
    } else {
      localStorage.removeItem(AUTH_ROLE_KEY);
    }
  };

  const signInAsRole = (nextRole: UserRole, nextToken: string) => {
    setRoleState(nextRole);
    setTokenState(nextToken);
    localStorage.setItem(AUTH_ROLE_KEY, nextRole);
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
  };

  const signOut = () => {
    setRoleState(null);
    setTokenState(null);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const setCurrentStudentId = (studentId: string) => {
    if (!getMockStudentById(studentId)) {
      return;
    }

    setCurrentStudentIdState(studentId);
    localStorage.setItem(AUTH_STUDENT_KEY, studentId);
  };

  const currentStudent = getMockStudentById(currentStudentId);
  const currentUser =
    role === "teacher"
      ? mockTeacherUser
      : role === "student"
        ? currentStudent
        : null;

  const value = useMemo(
    () => ({
      role,
      token,
      isAuthenticated: role !== null && token !== null,
      isLoading,
      currentUser,
      currentStudent,
      availableStudents: mockStudentUsers,
      setRole,
      signInAsRole,
      signOut,
      setCurrentStudentId,
    }),
    [currentStudent, currentUser, isLoading, role, token],
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
