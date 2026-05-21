import {
  applyBackendAttemptResult,
  buildSubmitAttemptPayload,
  canSubmitSessionToBackend,
  mergeQuizWithStartedAttempt,
} from "../../features/quiz-session/api/attemptAdapters";
import {
  getAttemptsByQuiz,
  startAttempt,
  submitAttempt,
} from "../../features/quiz-session/api/attemptsApi";
import { getMyAnalytics } from "../../features/dashboard/api/analyticsApi";
import type { AttemptSummaryDto } from "../../features/dashboard/api/dashboardApiTypes";
import { getRequestErrorMessage, isGuidString } from "../../lib/apiClient";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { QuizRecord } from "../../features/dashboard/components/quiz-library/quizLibraryTypes";
import type {
  QuizSessionLaunchContext,
  QuizSessionRecord,
  SharedAssignedQuizSessionRecord,
} from "../../features/quiz-session/quizSessionTypes";
import { getAssignmentLevelStatus } from "../../features/assignments/assignmentConstraints";
import {
  buildQuizPlaybackSummary,
  createQuizSessionRecord,
  getLatestQuizSession,
  getQuestionState,
  sortQuizSessionsByUpdatedAt,
} from "../../features/quiz-session/quizSessionUtils";
import { useAuth } from "./AuthProvider";
import type {
  TeacherClassAssignedQuiz,
  TeacherClassRecord,
} from "../../features/dashboard/components/classes/teacherClassesTypes";
import { useQuizLibrary } from "./QuizLibraryProvider";
import { useTeacherClasses } from "./TeacherClassesProvider";
import {
  getScopedStorageValue,
  getUserStorageScope,
  getUserScopedStorageKey,
} from "./userScopedStorage";

const QUIZ_SESSIONS_STORAGE_KEY = "bilgenly_quiz_sessions";
const SHARED_ASSIGNED_QUIZ_SESSIONS_STORAGE_KEY =
  "bilgenly_shared_assigned_quiz_sessions";

interface QuizSessionContextValue {
  sessions: QuizSessionRecord[];
  sharedAssignedSessions: SharedAssignedQuizSessionRecord[];
  isHydrated: boolean;
  getSessionById: (sessionId: string) => QuizSessionRecord | undefined;
  getLatestInProgressSession: (
    quizId: string,
    viewerRole: "teacher" | "student",
    assignmentId?: string | null,
  ) => QuizSessionRecord | undefined;
  getLatestCompletedSession: (
    quizId: string,
    viewerRole: "teacher" | "student",
    assignmentId?: string | null,
  ) => QuizSessionRecord | undefined;
  getCompletedSessionsForRole: (
    viewerRole: "teacher" | "student",
  ) => QuizSessionRecord[];
  createSession: (
    quiz: QuizRecord,
    context: QuizSessionLaunchContext,
  ) => Promise<QuizSessionRecord>;
  selectAnswer: (
    sessionId: string,
    questionId: string,
    selectedIndex: number,
  ) => void;
  submitAnswer: (sessionId: string, questionId: string) => void;
  setCurrentQuestion: (sessionId: string, questionIndex: number) => void;
  goToNextQuestion: (sessionId: string) => void;
  completeSession: (
    sessionId: string,
    options?: {
      completionReason?: QuizSessionRecord["completionReason"];
      finishedAt?: string;
    },
  ) => Promise<void>;
}

const QuizSessionContext = createContext<QuizSessionContextValue | undefined>(
  undefined,
);

interface QuizSessionProviderProps {
  children: ReactNode;
}

interface AssignmentLookupEntry {
  assignment: TeacherClassAssignedQuiz;
  teacherClass: TeacherClassRecord;
}

