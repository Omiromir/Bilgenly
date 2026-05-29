import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { NotificationsProvider } from "./providers/NotificationsProvider";
import { QuizLibraryProvider } from "./providers/QuizLibraryProvider";
import { QuizSessionProvider } from "./providers/QuizSessionProvider";
import { StudentAttemptsProvider } from "./providers/StudentAttemptsProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { TeacherClassesProvider } from "./providers/TeacherClassesProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "../components/ui/sonner";
import { useSettings } from "./providers/SettingsProvider";
import { SplashScreen } from "../components/shared/SplashScreen";
import { useStudyReminder } from "./hooks/useStudyReminder";

function AppToaster() {
  const { resolvedTheme } = useSettings();
  return <Toaster closeButton position="top-right" richColors theme={resolvedTheme} />;
}

function AppInner() {
  const { isLoading, currentUser } = useAuth();
  const { studyReminderTime } = useSettings();
  useStudyReminder(studyReminderTime, currentUser?.id);
  return (
    <>
      <SplashScreen visible={isLoading} />
      <AppRoutes />
      <AppToaster />
    </>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <SettingsProvider>
          <NotificationsProvider>
            <TeacherClassesProvider>
              <QuizLibraryProvider>
                <QuizSessionProvider>
                  <StudentAttemptsProvider>
                    <AppInner />
                  </StudentAttemptsProvider>
                </QuizSessionProvider>
              </QuizLibraryProvider>
            </TeacherClassesProvider>
          </NotificationsProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
