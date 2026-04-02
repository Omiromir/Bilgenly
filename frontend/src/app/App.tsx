import { AuthProvider } from "./providers/AuthProvider";
import { NotificationsProvider } from "./providers/NotificationsProvider";
import { QuizLibraryProvider } from "./providers/QuizLibraryProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { TeacherClassesProvider } from "./providers/TeacherClassesProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "../components/ui/sonner";

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <NotificationsProvider>
          <TeacherClassesProvider>
            <QuizLibraryProvider>
              <AppRoutes />
              <Toaster closeButton position="top-right" richColors />
            </QuizLibraryProvider>
          </TeacherClassesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