function sanitizeQuizSessionRecord(
  value: Partial<QuizSessionRecord>,
): QuizSessionRecord | null {
  if (
    typeof value.id !== "string" ||
    typeof value.quizId !== "string" ||
    (value.viewerRole !== "teacher" && value.viewerRole !== "student") ||
    (value.status !== "in-progress" && value.status !== "completed") ||
    !value.quiz ||
    !Array.isArray(value.quiz.questions) ||
    !Array.isArray(value.questionStates)
  ) {
    return null;
  }

  return {
    id: value.id,
    quizId: value.quizId,
    viewerRole: value.viewerRole,
    syncMode: value.syncMode === "backend" ? "backend" : "local",
    backendAttemptId:
      typeof value.backendAttemptId === "string"
        ? value.backendAttemptId
        : undefined,
    status: value.status,
    attemptNumber:
      typeof value.attemptNumber === "number" && value.attemptNumber > 0
        ? Math.round(value.attemptNumber)
        : 1,
    startedAt:
      typeof value.startedAt === "string"
        ? value.startedAt
        : new Date().toISOString(),
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
    finishedAt:
      typeof value.finishedAt === "string" ? value.finishedAt : undefined,
    completionReason:
      value.status === "completed"
        ? value.completionReason === "deadline-expired"
          ? "deadline-expired"
          : "submitted"
        : undefined,
    sourceType:
      typeof value.sourceType === "string" ? value.sourceType : "quiz-library",
    sourceLabel:
      typeof value.sourceLabel === "string"
        ? value.sourceLabel
        : value.quiz.sourceLabel,
    assignmentContext: value.assignmentContext,
    quiz: {
      ...value.quiz,
      questions: value.quiz.questions.map((question) => ({
        ...question,
        options: Array.isArray(question.options) ? [...question.options] : [],
        optionIds: Array.isArray(question.optionIds)
          ? [...question.optionIds]
          : undefined,
      })),
    },
    currentQuestionIndex: Math.min(
      Math.max(
        typeof value.currentQuestionIndex === "number"
          ? value.currentQuestionIndex
          : 0,
        0,
      ),
      Math.max((value.quiz.questions?.length ?? 1) - 1, 0),
    ),
    questionStates: value.questionStates.map((questionState) => ({
      questionId: questionState.questionId,
      selectedIndex:
        typeof questionState.selectedIndex === "number"
          ? questionState.selectedIndex
          : null,
      selectedIndices: Array.isArray(questionState.selectedIndices)
        ? questionState.selectedIndices.filter(
            (selectedIndex): selectedIndex is number =>
              typeof selectedIndex === "number",
          )
        : typeof questionState.selectedIndex === "number"
          ? [questionState.selectedIndex]
          : [],
      submitted: Boolean(questionState.submitted),
      submittedAt:
        typeof questionState.submittedAt === "string"
          ? questionState.submittedAt
          : undefined,
      isCorrect:
        typeof questionState.isCorrect === "boolean"
          ? questionState.isCorrect
          : undefined,
    })),
    correctCount:
      typeof value.correctCount === "number" ? value.correctCount : 0,
    earnedPoints:
      typeof value.earnedPoints === "number" ? value.earnedPoints : 0,
  };
}

function sanitizeSharedAssignedQuizSessionRecord(
  value: Partial<SharedAssignedQuizSessionRecord>,
): SharedAssignedQuizSessionRecord | null {
  if (
    typeof value.id !== "string" ||
    typeof value.quizId !== "string" ||
    typeof value.assignmentId !== "string" ||
    typeof value.classId !== "string" ||
    typeof value.className !== "string" ||
    !value.student ||
    typeof value.student.id !== "string" ||
    typeof value.student.fullName !== "string" ||
    typeof value.student.email !== "string" ||
    !value.session
  ) {
    return null;
  }

  const session = sanitizeQuizSessionRecord(value.session);

  if (!session || !session.assignmentContext) {
    return null;
  }

  return {
    id: value.id,
    quizId: value.quizId,
    assignmentId: value.assignmentId,
    classId: value.classId,
    className: value.className,
    student: {
      id: value.student.id,
      fullName: value.student.fullName,
      email: value.student.email,
      avatar:
        typeof value.student.avatar === "string"
          ? value.student.avatar
          : undefined,
    },
    session,
  };
}

function sortSharedAssignedQuizSessions(
  sessions: SharedAssignedQuizSessionRecord[],
) {
  return [...sessions].sort((left, right) => {
    const leftTimestamp = new Date(
      left.session.finishedAt ?? left.session.updatedAt,
    ).getTime();
    const rightTimestamp = new Date(
      right.session.finishedAt ?? right.session.updatedAt,
    ).getTime();

    return rightTimestamp - leftTimestamp;
  });
}

function buildAssignmentLookup(classes: TeacherClassRecord[]) {
  const assignments = new Map<string, AssignmentLookupEntry>();

  classes.forEach((teacherClass) => {
    teacherClass.assignedQuizzes.forEach((assignment) => {
      assignments.set(assignment.id, {
        assignment,
        teacherClass,
      });
    });
  });

  return assignments;
}

