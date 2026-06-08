import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyAttempts, type MyAttemptDto } from "../../features/quiz-session/api/attemptsApi";
import { useAuth } from "./AuthProvider";

interface StudentAttemptsContextType {
  attempts: MyAttemptDto[];
  isLoading: boolean;
  error: string | null;
  refreshAttempts: () => Promise<void>;
}

const StudentAttemptsContext = createContext<StudentAttemptsContextType | null>(null);

interface StudentAttemptsProviderProps {
  children: React.ReactNode;
}

export function StudentAttemptsProvider({ children }: StudentAttemptsProviderProps) {
  const { role, token, currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ["myAttempts", userId] as const, [userId]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: getMyAttempts,
    enabled: Boolean(token && userId && role === "student"),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const refreshAttempts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  useEffect(() => {
    function onQuizDeleted() {
      void queryClient.invalidateQueries({ queryKey });
    }
    window.addEventListener(
      "bilgenly:quiz-deleted",
      onQuizDeleted as EventListener,
    );
    return () => {
      window.removeEventListener(
        "bilgenly:quiz-deleted",
        onQuizDeleted as EventListener,
      );
    };
  }, [queryClient, queryKey]);

  const value: StudentAttemptsContextType = useMemo(
    () => ({
      attempts: data ?? [],
      isLoading: isLoading && !data,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
      refreshAttempts,
    }),
    [data, isLoading, error, refreshAttempts],
  );

  return (
    <StudentAttemptsContext.Provider value={value}>
      {children}
    </StudentAttemptsContext.Provider>
  );
}

export function useStudentAttempts(): StudentAttemptsContextType {
  const context = useContext(StudentAttemptsContext);

  if (!context) {
    throw new Error("useStudentAttempts must be used within StudentAttemptsProvider");
  }

  return context;
}
