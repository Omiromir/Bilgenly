export type StepKey =
  | "signup"
  | "email"
  | "welcome"
  | "role"
  | "goal"
  | "experience"
  | "pace"
  | "reminder"
  | "loading"
  | "recommendations";

export interface SelectedAnswers {
  role?: string;
  goal?: string;
  experience?: string;
  pace?: string;
}

export interface ChoiceOption {
  id: string;
  emoji: string;
  label: string;
  sub: string;
}

export interface RecommendationCard {
  emoji: string;
  tag: string;
  tagColor: string;
  title: string;
  sub: string;
  time: string;
}
