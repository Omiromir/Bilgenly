import { AuthLayout } from "../../app/layouts/AuthLayout";
import { SignUpForm } from "../../features/auth/components/SignUpForm";

export function SignUpPage() {
  return (
    <AuthLayout
      title="Sign Up For Free."
      subtitle="Unleash your Bilgenly study flow right now."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
