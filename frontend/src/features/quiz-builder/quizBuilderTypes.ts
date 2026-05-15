export type InputMethod = "upload" | "paste";
export type ParseStatus = "idle" | "processing" | "ready" | "warning" | "error";
export type GenerationState = "idle" | "running" | "success" | "failed" | "cancelled";
export type QuestionType = "Multiple choice" | "True/False";
export type QuestionSelectionMode = "single" | "multiple";
export type QuestionAnswerOrder = "fixed" | "shuffle";
export type QuestionStatus = "unreviewed" | "edited" | "needs attention";
export type WorkspaceStage = "input" | "configure" | "generate" | "review";
export type QuizExportFormat = "json" | "txt" | "xml";

export interface ParsedSource {
  label: string;
  lengthLabel: string;
  pageEstimate: string;
  characterCount: number;
  extractedText: string;
  warning?: string;
}

export interface GeneratedQuestion {
  id: string;
  optionIds?: string[];
  questionType: QuestionType;
  selectionMode: QuestionSelectionMode;
  text: string;
  options: string[];
  correctIndex: number;
  correctIndexes: number[];
  explanation: string;
  imageEnabled: boolean;
  imageUrl?: string;
  points: number;
  estimatedMinutes: number;
  answerOrder: QuestionAnswerOrder;
  required: boolean;
  status: QuestionStatus;
}

export interface ValidationIssue {
  id: string;
  questionId: string;
  tone: "warning" | "danger";
  label: string;
  detail: string;
}

export interface QuizBuilderWorkspaceProps {
  mode: "teacher" | "student";
  title: string;
  subtitle: string;
}

export interface QuizBuilderCopy {
  badge: string;
  inputDescription: string;
  configureDescription: string;
  contextLabel: string;
  contextOptions: string[];
  defaultContextValue: string;
  defaultInstructions: string;
  successDescription: string;
  reviewReadyLabel: string;
  saveLabel: string;
  publishLabel: string;
  launchLabel: string;
}
