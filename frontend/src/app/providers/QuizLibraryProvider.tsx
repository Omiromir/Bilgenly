import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  QuizLibraryItem,
  QuizLibraryStatus,
  QuizLibraryVisibility,
  QuizQuestionRecord,
  QuizRecord,
} from "../../features/dashboard/components/quiz-library/quizLibraryTypes";

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
  visibility: QuizLibraryVisibility;
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
  saveGeneratedQuiz: (input: SaveGeneratedQuizInput) => QuizRecord;
  getQuizById: (quizId: string) => QuizRecord | undefined;
  toggleSavedQuiz: (quizId: string, viewerRole: "teacher" | "student") => void;
  deleteQuiz: (quizId: string, viewerRole: "teacher" | "student") => void;
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getOwnerName(role: "teacher" | "student") {
  return role === "teacher" ? "Professor Doe" : "You";
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

export function mapQuizRecordToLibraryItem(
  quiz: QuizRecord,
  viewerRole: "teacher" | "student",
): QuizLibraryItem {
  const isOwner = quiz.ownerRole === viewerRole;

  return {
    id: quiz.id,
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
    isSaved: !isOwner && quiz.savedByRoles?.includes(viewerRole),
    isGeneratedByCurrentUser: viewerRole === "student" && isOwner,
    learnerCount: quiz.learnerCount,
    averageScore: quiz.averageScore,
    saveCount: quiz.savedByRoles?.length ?? quiz.saveCount,
    attemptCount: quiz.attemptCount,
    practiceState: quiz.practiceState,
    practiceProgressLabel: quiz.practiceProgressLabel,
  };
}

export function getQuizLibraryItemsForRole(
  quizzes: QuizRecord[],
  viewerRole: "teacher" | "student",
) {
  return quizzes
    .filter((quiz) => {
      if (quiz.ownerRole === viewerRole) {
        return true;
      }

      return quiz.visibility === "public" && quiz.status === "published-public";
    })
    .map((quiz) => mapQuizRecordToLibraryItem(quiz, viewerRole));
}

export function QuizLibraryProvider({ children }: QuizLibraryProviderProps) {
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedValue = localStorage.getItem(QUIZ_LIBRARY_STORAGE_KEY);

    if (!savedValue) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedValue) as QuizRecord[];
      setQuizzes(
        Array.isArray(parsed)
          ? parsed.map((quiz) => ({
              ...quiz,
              tags: normalizeTags(quiz.tags ?? []),
            }))
          : [],
      );
    } catch {
      setQuizzes([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(QUIZ_LIBRARY_STORAGE_KEY, JSON.stringify(quizzes));
  }, [isHydrated, quizzes]);

  const value = useMemo<QuizLibraryContextValue>(
    () => ({
      quizzes,
      saveGeneratedQuiz: (input) => {
        const now = new Date();
        const quiz: QuizRecord = {
          id:
            input.existingQuizId ??
            `quiz-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          ownerRole: input.ownerRole,
          ownerName: getOwnerName(input.ownerRole),
          title: input.title.trim(),
          description: input.description.trim(),
          topic: input.topic.trim(),
          difficulty: input.difficulty,
          language: input.language,
          questionCount: input.questionCount,
          durationMinutes: input.durationMinutes,
          updatedAt: formatQuizDate(now),
          status: input.status,
          visibility: input.visibility,
          tags: normalizeTags(input.tags),
          sourceLabel: input.sourceLabel,
          note: input.note,
          questions: input.questions,
          practiceState: input.practiceState,
        };

        setQuizzes((current) => {
          const existingIndex = current.findIndex(
            (item) => item.id === quiz.id,
          );

          if (existingIndex === -1) {
            return [quiz, ...current];
          }

          const currentQuiz = current[existingIndex];
          const next = [...current];
          next[existingIndex] = {
            ...currentQuiz,
            ...quiz,
            savedByRoles: currentQuiz.savedByRoles,
            sourceQuizId: currentQuiz.sourceQuizId,
          };
          return next;
        });
        return quiz;
      },
      getQuizById: (quizId) => quizzes.find((quiz) => quiz.id === quizId),
      toggleSavedQuiz: (quizId, viewerRole) => {
        setQuizzes((current) =>
          current.map((quiz) => {
            if (quiz.id !== quizId || quiz.ownerRole === viewerRole) {
              return quiz;
            }

            const savedByRoles = new Set(quiz.savedByRoles ?? []);
            if (savedByRoles.has(viewerRole)) {
              savedByRoles.delete(viewerRole);
            } else {
              savedByRoles.add(viewerRole);
            }

            return {
              ...quiz,
              savedByRoles: Array.from(savedByRoles),
            };
          }),
        );
      },
      deleteQuiz: (quizId, viewerRole) => {
        setQuizzes((current) =>
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
          ownerRole: viewerRole,
          ownerName: getOwnerName(viewerRole),
          sourceQuizId: source.id,
          savedByRoles: [],
          title: `${source.title} Copy`,
          updatedAt: formatQuizDate(now),
          status: "draft",
          visibility: "private",
          sourceLabel: `Duplicated from ${source.ownerName}'s public quiz`,
          note: "This duplicated quiz is now your editable draft copy.",
          tags: normalizeTags(source.tags),
          questions: source.questions.map((question) => ({
            ...question,
            options: [...question.options],
          })),
        };

        setQuizzes((current) => [duplicate, ...current]);
        return duplicate;
      },
    }),
    [quizzes],
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