function syncAssignmentContext(
  assignmentContext: QuizSessionRecord["assignmentContext"],
  assignmentLookup: Map<string, AssignmentLookupEntry>,
) {
  if (!assignmentContext) {
    return assignmentContext;
  }

  const latestAssignment = assignmentLookup.get(assignmentContext.assignmentId);

  if (!latestAssignment) {
    return assignmentContext;
  }

  const assignmentStatus = getAssignmentLevelStatus(
    latestAssignment.assignment,
  );
  const nextAssignmentContext = {
    ...assignmentContext,
    classId: latestAssignment.teacherClass.id,
    className: latestAssignment.teacherClass.name,
    classSubject: latestAssignment.teacherClass.subject,
    assignedAt: latestAssignment.assignment.assignedAt,
    deadline: latestAssignment.assignment.deadline,
    maxAttempts: latestAssignment.assignment.maxAttempts,
    allowLateSubmissions: latestAssignment.assignment.allowLateSubmissions,
    assignedBy: latestAssignment.assignment.assignedBy,
    assignedByName: latestAssignment.assignment.assignedByName,
    visibility: latestAssignment.assignment.visibility,
    status: assignmentStatus,
  };

  return nextAssignmentContext.classId === assignmentContext.classId &&
    nextAssignmentContext.className === assignmentContext.className &&
    nextAssignmentContext.classSubject === assignmentContext.classSubject &&
    nextAssignmentContext.assignedAt === assignmentContext.assignedAt &&
    nextAssignmentContext.deadline === assignmentContext.deadline &&
    nextAssignmentContext.maxAttempts === assignmentContext.maxAttempts &&
    nextAssignmentContext.allowLateSubmissions ===
      assignmentContext.allowLateSubmissions &&
    nextAssignmentContext.assignedBy === assignmentContext.assignedBy &&
    nextAssignmentContext.assignedByName === assignmentContext.assignedByName &&
    nextAssignmentContext.visibility === assignmentContext.visibility &&
    nextAssignmentContext.status === assignmentContext.status
    ? assignmentContext
    : nextAssignmentContext;
}

function syncSessionWithLatestMetadata(
  session: QuizSessionRecord,
  quizLookup: Map<string, QuizRecord>,
  assignmentLookup: Map<string, AssignmentLookupEntry>,
) {
  let nextSession = session;
  const latestQuiz = quizLookup.get(session.quizId);

  if (latestQuiz) {
    const nextQuiz = {
      ...session.quiz,
      title: latestQuiz.title,
      description: latestQuiz.description,
      topic: latestQuiz.topic,
      difficulty: latestQuiz.difficulty,
      language: latestQuiz.language,
      durationMinutes: latestQuiz.durationMinutes,
      creatorName: latestQuiz.ownerName,
      ownerRole: latestQuiz.ownerRole,
      sourceLabel: latestQuiz.sourceLabel,
      note: latestQuiz.note,
    };

    if (
      nextQuiz.title !== session.quiz.title ||
      nextQuiz.description !== session.quiz.description ||
      nextQuiz.topic !== session.quiz.topic ||
      nextQuiz.difficulty !== session.quiz.difficulty ||
      nextQuiz.language !== session.quiz.language ||
      nextQuiz.durationMinutes !== session.quiz.durationMinutes ||
      nextQuiz.creatorName !== session.quiz.creatorName ||
      nextQuiz.ownerRole !== session.quiz.ownerRole ||
      nextQuiz.sourceLabel !== session.quiz.sourceLabel ||
      nextQuiz.note !== session.quiz.note
    ) {
      nextSession = {
        ...nextSession,
        quiz: nextQuiz,
      };
    }
  }

  const nextAssignmentContext = syncAssignmentContext(
    nextSession.assignmentContext,
    assignmentLookup,
  );

  if (nextAssignmentContext !== nextSession.assignmentContext) {
    nextSession = {
      ...nextSession,
      assignmentContext: nextAssignmentContext,
    };
  }

  return nextSession;
}

function countSessionAttempts(
  sessions: QuizSessionRecord[],
  quizId: string,
  viewerRole: "teacher" | "student",
  assignmentId?: string,
) {
  return sessions.filter((session) => {
    if (session.quizId !== quizId || session.viewerRole !== viewerRole) {
      return false;
    }

    return session.assignmentContext?.assignmentId === assignmentId;
  }).length;
}

function finalizeExpiredAssignedSessions(
  current: QuizSessionRecord[],
  assignmentLookup: Map<string, AssignmentLookupEntry>,
  now = Date.now(),
) {
  let hasChanges = false;

  const nextSessions = current.map((session) => {
    if (session.status !== "in-progress" || !session.assignmentContext) {
      return session;
    }

    const latestAssignment = assignmentLookup.get(
      session.assignmentContext.assignmentId,
    )?.assignment;
    const deadline =
      latestAssignment?.deadline ?? session.assignmentContext.deadline;
    const allowLateSubmissions =
      latestAssignment?.allowLateSubmissions ??
      session.assignmentContext.allowLateSubmissions;
    const maxAttempts =
      latestAssignment?.maxAttempts ?? session.assignmentContext.maxAttempts;
    const assignmentStatus = getAssignmentLevelStatus(
      {
        deadline,
        allowLateSubmissions,
      },
      now,
    );

    if (assignmentStatus !== "expired") {
      if (
        deadline === session.assignmentContext.deadline &&
        maxAttempts === session.assignmentContext.maxAttempts &&
        allowLateSubmissions ===
          session.assignmentContext.allowLateSubmissions &&
        session.assignmentContext.status === assignmentStatus
      ) {
        return session;
      }

      hasChanges = true;
      return {
        ...session,
        assignmentContext: {
          ...session.assignmentContext,
          deadline,
          maxAttempts,
          allowLateSubmissions,
          status: assignmentStatus,
        },
      };
    }

    hasChanges = true;
    const finishedAt = deadline ?? new Date(now).toISOString();

    return {
      ...session,
      status: "completed" as const,
      updatedAt: finishedAt,
      finishedAt,
      completionReason: "deadline-expired" as const,
      assignmentContext: {
        ...session.assignmentContext,
        deadline,
        maxAttempts,
        allowLateSubmissions,
        status: assignmentStatus,
      },
    };
  });

  return hasChanges ? sortQuizSessionsByUpdatedAt(nextSessions) : current;
}

