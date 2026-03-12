import { Route, Routes } from "react-router";
import { ModeratorDashboardPage } from "../../pages/dashboard/moderator/ModeratorDashboardPage";
import { StudentDashboardPage } from "../../pages/dashboard/student/StudentDashboardPage";
import { TeacherDashboardPage } from "../../pages/dashboard/teacher/TeacherDashboardPage";
import { OnboardingPage } from "../../pages/auth/OnboardingPage";
import { ResetPasswordPage } from "../../pages/auth/ResetPasswordPage";
import { SignInPage } from "../../pages/auth/SignInPage";
import { SignUpPage } from "../../pages/auth/SignUpPage";
import { LandingPage } from "../../pages/public/LandingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard/teacher" element={<TeacherDashboardPage />} />
      <Route path="/dashboard/student" element={<StudentDashboardPage />} />
      <Route path="/dashboard/moderator" element={<ModeratorDashboardPage />} />
    </Routes>
  );
}
