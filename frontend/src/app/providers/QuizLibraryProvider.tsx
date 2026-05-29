import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  QuizLibraryItem,
  QuizLibraryStatus,
  QuizQuestionRecord,
  QuizRecord,
} from "../../features/dashboard/components/quiz-library/quizLibraryTypes";
import { isGuidString } from "../../lib/apiClient";
import {
  createQuiz as createQuizRequest,
  deleteQuiz as deleteQuizRequest,
  getMyQuizzes,
  getQuizById as getQuizByIdRequest,
  updateQuiz as updateQuizRequest,
} from "../../features/dashboard/api/quizzesApi";
import { mapQuizDtoToQuizRecord } from "../../features/dashboard/api/quizzesAdapters";
import { useAuth } from "./AuthProvider";
import { useTeacherClasses } from "./TeacherClassesProvider";
import {
  getScopedStorageValue,
  getUserScopedStorageKey,
  getUserStorageScope,
} from "./userScopedStorage";

const QUIZ_LIBRARY_STORAGE_KEY = "bilgenly_quiz_library";

interface SaveGeneratedQuizInput {
  existingQuizId?: string;
  ownerRole: "teacher" | "student";
  title: string;
  description: string;
  topic: string;
  difficulty: QuizRecord["difficulty"];
  language: string;
  status: QuizLibraryStatus;
  tags: string[];
  sourceLabel: string;
  note?: string;
  questionCount: number;
  durationMinutes: number;
  questions: QuizQuestionRecord[];
  practiceState?: QuizRecord["practiceState"];
}

interface QuizLibraryContextValue {
  quizzes: QuizRecord[];
  isLoading: boolean;
  saveGeneratedQuiz: (input: SaveGeneratedQuizInput) => Promise<QuizRecord>;
  ensureQuizHasBackendId: (quizId: string) => Promise<string>;
  getQuizById: (quizId: string) => QuizRecord | undefined;
  syncQuizPracticeState: (
    quizId: string,
    updates: Partial<
      Pick<
        QuizRecord,
        | "practiceState"
        | "practiceProgressLabel"
        | "attemptCount"
        | "averageScore"
      >
    >,
  ) => void;
  deleteQuiz: (
    quizId: string,
    viewerRole: "teacher" | "student",
  ) => Promise<void>;
  duplicateQuizToLibrary: (
    quizId: string,
    viewerRole: "teacher" | "student",
  ) => QuizRecord | null;
}

const QuizLibraryContext = createContext<QuizLibraryContextValue | undefined>(
  undefined,
);

interface QuizLibraryProviderProps {
  children: ReactNode;
}

function formatQuizDate(date: Date) {
  return date.toISOString();
}

function getOwnerName(
  role: "teacher" | "student",
  currentUserName?: string | null,
) {
  if (currentUserName?.trim()) {
    return currentUserName.trim();
  }

  return role === "teacher" ? "Unknown teacher" : "You";
}

