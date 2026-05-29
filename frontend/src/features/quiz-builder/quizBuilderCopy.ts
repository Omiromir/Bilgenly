import type { QuestionType, QuizBuilderCopy } from "./quizBuilderTypes";

export const quizSteps = [
  { key: "upload", label: "Upload" },
  { key: "configure", label: "Configure" },
  { key: "generate", label: "Generate" },
  { key: "review", label: "Review" },
] as const;

export const questionTypeOptions: QuestionType[] = [
  "Multiple choice",
  "True/False",
];

const classOptions = [
  "Science 10A",
  "Biology Lab",
  "Intro to Programming",
  "Independent study",
];

const studentGoalOptions = [
  "Exam revision",
  "Topic drill",
  "Quick self-check",
  "Deep practice",
];

export const workspaceCopy: Record<"teacher" | "student", QuizBuilderCopy> = {
  teacher: {
    badge: "Core MVP flow",
    inputDescription:
      "Start with a PDF or paste lecture text. The next step replaces this view with source review and quiz settings.",
    configureDescription:
      "Confirm the extracted source, then set only the quiz options that matter for the first draft.",
    contextLabel: "Class label",
    contextOptions: classOptions,
    defaultContextValue: classOptions[0],
    defaultInstructions:
      "Prioritize conceptual clarity and keep wording friendly for secondary school students.",
    successDescription:
      "The generation stage is complete. Move to review to edit wording, fix issues, and finalize the quiz before saving.",
    reviewReadyLabel: "The draft is ready for teacher use",
    saveLabel: "Save Draft",
    publishLabel: "Save Quiz",
    launchLabel: "Test Run Quiz",
  },
  student: {
    badge: "Self-learning flow",
    inputDescription:
      "Start with your notes, reading summary, or revision material. The next step replaces this view with a study-focused setup.",
    configureDescription:
      "Check the extracted source, then tailor the quiz for solo practice and revision rather than classroom delivery.",
    contextLabel: "Study goal",
    contextOptions: studentGoalOptions,
    defaultContextValue: studentGoalOptions[0],
    defaultInstructions:
      "Keep the wording encouraging, build confidence early, and make the quiz useful for self-checking without teacher guidance.",
    successDescription:
      "Your self-study draft is ready. Move to review to refine questions, remove weak items, and finalize the practice set.",
    reviewReadyLabel: "The draft is ready for self-study",
    saveLabel: "Save to My Library",
    publishLabel: "Save to My Library",
    launchLabel: "Start Self-Test",
  },
};
