import type {
  ResetPasswordFormErrors,
  ResetPasswordFormValues,
  SignInFormErrors,
  SignInFormValues,
  SignUpFormErrors,
  SignUpFormValues,
} from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string) {
  const email = value.trim();

  if (!email) return "Email address is required.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";

  return undefined;
}

export function validatePassword(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";

  return undefined;
}

export function validateStrongPassword(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 128) return "Password must be 128 characters or fewer.";
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/\d/.test(value)) return "Password must include a number.";

  return undefined;
}

export function validateFullName(value: string) {
  const name = value.trim();

  if (!name) return "Full name is required.";
  if (name.length < 2) return "Full name must be at least 2 characters.";
  if (name.length > 100) return "Full name must be 100 characters or fewer.";

  return undefined;
}

export function validateSignInForm(
  values: SignInFormValues
): SignInFormErrors {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

export function validateSignUpForm(
  values: SignUpFormValues
): SignUpFormErrors {
  return {
    email: validateEmail(values.email),
    fullName: validateFullName(values.fullName),
    password: validateStrongPassword(values.password),
  };
}

export function validateResetPasswordForm(
  values: ResetPasswordFormValues
): ResetPasswordFormErrors {
  return {
    email: validateEmail(values.email),
  };
}

export function getPasswordStrength(password: string): {
  label: "Very weak" | "Weak" | "Fair" | "Strong";
  score: number;
} {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Very weak", score: 1 };
  if (score === 2) return { label: "Weak", score: 2 };
  if (score <= 4) return { label: "Fair", score: 3 };

  return { label: "Strong", score: 4 };
}