function normalizeTags(tags: string[]) {
  const seen = new Set<string>();

  return tags.filter((tag) => {
    const normalized = tag.trim().toLowerCase();

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

const QUESTION_TYPE_TAGS = new Set(["Multiple choice", "True/False"]);

function sanitizeQuizRecord(quiz: QuizRecord): QuizRecord {
  // When the quiz has questions loaded, re-derive which question-type tags are
  // actually valid. This fixes quizzes saved before the tag logic was corrected
  // (they had both "Multiple choice" AND "True/False" regardless of content).
  const actualTypes =
    quiz.questions.length > 0
      ? new Set(quiz.questions.map((q) => q.questionType ?? "Multiple choice"))
      : null;

  const cleanedTags = normalizeTags(
    (quiz.tags ?? []).filter((tag) => {
      if (QUESTION_TYPE_TAGS.has(tag)) {
        // Keep only if this type actually appears in the quiz questions
        return !actualTypes || actualTypes.has(tag as "Multiple choice" | "True/False");
      }
      return true;
    }),
  );

  // Normalize legacy public/published-public quizzes back to private —
  // public discovery has been removed until backend-backed support exists,
  // so any old state must not resurface in the UI.
  const normalizedVisibility = "private" as const;
  const normalizedStatus =
    quiz.status === "published-public" ? "published-private" : quiz.status;

  return {
    ...quiz,
    visibility: normalizedVisibility,
    status: normalizedStatus,
    // savedByRoles is a defunct local-only field — clear it so stale data
    // never re-creates a phantom "saved" badge on someone else's quiz.
    savedByRoles: undefined,
    tags: cleanedTags,
    questions: quiz.questions.map((question) => ({
      ...question,
      options: [...question.options],
      optionIds: question.optionIds ? [...question.optionIds] : undefined,
      correctIndexes: question.correctIndexes
        ? [...question.correctIndexes]
        : undefined,
    })),
  };
}

function toCreateQuizQuestionType(question: QuizQuestionRecord) {
  if (question.questionType === "True/False") {
    return "TrueFalse";
  }

  return "MCQ";
}

function getCorrectAnswerIndexes(question: QuizQuestionRecord) {
  if (
    question.selectionMode === "multiple" &&
    question.correctIndexes?.length
  ) {
    return question.correctIndexes;
  }

  return [question.correctIndex];
}


function mapQuizRecordToCreateQuizRequest(quiz: QuizRecord) {
  return {
    title: quiz.title,
    description: quiz.description,
    // Public visibility is removed from the UI until backend-backed discovery
    // exists. Always persist created quizzes as private.
    isPublic: false,
    questions: quiz.questions.map((question, index) => {
      const correctIndexes = getCorrectAnswerIndexes(question);

      return {
        text: question.text,
        questionType: toCreateQuizQuestionType(question),
        explanation: question.explanation ?? "",
        position: index + 1,
        points: Math.max(1, Math.round(question.points ?? 1)),
        estimatedMinutes: Math.max(
          1,
          Math.round(question.estimatedMinutes ?? 1),
        ),
        imageUrl: question.imageUrl,
        answers: question.options.map((option, optionIndex) => ({
          text: option,
          isCorrect: correctIndexes.includes(optionIndex),
        })),
      };
    }),
  };
}

function mapQuizRecordToUpdateQuizRequest(quiz: QuizRecord) {
  return {
    title: quiz.title,
    description: quiz.description,
    // Public visibility is removed from the UI until backend-backed discovery
    // exists. Always persist updates as private — this also normalises any
    // legacy quizzes a user previously marked public.
    isPublic: false,
    questions: quiz.questions.map((question, index) => {
      const correctIndexes = getCorrectAnswerIndexes(question);

      return {
        id: isGuidString(question.id) ? question.id : undefined,
        text: question.text,
        questionType: toCreateQuizQuestionType(question),
        explanation: question.explanation ?? "",
        position: index + 1,
        points: Math.max(1, Math.round(question.points ?? 1)),
        estimatedMinutes: Math.max(
          1,
          Math.round(question.estimatedMinutes ?? 1),
        ),
        imageUrl: question.imageUrl,
        answers: question.options.map((option, optionIndex) => {
          const optionId = question.optionIds?.[optionIndex];

          return {
            id: optionId && isGuidString(optionId) ? optionId : undefined,
            text: option,
            isCorrect: correctIndexes.includes(optionIndex),
          };
        }),
      };
    }),
  };
}

function loadQuizLibraryFromStorage(scope: string) {
  const mergedByQuizId = new Map<string, QuizRecord>();
  const legacyScopedKeys: string[] = [];
  const mergeQuizRecords = (records: QuizRecord[]) => {
    records.forEach((quiz) => {
      if (typeof quiz?.id !== "string" || !quiz.id) {
        return;
      }

      const candidateQuiz = sanitizeQuizRecord(quiz);
      const existingQuiz = mergedByQuizId.get(candidateQuiz.id);

      if (!existingQuiz) {
        mergedByQuizId.set(candidateQuiz.id, candidateQuiz);
        return;
      }

      const existingUpdatedAt = new Date(existingQuiz.updatedAt).getTime();
      const candidateUpdatedAt = new Date(candidateQuiz.updatedAt).getTime();

      if (
        Number.isNaN(existingUpdatedAt) ||
        candidateUpdatedAt >= existingUpdatedAt
      ) {
        mergedByQuizId.set(candidateQuiz.id, candidateQuiz);
      }
    });
  };

  const sharedValue = getScopedStorageValue(QUIZ_LIBRARY_STORAGE_KEY, scope);

  if (sharedValue) {
    try {
      const parsed = JSON.parse(sharedValue) as QuizRecord[];

      if (Array.isArray(parsed)) {
        mergeQuizRecords(parsed);
      }
    } catch {
      localStorage.removeItem(QUIZ_LIBRARY_STORAGE_KEY);
    }
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);

    if (!storageKey || !storageKey.startsWith(`${QUIZ_LIBRARY_STORAGE_KEY}:`)) {
      continue;
    }

    legacyScopedKeys.push(storageKey);

    const scopedValue = localStorage.getItem(storageKey);

    if (!scopedValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(scopedValue) as QuizRecord[];

      if (Array.isArray(parsed)) {
        mergeQuizRecords(parsed);
      }
    } catch {
      continue;
    }
  }

  if (!mergedByQuizId.size) {
    return [];
  }

  const merged = Array.from(mergedByQuizId.values());
  localStorage.setItem(QUIZ_LIBRARY_STORAGE_KEY, JSON.stringify(merged));
  legacyScopedKeys.forEach((storageKey) => localStorage.removeItem(storageKey));
  return merged;
}

function mergeRemoteQuizWithLocalMetadata(
  remoteQuiz: QuizRecord,
  localQuiz?: QuizRecord,
) {
  if (!localQuiz) {
    return remoteQuiz;
  }

  return {
    ...remoteQuiz,
    title: localQuiz.title || remoteQuiz.title,
    description: localQuiz.description ?? remoteQuiz.description,
    ownerName: localQuiz.ownerName || remoteQuiz.ownerName,
    sourceQuizId: localQuiz.sourceQuizId,
    topic: localQuiz.topic || remoteQuiz.topic,
    difficulty: localQuiz.difficulty || remoteQuiz.difficulty,
    language: localQuiz.language || remoteQuiz.language,
    durationMinutes: localQuiz.durationMinutes || remoteQuiz.durationMinutes,
    updatedAt: localQuiz.updatedAt || remoteQuiz.updatedAt,
    status: localQuiz.status || remoteQuiz.status,
    visibility: localQuiz.visibility || remoteQuiz.visibility,
    tags: normalizeTags(
      localQuiz.tags?.length ? localQuiz.tags : remoteQuiz.tags,
    ),
    sourceLabel: localQuiz.sourceLabel || remoteQuiz.sourceLabel,
    note: localQuiz.note ?? remoteQuiz.note,
    practiceState: localQuiz.practiceState,
    practiceProgressLabel: localQuiz.practiceProgressLabel,
    learnerCount: localQuiz.learnerCount,
    averageScore: localQuiz.averageScore,
    saveCount: localQuiz.saveCount,
    attemptCount: localQuiz.attemptCount,
  } satisfies QuizRecord;
}

function upsertQuizRecord(current: QuizRecord[], quiz: QuizRecord) {
  const nextQuiz = sanitizeQuizRecord(quiz);
  const existingIndex = current.findIndex((item) => item.id === quiz.id);

  if (existingIndex === -1) {
    return [nextQuiz, ...current];
  }

  const existingQuiz = current[existingIndex];
  if (JSON.stringify(existingQuiz) === JSON.stringify(nextQuiz)) {
    return current;
  }

  const next = [...current];
  next[existingIndex] = nextQuiz;
  return next;
}

function getAssignedQuizDetailsSignature(quiz: QuizRecord) {
  return JSON.stringify({
    title: quiz.title.trim(),
    topic: quiz.topic.trim(),
    questionCount: quiz.questions.length || quiz.questionCount,
  });
}

function areQuizRecordArraysEqual(left: QuizRecord[], right: QuizRecord[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (quiz, index) => JSON.stringify(quiz) === JSON.stringify(right[index]),
  );
}

export function mapQuizRecordToLibraryItem(
  quiz: QuizRecord,
  viewerRole: "teacher" | "student",
  currentUserId?: string | null,
): QuizLibraryItem {
  const isOwner = currentUserId
    ? quiz.ownerUserId
      ? quiz.ownerUserId === currentUserId
      : quiz.ownerRole === viewerRole
    : quiz.ownerRole === viewerRole;

  return {
    id: quiz.id,
    ownerUserId: quiz.ownerUserId,
    title: quiz.title,
    description: quiz.description,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    language: quiz.language,
    creatorName:
      viewerRole === "student" && quiz.ownerRole === "student"
        ? "You"
        : quiz.ownerName,
    questionCount: quiz.questionCount,
    durationMinutes: quiz.durationMinutes,
    updatedAt: quiz.updatedAt,
    status: quiz.status,
    visibility: quiz.visibility,
    tags: normalizeTags(quiz.tags),
    sourceLabel: quiz.sourceLabel,
    note: quiz.note,
    isOwner,
    // Cross-user "saved" was a localStorage gimmick that depended on
    // discovering other users' quizzes — removed alongside Discover.
    isSaved: false,
    isGeneratedByCurrentUser: viewerRole === "student" && isOwner,
    learnerCount: quiz.learnerCount,
    averageScore: quiz.averageScore,
    saveCount: quiz.saveCount,
    attemptCount: quiz.attemptCount,
    practiceState: quiz.practiceState,
    practiceProgressLabel: quiz.practiceProgressLabel,
  };
}

export function getQuizLibraryItemsForRole(
  quizzes: QuizRecord[],
  viewerRole: "teacher" | "student",
  currentUserId?: string | null,
) {
  // Each user only sees the quizzes they own. Cross-user "public" discovery
  // is intentionally removed until backend-backed discovery exists. Assigned
  // quizzes are pulled separately by the student library sources.
  return quizzes
    .filter((quiz) => quiz.ownerRole === viewerRole)
    .map((quiz) => mapQuizRecordToLibraryItem(quiz, viewerRole, currentUserId));
}

export function QuizLibraryProvider({ children }: QuizLibraryProviderProps) {
  const { currentUser, role, token } = useAuth();
  const { classes, syncAssignedQuizDetails } = useTeacherClasses();
  const [localQuizzes, setLocalQuizzes] = useState<QuizRecord[]>([]);
  const [remoteOwnedQuizzes, setRemoteOwnedQuizzes] = useState<QuizRecord[]>(
    [],
  );
  const [remoteReferencedQuizzes, setRemoteReferencedQuizzes] = useState<
    QuizRecord[]
  >([]);
  const [hiddenQuizIds, setHiddenQuizIds] = useState<string[]>([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(true);
  // Bumping this tick re-runs the remote fetch effect. Used to refetch
  // when the tab regains focus and when other parts of the app broadcast
  // `bilgenly:quiz-deleted` (e.g. the admin panel removing a quiz).
  const [refetchTick, setRefetchTick] = useState(0);
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
    () => getUserScopedStorageKey(QUIZ_LIBRARY_STORAGE_KEY, storageScope),
    [storageScope],
  );
  const syncAssignedQuizDetailsRef = useRef(syncAssignedQuizDetails);
  const syncedAssignmentQuizDetailsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    syncAssignedQuizDetailsRef.current = syncAssignedQuizDetails;
  }, [syncAssignedQuizDetails]);

  const storageScopeRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load when scope actually changes to prevent loops
    if (storageScopeRef.current === storageScope) {
      return;
    }
    storageScopeRef.current = storageScope;

    setLocalQuizzes(loadQuizLibraryFromStorage(storageScope));
    setHiddenQuizIds([]);
  }, [storageScope]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(localQuizzes));
  }, [localQuizzes, storageKey]);

  useEffect(() => {
    if (!token || (role !== "teacher" && role !== "student") || !currentUser?.id) {
      setRemoteOwnedQuizzes((current) => (current.length ? [] : current));
      setIsRemoteLoading(false);
      return;
    }

    setIsRemoteLoading(true);
    let isCancelled = false;

    getMyQuizzes()
      .then((quizzes) => {
        if (isCancelled) {
          return;
        }

        const ownerRole = (role === "student" ? "student" : "teacher") as "student" | "teacher";
        const nextRemoteOwnedQuizzes = quizzes.map((quiz) =>
          mapQuizDtoToQuizRecord(quiz, {
            ownerUserId: currentUser.id,
            ownerRole,
            ownerName: currentUser.fullName,
          }),
        );

        setRemoteOwnedQuizzes((current) =>
          areQuizRecordArraysEqual(current, nextRemoteOwnedQuizzes)
            ? current
            : nextRemoteOwnedQuizzes,
        );

        // Purge any stale local copies whose backend GUID didn't come back
        // in the fresh remote list. This handles the "admin deleted my quiz
        // out from under me" case: without this, the deleted quiz would
        // resurrect from localStorage on every refresh.
        const remoteIds = new Set(nextRemoteOwnedQuizzes.map((q) => q.id));
        setLocalQuizzes((current) => {
          const cleaned = current.filter(
            (quiz) => !isGuidString(quiz.id) || remoteIds.has(quiz.id),
          );
          return cleaned.length === current.length ? current : cleaned;
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setRemoteOwnedQuizzes((current) => (current.length ? [] : current));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsRemoteLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.fullName, currentUser?.id, role, token, refetchTick]);

  // Refetch the library whenever the tab comes back into focus, or when an
  // admin action elsewhere in the app dispatches `bilgenly:quiz-deleted`.
  // Together these are what make a quiz disappear "live" in the regular
  // library view without a hard reload — the admin panel updates its own
  // table optimistically; the rest of the app catches up via this hook.
  useEffect(() => {
    function bump() {
      setRefetchTick((tick) => tick + 1);
    }
    function onVisibility() {
      if (document.visibilityState === "visible") bump();
    }
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("bilgenly:quiz-deleted", bump as EventListener);
    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("bilgenly:quiz-deleted", bump as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setRemoteReferencedQuizzes((current) => (current.length ? [] : current));
      return;
    }

    const referencedQuizIds = Array.from(
      new Set(
        classes
          .flatMap((teacherClass) =>
            teacherClass.assignedQuizzes.map((assignment) => assignment.quizId),
          )
          .filter((quizId) => isGuidString(quizId)),
      ),
    );

    if (!referencedQuizIds.length) {
      setRemoteReferencedQuizzes((current) => (current.length ? [] : current));
      return;
    }

    const existingIds = new Set([
      ...remoteOwnedQuizzes.map((quiz) => quiz.id),
      ...remoteReferencedQuizzes.map((quiz) => quiz.id),
    ]);
    const missingIds = referencedQuizIds.filter(
      (quizId) => !existingIds.has(quizId),
    );

    if (!missingIds.length) {
      return;
    }

    let isCancelled = false;

    Promise.all(
      missingIds.map(async (quizId) => {
        const dto = await getQuizByIdRequest(quizId);
        const assignment =
          classes
            .flatMap((teacherClass) =>
              teacherClass.assignedQuizzes.map((item) => ({
                teacherClass,
                assignment: item,
              })),
            )
            .find((item) => item.assignment.quizId === quizId) ?? null;

        return mapQuizDtoToQuizRecord(dto, {
          ownerRole: "teacher",
          topic: assignment?.assignment.topic,
          sourceLabel: assignment
            ? `Assigned in ${assignment.teacherClass.name}`
            : "Fetched from backend",
        });
      }),
    )
      .then((fetchedQuizzes) => {
        if (isCancelled) {
          return;
        }

        setRemoteReferencedQuizzes((current) => {
          const next = [...current];
          let hasChanges = false;

          fetchedQuizzes.forEach((quiz) => {
            if (next.some((item) => item.id === quiz.id)) {
              return;
            }

            next.push(quiz);
            hasChanges = true;
          });

          return hasChanges ? next : current;
        });
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [classes, remoteOwnedQuizzes, remoteReferencedQuizzes, token]);

  const quizzes = useMemo(() => {
    const localById = new Map(localQuizzes.map((quiz) => [quiz.id, quiz]));
    const remoteById = new Map<string, QuizRecord>();

    [...remoteOwnedQuizzes, ...remoteReferencedQuizzes].forEach((quiz) => {
      remoteById.set(
        quiz.id,
        mergeRemoteQuizWithLocalMetadata(quiz, localById.get(quiz.id)),
      );
    });

    // Compute unique joined-student counts per quiz from assigned classes
    const learnersByQuizId = new Map<string, Set<string>>();
    for (const teacherClass of classes) {
      const joinedStudentIds = teacherClass.students
        .filter((s) => s.status === "joined")
        .map((s) => s.id);
      for (const assignment of teacherClass.assignedQuizzes) {
        if (!learnersByQuizId.has(assignment.quizId)) {
          learnersByQuizId.set(assignment.quizId, new Set());
        }
        for (const studentId of joinedStudentIds) {
          learnersByQuizId.get(assignment.quizId)!.add(studentId);
        }
      }
    }

    // Merge rule:
    //   • Remote quizzes always show (they're the source of truth).
    //   • Local quizzes that have a non-GUID id (= local-only drafts that
    //     were never synced) always show too.
    //   • Local quizzes that have a GUID id but are NOT in remote are
    //     stale zombies — the backend deleted them (admin removal, owner
    //     delete elsewhere, etc.). Drop them so a deleted quiz doesn't
    //     keep haunting the library from localStorage cache.
    //   While remote is still loading, keep showing local copies so the UI
    //   doesn't blank out between hydration and the network response.
    const combined = [
      ...Array.from(remoteById.values()),
      ...localQuizzes.filter((quiz) => {
        if (remoteById.has(quiz.id)) return false;
        if (isRemoteLoading) return true;
        return !isGuidString(quiz.id);
      }),
    ].filter((quiz) => !hiddenQuizIds.includes(quiz.id));

    return combined.map((quiz) => {
      const sanitized = sanitizeQuizRecord(quiz);
      const count = learnersByQuizId.get(quiz.id)?.size;
      return count !== undefined ? { ...sanitized, learnerCount: count } : sanitized;
    });
  }, [
    classes,
    hiddenQuizIds,
    isRemoteLoading,
    localQuizzes,
    remoteOwnedQuizzes,
    remoteReferencedQuizzes,
  ]);

  useEffect(() => {
    const assignedQuizIds = new Set(
      classes.flatMap((teacherClass) =>
        teacherClass.assignedQuizzes.map((assignment) => assignment.quizId),
      ),
    );

    const nextSyncedSignatures: Record<string, string> = {};

    quizzes.forEach((quiz) => {
      if (!assignedQuizIds.has(quiz.id)) {
        return;
      }

      const signature = getAssignedQuizDetailsSignature(quiz);
      nextSyncedSignatures[quiz.id] = signature;

      if (syncedAssignmentQuizDetailsRef.current[quiz.id] === signature) {
        return;
      }

      syncAssignedQuizDetailsRef.current(quiz.id, {
        title: quiz.title,
        topic: quiz.topic,
        questionCount: quiz.questions.length || quiz.questionCount,
      });
    });

    syncedAssignmentQuizDetailsRef.current = nextSyncedSignatures;
  }, [classes, quizzes]);

  const upsertLocalQuiz = (quiz: QuizRecord) => {
    setLocalQuizzes((current) => upsertQuizRecord(current, quiz));
  };

  const createTeacherQuizOnBackend = async (quiz: QuizRecord) => {
    const createdQuiz = await createQuizRequest(
      mapQuizRecordToCreateQuizRequest(quiz),
    );

    const mappedQuiz = mapQuizDtoToQuizRecord(createdQuiz, {
      ownerUserId: currentUser?.id,
      ownerRole: "teacher",
      ownerName: getOwnerName("teacher", currentUser?.fullName),
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      language: quiz.language,
      status: quiz.status,
      visibility: quiz.visibility,
      tags: quiz.tags,
      sourceLabel: quiz.sourceLabel,
      note: quiz.note,
      durationMinutes: quiz.durationMinutes,
    });

    setRemoteOwnedQuizzes((current) => upsertQuizRecord(current, mappedQuiz));
    upsertLocalQuiz({
      ...mappedQuiz,
      practiceState: quiz.practiceState,
      practiceProgressLabel: quiz.practiceProgressLabel,
      averageScore: quiz.averageScore,
      attemptCount: quiz.attemptCount,
    });

    return mappedQuiz;
  };

  const updateTeacherQuizOnBackend = async (quiz: QuizRecord) => {
    const updatedQuiz = await updateQuizRequest(
      quiz.id,
      mapQuizRecordToUpdateQuizRequest(quiz),
    );

    const mappedQuiz = mapQuizDtoToQuizRecord(updatedQuiz, {
      ownerUserId: currentUser?.id,
      ownerRole: "teacher",
      ownerName: getOwnerName("teacher", currentUser?.fullName),
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      language: quiz.language,
      status: quiz.status,
      visibility: quiz.visibility,
      tags: quiz.tags,
      sourceLabel: quiz.sourceLabel,
      note: quiz.note,
      durationMinutes: quiz.durationMinutes,
      updatedAt: formatQuizDate(new Date()),
    });

    setRemoteOwnedQuizzes((current) => upsertQuizRecord(current, mappedQuiz));
    upsertLocalQuiz({
      ...mappedQuiz,
      practiceState: quiz.practiceState,
      practiceProgressLabel: quiz.practiceProgressLabel,
      averageScore: quiz.averageScore,
      attemptCount: quiz.attemptCount,
    });

    return mappedQuiz;
  };

  const createStudentQuizOnBackend = async (quiz: QuizRecord) => {
    const createdQuiz = await createQuizRequest(
      mapQuizRecordToCreateQuizRequest(quiz),
    );

    const mappedQuiz = mapQuizDtoToQuizRecord(createdQuiz, {
      ownerUserId: currentUser?.id,
      ownerRole: "student",
      ownerName: getOwnerName("student", currentUser?.fullName),
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      language: quiz.language,
      status: quiz.status,
      visibility: quiz.visibility,
      tags: quiz.tags,
      sourceLabel: quiz.sourceLabel,
      note: quiz.note,
      durationMinutes: quiz.durationMinutes,
    });

    setRemoteOwnedQuizzes((current) => upsertQuizRecord(current, mappedQuiz));
    upsertLocalQuiz({
      ...mappedQuiz,
      practiceState: quiz.practiceState,
      practiceProgressLabel: quiz.practiceProgressLabel,
      averageScore: quiz.averageScore,
      attemptCount: quiz.attemptCount,
    });

    return mappedQuiz;
  };

  const updateStudentQuizOnBackend = async (quiz: QuizRecord) => {
    const updatedQuiz = await updateQuizRequest(
      quiz.id,
      mapQuizRecordToUpdateQuizRequest(quiz),
    );

    const mappedQuiz = mapQuizDtoToQuizRecord(updatedQuiz, {
      ownerUserId: currentUser?.id,
      ownerRole: "student",
      ownerName: getOwnerName("student", currentUser?.fullName),
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      language: quiz.language,
      status: quiz.status,
      visibility: quiz.visibility,
      tags: quiz.tags,
      sourceLabel: quiz.sourceLabel,
      note: quiz.note,
      durationMinutes: quiz.durationMinutes,
      updatedAt: formatQuizDate(new Date()),
    });

    setRemoteOwnedQuizzes((current) => upsertQuizRecord(current, mappedQuiz));
    upsertLocalQuiz({
      ...mappedQuiz,
      practiceState: quiz.practiceState,
      practiceProgressLabel: quiz.practiceProgressLabel,
      averageScore: quiz.averageScore,
      attemptCount: quiz.attemptCount,
    });

    return mappedQuiz;
  };

  const value = useMemo<QuizLibraryContextValue>(
    () => ({
      quizzes,
      isLoading: isRemoteLoading,
      saveGeneratedQuiz: async (input) => {
        const now = new Date();
        const quiz: QuizRecord = {
          id:
            input.existingQuizId ??
            `quiz-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          ownerUserId: currentUser?.id,
          ownerRole: input.ownerRole,
          ownerName: getOwnerName(input.ownerRole, currentUser?.fullName),
          title: input.title.trim(),
          description: input.description.trim(),
          topic: input.topic.trim(),
          difficulty: input.difficulty,
          language: input.language,
          questionCount: input.questionCount,
          durationMinutes: input.durationMinutes,
          updatedAt: formatQuizDate(now),
          status: input.status,
          visibility: "private",
          tags: normalizeTags(input.tags),
          sourceLabel: input.sourceLabel,
          note: input.note,
          questions: input.questions,
          practiceState: input.practiceState,
        };

        if (input.ownerRole === "teacher") {
          return isGuidString(quiz.id)
            ? updateTeacherQuizOnBackend(quiz)
            : createTeacherQuizOnBackend(quiz);
        }

        if (input.ownerRole === "student") {
          return isGuidString(quiz.id)
            ? updateStudentQuizOnBackend(quiz)
            : createStudentQuizOnBackend(quiz);
        }

        upsertLocalQuiz(quiz);
        return quiz;
      },
      ensureQuizHasBackendId: async (quizId) => {
        if (isGuidString(quizId)) {
          return quizId;
        }

        const sourceQuiz = quizzes.find((quiz) => quiz.id === quizId);

        if (!sourceQuiz) {
          throw new Error("Unable to find that quiz in your library.");
        }

        if (
          sourceQuiz.ownerRole !== "teacher" ||
          (sourceQuiz.ownerUserId && sourceQuiz.ownerUserId !== currentUser?.id)
        ) {
          throw new Error("Only teacher quizzes can be assigned to classes.");
        }

        const createdQuiz = await createTeacherQuizOnBackend(sourceQuiz);
        return createdQuiz.id;
      },
      getQuizById: (quizId) => quizzes.find((quiz) => quiz.id === quizId),
      syncQuizPracticeState: (quizId, updates) => {
        const existingQuiz = quizzes.find((quiz) => quiz.id === quizId);
        const existingLocalQuiz = localQuizzes.find((quiz) => quiz.id === quizId);

        if (!existingQuiz) {
          return;
        }

        const nextPracticeState = updates.practiceState ?? existingQuiz.practiceState;
        const nextPracticeProgressLabel =
          updates.practiceProgressLabel ?? existingQuiz.practiceProgressLabel;
        const nextAttemptCount = updates.attemptCount ?? existingQuiz.attemptCount;
        const nextAverageScore = updates.averageScore ?? existingQuiz.averageScore;

        if (
          existingQuiz.practiceState === nextPracticeState &&
          existingQuiz.practiceProgressLabel === nextPracticeProgressLabel &&
          existingQuiz.attemptCount === nextAttemptCount &&
          existingQuiz.averageScore === nextAverageScore
        ) {
          return;
        }

        const sourceQuiz = existingLocalQuiz ?? existingQuiz;

        upsertLocalQuiz({
          ...sourceQuiz,
          practiceState: nextPracticeState,
          practiceProgressLabel: nextPracticeProgressLabel,
          attemptCount: nextAttemptCount,
          averageScore: nextAverageScore,
        });
      },
      deleteQuiz: async (quizId, viewerRole) => {
        const sourceQuiz = quizzes.find((quiz) => quiz.id === quizId);

        if (!sourceQuiz || sourceQuiz.ownerRole !== viewerRole) {
          return;
        }

        if (isGuidString(sourceQuiz.id) && (sourceQuiz.ownerRole === "teacher" || sourceQuiz.ownerRole === "student")) {
          await deleteQuizRequest(sourceQuiz.id);
          setRemoteOwnedQuizzes((current) =>
            current.filter((quiz) => quiz.id !== sourceQuiz.id),
          );
          setRemoteReferencedQuizzes((current) =>
            current.filter((quiz) => quiz.id !== sourceQuiz.id),
          );
          setLocalQuizzes((current) =>
            current.filter((quiz) => quiz.id !== sourceQuiz.id),
          );
          setHiddenQuizIds((current) =>
            current.filter((hiddenQuizId) => hiddenQuizId !== sourceQuiz.id),
          );
          return;
        }

        setLocalQuizzes((current) =>
          current.filter(
            (quiz) => !(quiz.id === quizId && quiz.ownerRole === viewerRole),
          ),
        );
      },
      duplicateQuizToLibrary: (quizId, viewerRole) => {
        const source = quizzes.find((quiz) => quiz.id === quizId);

        if (!source) {
          return null;
        }

        const now = new Date();
        const duplicate: QuizRecord = {
          ...source,
          id: `quiz-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          ownerUserId: currentUser?.id,
          ownerRole: viewerRole,
          ownerName: getOwnerName(viewerRole, currentUser?.fullName),
          sourceQuizId: source.id,
          title: `${source.title} Copy`,
          updatedAt: formatQuizDate(now),
          status: "draft",
          visibility: "private",
          sourceLabel: `Duplicated from ${source.ownerName}'s quiz`,
          note:
            viewerRole === "teacher"
              ? "Duplicated locally until a backend duplicate endpoint exists."
              : "This duplicated quiz is now your editable draft copy.",
          tags: normalizeTags(source.tags),
          questions: source.questions.map((question) => ({
            ...question,
            options: [...question.options],
            optionIds: question.optionIds ? [...question.optionIds] : undefined,
            correctIndexes: question.correctIndexes
              ? [...question.correctIndexes]
              : undefined,
          })),
          practiceState: viewerRole === "student" ? "ready" : undefined,
          practiceProgressLabel: undefined,
          attemptCount: undefined,
          averageScore: undefined,
        };

        upsertLocalQuiz(duplicate);
        return duplicate;
      },
    }),
    [currentUser?.fullName, currentUser?.id, isRemoteLoading, quizzes],
  );

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}

export function useQuizLibrary() {
  const context = useContext(QuizLibraryContext);

  if (!context) {
    throw new Error("useQuizLibrary must be used within QuizLibraryProvider.");
  }

  return context;
}
