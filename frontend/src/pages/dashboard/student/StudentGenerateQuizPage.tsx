import { QuizBuilderWorkspace } from "../../../features/quiz-builder/QuizBuilderWorkspace";

export function StudentGenerateQuizPage() {
  return (
    <QuizBuilderWorkspace
      mode="student"
      title="Build a Practice Quiz"
      subtitle="Upload your notes or paste revision text and we'll turn it into a personal practice quiz you can run, review, and save to your library."
    />
  );
}
