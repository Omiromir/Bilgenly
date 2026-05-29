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

  // The query key includes userId so different accounts never share cached data.
  // staleTime is intentionally short (30 s) since attempt history changes after
  // each quiz completion — refreshAttempts() force-invalidates the cache anyway.
  const queryKey = useMemo(() => ["myAttempts", userId] as const, [userId]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: getMyAttempts,
    enabled: Boolean(token && userId && role === "student"),
    staleTime: 30 * 1000,
    retry: 1,
  });

  // Invalidating the query triggers an immediate background re-fetch.
  // Callers (e.g. QuizSessionPage after quiz completion) no longer need to wait
  // for a 500 ms debounce — the data updates as soon as the API responds.
  const refreshAttempts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // When a quiz is deleted (by admin or anywhere else in the app), every
  // attempt referencing that quiz is also gone on the backend — invalidate
  // so the student's results list updates live instead of showing ghost
  // entries that 404 on click.
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
      isLoading: isLoading && !data, // don't flash loading when stale data is shown
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
