import type { QuizDifficulty } from "../dashboard/components/quiz-library/quizLibraryTypes";
import type { GeneratedQuestion, QuestionType, QuestionStatus } from "./quizBuilderTypes";

export function createQuestionId() {
  return Math.random().toString(36).slice(2, 9);
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Could not read the selected image."));
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}

export function buildMockExtract(sourceLabel: string) {
  return `Lecture material summary from ${sourceLabel}: Proteins are formed from amino acids linked by peptide bonds. The structure of a protein depends on the sequence of amino acids, the interactions between side chains, and the surrounding environment. Enzymes speed up reactions by lowering activation energy, and their activity can be affected by temperature and pH. Students should distinguish covalent, ionic, and hydrogen bonds, then explain why peptide bonds are unique in biological macromolecules.`;
}

export function buildGeneratedQuestions(
  title: string,
  focus: string,
  requestedCount: number,
): GeneratedQuestion[] {
  const focusLabel = focus || "the uploaded lecture";
  const difficultyPrompt = "is most accurate";

  const templates = [
    `Which statement ${difficultyPrompt} about ${focusLabel}?`,
    `Why is peptide bonding important in ${focusLabel}?`,
    `Which example from ${focusLabel} would students most likely classify correctly?`,
    `What explanation should students give after reviewing ${focusLabel}?`,
    `Which misunderstanding is most likely if a learner only skims ${focusLabel}?`,
    `How would you apply the central concept from ${focusLabel} in a new scenario?`,
  ];

  return Array.from({ length: requestedCount }, (_, index) => ({
    id: createQuestionId(),
    questionType: "Multiple choice",
    selectionMode: "single",
    text:
      index === 0
        ? `What type of bond forms between amino acids in proteins for ${title || "this quiz"}?`
        : templates[index % templates.length],
    options:
      index === 0
        ? ["Ionic bond", "Hydrogen bond", "Peptide bond", "Covalent bond"]
        : [
            "It supports the core concept described in the lecture.",
            "It contradicts the source material.",
            "It only applies in unrelated contexts.",
            "It is not addressed by the lecture material.",
          ],
    correctIndex: 2,
    correctIndexes: [2],
    explanation:
      index === 0
        ? "A peptide bond links amino acids together, which is the defining connection that forms the protein backbone."
        : `The best answer matches the main idea from ${focusLabel} and reinforces the concept students are meant to remember.`,
    imageEnabled: false,
    points: index === 0 ? 2 : 1,
    estimatedMinutes: 2,
    answerOrder: "fixed",
    required: true,
    tags: [],
    status: index < 2 ? "unreviewed" : "needs attention",
  }));
}

export function getQuestionCorrectIndexes(question: GeneratedQuestion) {
  return question.selectionMode === "multiple"
    ? question.correctIndexes.length
      ? [...question.correctIndexes].sort((left, right) => left - right)
      : [question.correctIndex]
    : [question.correctIndex];
}

export function applyCorrectIndexes(
  question: GeneratedQuestion,
  correctIndexes: number[],
): GeneratedQuestion {
  const normalizedIndexes = Array.from(
    new Set(
      correctIndexes.filter(
        (index) => index >= 0 && index < question.options.length,
      ),
    ),
  ).sort((left, right) => left - right);
  const fallbackIndex = Math.min(
    Math.max(question.correctIndex, 0),
    Math.max(question.options.length - 1, 0),
  );
  const nextIndexes = normalizedIndexes.length ? normalizedIndexes : [fallbackIndex];

  return {
    ...question,
    correctIndex: nextIndexes[0] ?? 0,
    correctIndexes:
      question.selectionMode === "multiple" ? nextIndexes : [nextIndexes[0] ?? 0],
  };
}

export function applyQuestionType(
  question: GeneratedQuestion,
  questionType: QuestionType,
): GeneratedQuestion {
  if (questionType === "True/False") {
    return {
      ...question,
      questionType,
      selectionMode: "single",
      options: ["True", "False"],
      correctIndex: Math.min(question.correctIndex, 1),
      correctIndexes: [Math.min(question.correctIndex, 1)],
      answerOrder: "fixed",
    };
  }

  const nextOptions =
    question.options.length >= 4
      ? question.options
      : ["Option A", "Option B", "Option C", "Option D"];

  return {
    ...question,
    questionType,
    options: nextOptions,
    correctIndex: Math.min(question.correctIndex, nextOptions.length - 1),
    correctIndexes:
      question.selectionMode === "multiple"
        ? getQuestionCorrectIndexes({
            ...question,
            options: nextOptions,
          } as GeneratedQuestion)
        : [Math.min(question.correctIndex, nextOptions.length - 1)],
  };
}

export function reorderQuestionOptions(
  question: GeneratedQuestion,
  fromIndex: number,
  toIndex: number,
): GeneratedQuestion {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= question.options.length ||
    toIndex >= question.options.length
  ) {
    return question;
  }

  const nextOptions = [...question.options];
  const [movedOption] = nextOptions.splice(fromIndex, 1);

  if (typeof movedOption !== "string") {
    return question;
  }

  nextOptions.splice(toIndex, 0, movedOption);

  const nextCorrectIndexes = getQuestionCorrectIndexes(question).map((index) => {
    if (index === fromIndex) {
      return toIndex;
    }

    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) {
      return index - 1;
    }

    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) {
      return index + 1;
    }

    return index;
  });

  return applyCorrectIndexes(
    {
      ...question,
      options: nextOptions,
    },
    nextCorrectIndexes,
  );
}

export function getQuestionStatusTone(status: QuestionStatus) {
  if (status === "edited") {
    return "success";
  }
  if (status === "needs attention") {
    return "warning";
  }
  return "neutral";
}

export function getQuizDifficulty(questionCount: number): QuizDifficulty {
  if (questionCount <= 8) {
    return "Beginner";
  }

  if (questionCount <= 12) {
    return "Intermediate";
  }

  return "Advanced";
}

export function buildQuizDescription(sourceText: string, focus: string) {
  const summary = sourceText.trim().replace(/\s+/g, " ");
  const excerpt = summary.slice(0, 148).trimEnd();

  if (!summary) {
    return focus
      ? `AI-generated quiz focused on ${focus}.`
      : "AI-generated quiz built from the provided source material.";
  }

  return `${excerpt}${summary.length > 148 ? "..." : ""}`;
}
