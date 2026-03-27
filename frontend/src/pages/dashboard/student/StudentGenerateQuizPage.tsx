import { QuizBuilderWorkspace } from "../../../features/quiz-builder/QuizBuilderWorkspace";

export function StudentGenerateQuizPage() {
  return (
    <QuizBuilderWorkspace
      mode="student"
      title="Generate Self-Study Quiz"
      subtitle="Turn your notes, readings, or revision summaries into a personal practice quiz you can review and run yourself."
    />
  );
}
