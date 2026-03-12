import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type UserRole = "teacher" | "student" | "moderator" | null;

interface AuthContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [role, setRole] = useState<UserRole>(null);

  const value = useMemo(
    () => ({
      role,
      setRole,
    }),
    [role]
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