export function QuizSessionProvider({ children }: QuizSessionProviderProps) {
  const { currentUser, role, token } = useAuth();
  const { quizzes, syncQuizPracticeState } = useQuizLibrary();
  const { classes } = useTeacherClasses();
  const [sessions, setSessions] = useState<QuizSessionRecord[]>([]);
  const [remoteCompletedAttempts, setRemoteCompletedAttempts] = useState<
    AttemptSummaryDto[]
  >([]);
  const [attemptRefreshKey, setAttemptRefreshKey] = useState(0);
  const [sharedAssignedSessions, setSharedAssignedSessions] = useState<
    SharedAssignedQuizSessionRecord[]
  >([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSharedAssignedHydrated, setIsSharedAssignedHydrated] =
    useState(false);
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(
    null,
  );
  const hydratedStorageScopeRef = useRef<string | null>(null);
  const syncedPracticeSummaryRef = useRef<Record<string, string>>({});
  const userId = currentUser?.id ?? null;
  const userEmail = currentUser?.email ?? null;
  const storageScope = useMemo(
    () =>
      getUserStorageScope({
        userId,
        email: userEmail,
        role,
        token,
      }),
    [userId, userEmail, role, token],
  );
  const storageKey = useMemo(
    () => getUserScopedStorageKey(QUIZ_SESSIONS_STORAGE_KEY, storageScope),
    [storageScope],
  );
  const quizLookup = useMemo(
    () => new Map(quizzes.map((quiz) => [quiz.id, quiz])),
    [quizzes],
  );
  const assignmentLookup = useMemo(
    () => buildAssignmentLookup(classes),
    [classes],
  );
  const syncQuizPracticeStateRef = useRef(syncQuizPracticeState);

  useEffect(() => {
    syncQuizPracticeStateRef.current = syncQuizPracticeState;
  }, [syncQuizPracticeState]);

  useEffect(() => {
    if (!token || role !== "student") {
      setRemoteCompletedAttempts([]);
      return;
    }

    let isCancelled = false;

    getMyAnalytics()
      .then((analytics) => {
        if (isCancelled) {
          return;
        }

        setRemoteCompletedAttempts(
          analytics.attempts.filter((attempt) => attempt.isCompleted),
        );
      })
      .catch(() => {
        if (!isCancelled) {
          setRemoteCompletedAttempts([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [attemptRefreshKey, role, token]);

  useEffect(() => {
    // Only hydrate when storageScope actually changes to prevent loops
    if (hydratedStorageScopeRef.current === storageScope) {
      return;
    }
    hydratedStorageScopeRef.current = storageScope;

    setSessions([]);
    setIsHydrated(false);
    setHydratedStorageKey(null);

    const savedValue = getScopedStorageValue(
      QUIZ_SESSIONS_STORAGE_KEY,
      storageScope,
    );

    if (!savedValue) {
      // No existing sessions — mark hydration complete and unlock persistence.
      // hydratedStorageKey must be set so the persistence effect can write new
      // sessions to localStorage (the guard requires hydratedStorageKey === storageKey).
      setHydratedStorageKey(storageKey);
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedValue) as Partial<QuizSessionRecord>[];
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      setSessions(
        Array.isArray(parsed)
          ? sortQuizSessionsByUpdatedAt(
              parsed
                .map((session) => sanitizeQuizSessionRecord(session))
                .filter(
                  (session): session is QuizSessionRecord => {
                    if (session === null) {
                      return false;
                    }

                    if (session.status === "in-progress") {
                      return true;
                    }

                    if (session.status === "completed" && session.finishedAt) {
                      const finishedTime = new Date(session.finishedAt).getTime();
                      return now - finishedTime < oneWeekMs;
                    }

                    return false;
                  },
                ),
            )
          : [],
      );
    } catch {
      setSessions([]);
    } finally {
      setHydratedStorageKey(storageKey);
      setIsHydrated(true);
    }
  }, [storageScope, storageKey]);

  useEffect(() => {
    setSharedAssignedSessions([]);
    setIsSharedAssignedHydrated(false);

    const savedValue = localStorage.getItem(
      SHARED_ASSIGNED_QUIZ_SESSIONS_STORAGE_KEY,
    );

    if (!savedValue) {
      setIsSharedAssignedHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(
        savedValue,
      ) as Partial<SharedAssignedQuizSessionRecord>[];
      setSharedAssignedSessions(
        Array.isArray(parsed)
          ? sortSharedAssignedQuizSessions(
              parsed
                .map((session) =>
                  sanitizeSharedAssignedQuizSessionRecord(session),
                )
                .filter(
                  (session): session is SharedAssignedQuizSessionRecord =>
                    session !== null &&
                    session.session.status === "in-progress",
                ),
            )
          : [],
      );
    } catch {
      setSharedAssignedSessions([]);
    } finally {
      setIsSharedAssignedHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || hydratedStorageKey !== storageKey) {
      return;
    }

    const sessionsPersistable = sessions.filter((session) => {
      if (session.status === "in-progress") {
        return true;
      }

      if (session.status === "completed" && session.finishedAt) {
        const finishedTime = new Date(session.finishedAt).getTime();
        const now = Date.now();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
        return now - finishedTime < oneWeekMs;
      }

      return false;
    });

    localStorage.setItem(storageKey, JSON.stringify(sessionsPersistable));
  }, [hydratedStorageKey, isHydrated, sessions, storageKey]);

  useEffect(() => {
    if (!isSharedAssignedHydrated) {
      return;
    }

    localStorage.setItem(
      SHARED_ASSIGNED_QUIZ_SESSIONS_STORAGE_KEY,
      JSON.stringify(
        sharedAssignedSessions.filter(
          (session) => session.session.status === "in-progress",
        ),
      ),
    );
  }, [isSharedAssignedHydrated, sharedAssignedSessions]);

  const quizLookupRef = useRef(quizLookup);
  const assignmentLookupRef = useRef(assignmentLookup);

  useEffect(() => {
    quizLookupRef.current = quizLookup;
    assignmentLookupRef.current = assignmentLookup;
  }, [quizLookup, assignmentLookup]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setSessions((current) => {
      let hasChanges = false;

      const nextSessions = current.map((session) => {
        const syncedSession = syncSessionWithLatestMetadata(
          session,
          quizLookupRef.current,
          assignmentLookupRef.current,
        );

        if (syncedSession !== session) {
          hasChanges = true;
        }

        return syncedSession;
      });

      return hasChanges ? sortQuizSessionsByUpdatedAt(nextSessions) : current;
    });
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const syncExpiredSessions = () => {
      setSessions((current) =>
        finalizeExpiredAssignedSessions(current, assignmentLookup, Date.now()),
      );
    };

    syncExpiredSessions();

    const hasTrackedAssignedAttempt = sessions.some(
      (session) =>
        session.status === "in-progress" && Boolean(session.assignmentContext),
    );

    if (!hasTrackedAssignedAttempt) {
      return;
    }

    const intervalId = window.setInterval(syncExpiredSessions, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [assignmentLookup, isHydrated, sessions]);

  useEffect(() => {
    if (!isSharedAssignedHydrated) {
      return;
    }

    setSharedAssignedSessions((current) => {
      let hasChanges = false;

      const nextSessions = current.map((entry) => {
        const syncedSession = syncSessionWithLatestMetadata(
          entry.session,
          quizLookupRef.current,
          assignmentLookupRef.current,
        );
        const latestAssignmentContext = syncedSession.assignmentContext;
        const nextClassName =
          latestAssignmentContext?.className ?? entry.className;

        if (
          syncedSession === entry.session &&
          nextClassName === entry.className
        ) {
          return entry;
        }

        hasChanges = true;
        return {
          ...entry,
          className: nextClassName,
          session: syncedSession,
        };
      });

      return hasChanges
        ? sortSharedAssignedQuizSessions(nextSessions)
        : current;
    });
  }, [assignmentLookup, isSharedAssignedHydrated, quizLookup]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SHARED_ASSIGNED_QUIZ_SESSIONS_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        setSharedAssignedSessions([]);
        return;
      }

      try {
        const parsed = JSON.parse(
          event.newValue,
        ) as Partial<SharedAssignedQuizSessionRecord>[];
        setSharedAssignedSessions(
          Array.isArray(parsed)
            ? sortSharedAssignedQuizSessions(
                parsed
                  .map((session) =>
                    sanitizeSharedAssignedQuizSessionRecord(session),
                  )
                  .filter(
                    (session): session is SharedAssignedQuizSessionRecord =>
                      session !== null &&
                      session.session.status === "in-progress",
                  ),
              )
            : [],
        );
      } catch {
        setSharedAssignedSessions([]);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const nextSyncedPracticeSummaries: Record<string, string> = {};

    const remoteSummariesByQuizId = remoteCompletedAttempts.reduce<
      Record<
        string,
        {
          latestDateTaken: string;
          latestScore: number;
          scores: number[];
        }
      >
    >((accumulator, attempt) => {
      const existing = accumulator[attempt.quizId];

      if (!existing) {
        accumulator[attempt.quizId] = {
          latestDateTaken: attempt.dateTaken,
          latestScore: attempt.score,
          scores: [attempt.score],
        };
        return accumulator;
      }

      const nextLatest =
        new Date(attempt.dateTaken).getTime() >
        new Date(existing.latestDateTaken).getTime()
          ? {
              latestDateTaken: attempt.dateTaken,
              latestScore: attempt.score,
            }
          : existing;

      accumulator[attempt.quizId] = {
        latestDateTaken: nextLatest.latestDateTaken,
        latestScore: nextLatest.latestScore,
        scores: [...existing.scores, attempt.score],
      };
      return accumulator;
    }, {});

    Object.entries(remoteSummariesByQuizId).forEach(([quizId, summary]) => {
      const practiceState = {
        practiceState: "completed",
        practiceProgressLabel: `Last score ${summary.latestScore}%`,
        attemptCount: summary.scores.length,
        averageScore: `${Math.round(
          summary.scores.reduce((total, score) => total + score, 0) /
            summary.scores.length,
        )}%`,
      } as const;
      const syncKey = `student:${quizId}`;
      const signature = JSON.stringify(practiceState);
      nextSyncedPracticeSummaries[syncKey] = signature;

      if (syncedPracticeSummaryRef.current[syncKey] === signature) {
        return;
      }

      syncQuizPracticeStateRef.current(quizId, practiceState);
    });

    const quizPairs = Array.from(
      new Set(
        sessions.map((session) => `${session.viewerRole}:${session.quizId}`),
      ),
    );

    quizPairs.forEach((pair) => {
      const [viewerRole, quizId] = pair.split(":") as [
        "teacher" | "student",
        string,
      ];
      const summary = buildQuizPlaybackSummary(sessions, quizId, viewerRole);

      if (!summary) {
        return;
      }

      const syncKey = `${viewerRole}:${quizId}`;
      const signature = JSON.stringify(summary);
      nextSyncedPracticeSummaries[syncKey] = signature;

      if (syncedPracticeSummaryRef.current[syncKey] === signature) {
        return;
      }

      syncQuizPracticeStateRef.current(quizId, summary);
    });

    syncedPracticeSummaryRef.current = nextSyncedPracticeSummaries;
  }, [isHydrated, remoteCompletedAttempts, sessions]);

  useEffect(() => {
    if (
      !isHydrated ||
      !isSharedAssignedHydrated ||
      role !== "student" ||
      currentUser?.role !== "student"
    ) {
      return;
    }

    const mirroredSessions = sessions
      .filter(
        (session) =>
          session.viewerRole === "student" &&
          Boolean(session.assignmentContext),
      )
      .map((session) => {
        const assignmentContext = session.assignmentContext;

        if (!assignmentContext) {
          return null;
        }

        return {
          id: session.id,
          quizId: session.quizId,
          assignmentId: assignmentContext.assignmentId,
          classId: assignmentContext.classId,
          className: assignmentContext.className,
          student: {
            id: currentUser.id,
            fullName: currentUser.fullName,
            email: currentUser.email,
          },
          session,
        } satisfies SharedAssignedQuizSessionRecord;
      })
      .filter(
        (session): session is SharedAssignedQuizSessionRecord =>
          session !== null,
      );

    setSharedAssignedSessions((current) => {
      const nextBySessionId = new Map<
        string,
        SharedAssignedQuizSessionRecord
      >();

      current
        .filter(
          (entry) =>
            entry.student.id !== currentUser.id &&
            entry.student.email.trim().toLowerCase() !==
              currentUser.email.trim().toLowerCase(),
        )
        .forEach((entry) => {
          nextBySessionId.set(entry.id, entry);
        });

      mirroredSessions.forEach((entry) => {
        nextBySessionId.set(entry.id, entry);
      });

      return sortSharedAssignedQuizSessions(
        Array.from(nextBySessionId.values()),
      );
    });
  }, [
    currentUser?.email,
    currentUser?.fullName,
    currentUser?.id,
    currentUser?.role,
    isHydrated,
    isSharedAssignedHydrated,
    role,
    sessions,
  ]);

  const value = useMemo<QuizSessionContextValue>(
    () => ({
      sessions,
      sharedAssignedSessions,
      isHydrated,
      getSessionById: (sessionId) =>
        sessions.find((session) => session.id === sessionId),
      getLatestInProgressSession: (quizId, viewerRole, assignmentId) =>
        getLatestQuizSession(sessions, {
          quizId,
          viewerRole,
          assignmentId,
          status: "in-progress",
        }),
      getLatestCompletedSession: (quizId, viewerRole, assignmentId) =>
        getLatestQuizSession(sessions, {
          quizId,
          viewerRole,
          assignmentId,
          status: "completed",
        }),
      getCompletedSessionsForRole: (viewerRole) =>
        sortQuizSessionsByUpdatedAt(
          sessions.filter(
            (session) =>
              session.viewerRole === viewerRole &&
              session.status === "completed",
          ),
        ),
      createSession: async (quiz, context) => {
        // Primary guard: check React state (fast path, works after hydration)
        const existingSession = getLatestQuizSession(sessions, {
          quizId: quiz.id,
          viewerRole: context.viewerRole,
          assignmentId: context.assignmentContext?.assignmentId,
          status: "in-progress",
        });

        if (existingSession) {
          return existingSession;
        }

        // Secondary guard: read localStorage directly in case React state hasn't
        // hydrated yet (race condition on page refresh). Prevents a second
        // startAttempt() call when the session is still in storage but not yet
        // reflected in the sessions array.
        try {
          const rawStored = getScopedStorageValue(
            QUIZ_SESSIONS_STORAGE_KEY,
            getUserStorageScope({
              userId: currentUser?.id ?? null,
              email: currentUser?.email ?? null,
              role,
              token,
            }),
          );
          if (rawStored) {
            const parsed = JSON.parse(rawStored) as Partial<QuizSessionRecord>[];
            if (Array.isArray(parsed)) {
              const storedInProgress = parsed.find(
                (s) =>
                  s.status === "in-progress" &&
                  s.quizId === quiz.id &&
                  s.viewerRole === context.viewerRole &&
                  s.assignmentContext?.assignmentId ===
                    context.assignmentContext?.assignmentId,
              );
              if (storedInProgress) {
                const sanitized = sanitizeQuizSessionRecord(storedInProgress);
                if (sanitized) {
                  // Re-hydrate into React state and return without creating a new attempt
                  setSessions((current) => {
                    const alreadyPresent = current.some((s) => s.id === sanitized.id);
                    return alreadyPresent
                      ? current
                      : sortQuizSessionsByUpdatedAt([sanitized, ...current]);
                  });
                  return sanitized;
                }
              }
            }
          }
        } catch {
          // localStorage read failure is non-fatal — continue with normal creation
        }

        let nextQuiz = quiz;
        let attemptNumber =
          countSessionAttempts(
            sessions,
            quiz.id,
            context.viewerRole,
            context.assignmentContext?.assignmentId,
          ) + 1;
        let syncMode: QuizSessionRecord["syncMode"] = "local";
        let backendAttemptId: string | undefined;

        if (isGuidString(quiz.id)) {
          try {
            const quizAttempts = await getAttemptsByQuiz(quiz.id);
            const startedAttempt = await startAttempt(quiz.id);

            attemptNumber = quizAttempts.length + 1;
            syncMode = "backend";
            backendAttemptId = startedAttempt.attemptId;
            nextQuiz = mergeQuizWithStartedAttempt(quiz, startedAttempt);
          } catch (error) {
            throw new Error(
              getRequestErrorMessage(error, "Unable to start quiz attempt."),
            );
          }
        }

        const nextSession = createQuizSessionRecord(quiz, context, {
          attemptNumber,
          syncMode,
          backendAttemptId,
          quizOverride: nextQuiz,
        });

        setSessions((current) => [
          nextSession,
          ...current.filter(
            (session) =>
              !(
                session.status === "in-progress" &&
                session.quizId === quiz.id &&
                session.viewerRole === context.viewerRole &&
                session.assignmentContext?.assignmentId ===
                  context.assignmentContext?.assignmentId
              ),
          ),
        ]);

        return nextSession;
      },
      selectAnswer: (sessionId, questionId, selectedIndex) => {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const questionState = getQuestionState(session, questionId);

            if (!questionState || questionState.submitted) {
              return session;
            }

            return {
              ...session,
              updatedAt: new Date().toISOString(),
              questionStates: session.questionStates.map((candidate) =>
                candidate.questionId === questionId
                  ? (() => {
                      const question = session.quiz.questions.find(
                        (item) => item.id === questionId,
                      );

                      if (question?.selectionMode === "multiple") {
                        const alreadySelected =
                          candidate.selectedIndices.includes(selectedIndex);
                        const selectedIndices = alreadySelected
                          ? candidate.selectedIndices.filter(
                              (item) => item !== selectedIndex,
                            )
                          : [...candidate.selectedIndices, selectedIndex].sort(
                              (left, right) => left - right,
                            );

                        return {
                          ...candidate,
                          selectedIndices,
                          selectedIndex: selectedIndices[0] ?? null,
                        };
                      }

                      return {
                        ...candidate,
                        selectedIndex,
                        selectedIndices: [selectedIndex],
                      };
                    })()
                  : candidate,
              ),
            };
          }),
        );
      },
      submitAnswer: (sessionId, questionId) => {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const question = session.quiz.questions.find(
              (candidate) => candidate.id === questionId,
            );
            const questionState = getQuestionState(session, questionId);

            if (
              !question ||
              !questionState ||
              questionState.submitted ||
              (questionState.selectedIndices.length === 0 &&
                question.required !== false)
            ) {
              return session;
            }

            const correctIndexes =
              question.selectionMode === "multiple"
                ? question.correctIndexes?.length
                  ? [...question.correctIndexes].sort(
                      (left, right) => left - right,
                    )
                  : [question.correctIndex]
                : [question.correctIndex];
            const selectedIndexes =
              question.selectionMode === "multiple"
                ? [...questionState.selectedIndices].sort(
                    (left, right) => left - right,
                  )
                : [
                    questionState.selectedIndex ??
                      questionState.selectedIndices[0] ??
                      -1,
                  ];
            const isCorrect =
              selectedIndexes.length === correctIndexes.length &&
              selectedIndexes.every(
                (index, indexPosition) =>
                  index === correctIndexes[indexPosition],
              );
            const awardedPoints = isCorrect
              ? Math.max(1, Math.round(question.points ?? 1))
              : 0;

            return {
              ...session,
              updatedAt: new Date().toISOString(),
              correctCount: session.correctCount + (isCorrect ? 1 : 0),
              earnedPoints: session.earnedPoints + awardedPoints,
              questionStates: session.questionStates.map((candidate) =>
                candidate.questionId === questionId
                  ? {
                      ...candidate,
                      submitted: true,
                      submittedAt: new Date().toISOString(),
                      isCorrect,
                    }
                  : candidate,
              ),
            };
          }),
        );
      },
      setCurrentQuestion: (sessionId, questionIndex) => {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const boundedIndex = Math.min(
              Math.max(questionIndex, 0),
              Math.max(session.quiz.questions.length - 1, 0),
            );

            if (boundedIndex === session.currentQuestionIndex) {
              return session;
            }

            return {
              ...session,
              updatedAt: new Date().toISOString(),
              currentQuestionIndex: boundedIndex,
            };
          }),
        );
      },
      goToNextQuestion: (sessionId) => {
        setSessions((current) =>
          current.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            if (
              session.currentQuestionIndex >=
              session.quiz.questions.length - 1
            ) {
              return session;
            }

            return {
              ...session,
              updatedAt: new Date().toISOString(),
              currentQuestionIndex: session.currentQuestionIndex + 1,
            };
          }),
        );
      },
      completeSession: async (sessionId, options) => {
        const targetSession = sessions.find(
          (session) => session.id === sessionId,
        );

        if (!targetSession || targetSession.status === "completed") {
          return;
        }

        const timestamp = options?.finishedAt ?? new Date().toISOString();

        if (
          targetSession.syncMode === "backend" &&
          options?.completionReason !== "deadline-expired"
        ) {
          if (!canSubmitSessionToBackend(targetSession)) {
            throw new Error(
              "This quiz uses answer settings that the backend attempt API does not support yet.",
            );
          }

          try {
            const result = await submitAttempt(
              targetSession.backendAttemptId!,
              buildSubmitAttemptPayload(targetSession),
            );

            setSessions((current) =>
              sortQuizSessionsByUpdatedAt(
                current.map((session) =>
                  session.id === sessionId
                    ? applyBackendAttemptResult(session, result, timestamp)
                    : session,
                ),
              ),
            );
            setAttemptRefreshKey((current) => current + 1);
            return;
          } catch (error) {
            throw new Error(
              getRequestErrorMessage(error, "Unable to submit quiz attempt."),
            );
          }
        }

        setSessions((current) =>
          sortQuizSessionsByUpdatedAt(
            current.map((session) => {
              if (session.id !== sessionId || session.status === "completed") {
                return session;
              }

              return {
                ...session,
                status: "completed",
                updatedAt: timestamp,
                finishedAt: timestamp,
                completionReason: options?.completionReason ?? "submitted",
              };
            }),
          ),
        );
      },
    }),
    [sessions, sharedAssignedSessions, isHydrated],
  );

  return (
    <QuizSessionContext.Provider value={value}>
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSessions() {
  const context = useContext(QuizSessionContext);

  if (!context) {
    throw new Error("useQuizSessions must be used within QuizSessionProvider.");
  }

  return context;
}
