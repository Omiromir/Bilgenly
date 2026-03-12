import { AuthLayout } from "../../app/layouts/AuthLayout";
import { ResetPasswordForm } from "../../features/auth/components/ResetPasswordForm";

export function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Forgot your password? No worries, then let's submit a password reset. It will be sent to your email."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
