import { AuthLayout } from "../../app/layouts/AuthLayout";
import { SignInForm } from "../../features/auth/components/SignInForm";

export function SignInPage() {
  return (
    <AuthLayout
      title="Sign In To Your Account."
      subtitle="Unleash your Bilgenly study flow right now."
    >
      <SignInForm />
    </AuthLayout>
  );
}
