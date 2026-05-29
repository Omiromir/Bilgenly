import type {
  QuizDifficulty,
  QuizQuestionRecord,
  QuizRecord,
} from "../components/quiz-library/quizLibraryTypes";
import type { QuizDto } from "./dashboardApiTypes";

interface QuizRecordMetadataOverrides {
  ownerUserId?: string;
  ownerRole?: QuizRecord["ownerRole"];
  ownerName?: string;
  topic?: string;
  difficulty?: QuizDifficulty;
  language?: string;
  status?: QuizRecord["status"];
  visibility?: QuizRecord["visibility"];
  tags?: string[];
  sourceLabel?: string;
  note?: string;
  durationMinutes?: number;
  updatedAt?: string;
}

function normalizeQuestionType(questionType: string): QuizQuestionRecord["questionType"] {
  return questionType === "TrueFalse" ? "True/False" : "Multiple choice";
}

function normalizeSelectionMode(answers: QuizDto["questions"][number]["answers"]) {
  return answers.filter((answer) => answer.isCorrect).length > 1 ? "multiple" : "single";
}

function estimateDifficulty(questionCount: number): QuizDifficulty {
  if (questionCount <= 8) {
    return "Beginner";
  }

  if (questionCount <= 12) {
    return "Intermediate";
  }

  return "Advanced";
}

function mapQuizQuestionDto(question: QuizDto["questions"][number]): QuizQuestionRecord {
  const correctIndexes = question.answers
    .map((answer, index) => (answer.isCorrect ? index : -1))
    .filter((index) => index >= 0);

  return {
    id: question.id,
    text: question.text,
    options: question.answers.map((answer) => answer.text),
    optionIds: question.answers.map((answer) => answer.id),
    correctIndex: correctIndexes[0] ?? 0,
    correctIndexes,
    questionType: normalizeQuestionType(question.questionType),
    selectionMode: normalizeSelectionMode(question.answers),
    explanation: question.explanation,
    imageEnabled: Boolean(question.imageUrl),
    imageUrl: question.imageUrl ?? undefined,
    points: question.points ?? 1,
    estimatedMinutes: question.estimatedMinutes ?? 1,
    answerOrder: "fixed",
    required: true,
  };
}

export function mapQuizDtoToQuizRecord(
  quiz: QuizDto,
  overrides: QuizRecordMetadataOverrides = {},
): QuizRecord {
  const questions = quiz.questions
    .slice()
    .sort((left, right) => left.position - right.position)
    .map(mapQuizQuestionDto);
  // Public discovery is removed from the UI until backend-backed discovery
  // exists. Treat every fetched quiz as private regardless of legacy
  // `isPublic` flags so the UI stays honest.
  const visibility = overrides.visibility ?? "private";
  const status = overrides.status ?? "published-private";

  return {
    id: quiz.id,
    ownerUserId: overrides.ownerUserId,
    ownerRole: overrides.ownerRole ?? "teacher",
    ownerName: overrides.ownerName ?? quiz.createdBy ?? "Unknown teacher",
    title: quiz.title,
    description: quiz.description,
    topic: overrides.topic ?? quiz.title,
    difficulty: overrides.difficulty ?? estimateDifficulty(questions.length),
    language: overrides.language ?? "English",
    questionCount: questions.length,
    durationMinutes:
      overrides.durationMinutes ??
      Math.max(
        2,
        questions.reduce(
          (total, question) => total + Math.max(1, Math.round(question.estimatedMinutes ?? 1)),
          0,
        ),
      ),
    updatedAt: overrides.updatedAt ?? quiz.createdAt,
    status,
    visibility,
    tags: overrides.tags ?? [],
    sourceLabel: overrides.sourceLabel ?? "Saved to backend library",
    note: overrides.note,
    questions,
  };
}
