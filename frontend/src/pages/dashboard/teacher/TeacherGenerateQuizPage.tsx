import { QuizBuilderWorkspace } from "../../../features/quiz-builder/QuizBuilderWorkspace";

export function TeacherGenerateQuizPage() {
  return (
    <QuizBuilderWorkspace
      mode="teacher"
      title="Generate Quiz"
      subtitle="Upload lecture material, guide the AI, and review the draft before it reaches students."
    />
  );
}
