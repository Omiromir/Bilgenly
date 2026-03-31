import { AuthProvider } from "./providers/AuthProvider";
import { NotificationsProvider } from "./providers/NotificationsProvider";
import { QuizLibraryProvider } from "./providers/QuizLibraryProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { TeacherClassesProvider } from "./providers/TeacherClassesProvider";
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <QuizLibraryProvider>
          <NotificationsProvider>
            <TeacherClassesProvider>
              <AppRoutes />
            </TeacherClassesProvider>
          </NotificationsProvider>
        </QuizLibraryProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
