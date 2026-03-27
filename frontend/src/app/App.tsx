import { AuthProvider } from "./providers/AuthProvider";
import { QuizLibraryProvider } from "./providers/QuizLibraryProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <QuizLibraryProvider>
          <AppRoutes />
        </QuizLibraryProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
