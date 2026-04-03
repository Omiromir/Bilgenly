import { Navigate, Route, Routes } from "react-router";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ModeratorDashboardPage } from "../../pages/dashboard/moderator/ModeratorDashboardPage";
import { StudentBadgesPage } from "../../pages/dashboard/student/StudentBadgesPage";
import { StudentGenerateQuizPage } from "../../pages/dashboard/student/StudentGenerateQuizPage";
import { StudentJoinQuizPage } from "../../pages/dashboard/student/StudentJoinQuizPage";
import { StudentClassesPage } from "../../pages/dashboard/student/StudentClassesPage";
import { StudentNotificationsPage } from "../../pages/dashboard/student/StudentNotificationsPage";
import { StudentOverviewPage } from "../../pages/dashboard/student/StudentOverviewPage";
import { StudentProfilePage } from "../../pages/dashboard/student/StudentProfilePage";
import { StudentQuizLibraryPage } from "../../pages/dashboard/student/StudentQuizLibraryPage";
import { StudentResultsPage } from "../../pages/dashboard/student/StudentResultsPage";
import { StudentSettingsPage } from "../../pages/dashboard/student/StudentSettingsPage";
import { TeacherAnalyticsPage } from "../../pages/dashboard/teacher/TeacherAnalyticsPage";
import { TeacherClassesPage } from "../../pages/dashboard/teacher/TeacherClassesPage";
import { TeacherGenerateQuizPage } from "../../pages/dashboard/teacher/TeacherGenerateQuizPage";
import { TeacherOverviewPage } from "../../pages/dashboard/teacher/TeacherOverviewPage";
import { TeacherProfilePage } from "../../pages/dashboard/teacher/TeacherProfilePage";
import { TeacherQuizLibraryPage } from "../../pages/dashboard/teacher/TeacherQuizLibraryPage";
import { TeacherSettingsPage } from "../../pages/dashboard/teacher/TeacherSettingsPage";
import { TeacherStudentsPage } from "../../pages/dashboard/teacher/TeacherStudentsPage";
import { OnboardingPage } from "../../pages/auth/OnboardingPage";
import { ResetPasswordPage } from "../../pages/auth/ResetPasswordPage";
import { SignInPage } from "../../pages/auth/SignInPage";
import { SignUpPage } from "../../pages/auth/SignUpPage";
import { LandingPage } from "../../pages/public/LandingPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
            <Route path="/dashboard/teacher">
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<TeacherOverviewPage />} />
              <Route
                path="generate-quiz"
                element={<TeacherGenerateQuizPage />}
              />
              <Route path="profile" element={<TeacherProfilePage />} />
              <Route
                path="quiz-library"
                element={<TeacherQuizLibraryPage />}
              />
              <Route path="classes" element={<TeacherClassesPage />} />
              <Route path="students" element={<TeacherStudentsPage />} />
              <Route path="analytics" element={<TeacherAnalyticsPage />} />
              <Route path="settings" element={<TeacherSettingsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={["student"]} />}>
            <Route path="/dashboard/student">
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<StudentOverviewPage />} />
              <Route path="join-quiz" element={<StudentJoinQuizPage />} />
              <Route path="classes" element={<StudentClassesPage />} />
              <Route
                path="notifications"
                element={<StudentNotificationsPage />}
              />
              <Route
                path="practice"
                element={<Navigate to="/dashboard/student/quiz-library" replace />}
              />
              <Route path="quiz-library" element={<StudentQuizLibraryPage />} />
              <Route path="generate-quiz" element={<StudentGenerateQuizPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="results" element={<StudentResultsPage />} />
              <Route path="badges" element={<StudentBadgesPage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={["moderator"]} />}>
            <Route
              path="/dashboard/moderator"
              element={<ModeratorDashboardPage />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
