import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { signIn } from "../api";
import { usePasswordVisibility } from "../hooks";
import type { SignInFormErrors, SignInFormValues } from "../types";
import type { UserRole } from "../../../lib/auth";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateSignInForm,
} from "../validation";
import { getDashboardPathByRole } from "../../../lib/auth";
import {useAuth} from "../../../app/providers/AuthProvider";

export function SignInForm() {
  const navigate = useNavigate();
  const { signInAsRole } = useAuth();
  const { inputType, isVisible, toggleVisibility } = usePasswordVisibility();
  const [values, setValues] = useState<SignInFormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [touched, setTouched] = useState<
    Record<keyof SignInFormValues, boolean>
  >({
    email: false,
    password: false,
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange =
    (field: keyof SignInFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setValues((current) => ({
        ...current,
        [field]: nextValue,
      }));

      setErrors((current) => ({
        ...current,
        [field]:
          field === "email"
            ? validateEmail(nextValue)
            : validatePassword(nextValue),
      }));
    };

  const handleBlur = (field: keyof SignInFormValues) => () => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setErrors((current) => ({
      ...current,
      [field]:
        field === "email"
          ? validateEmail(values.email)
          : validatePassword(values.password),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const normalizedValues: SignInFormValues = {
      email: normalizeEmail(values.email),
      password: values.password,
    };

    const nextErrors = validateSignInForm(normalizedValues);

    setErrors(nextErrors);
    setTouched({
      email: true,
      password: true,
    });

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

      try {
          setIsSubmitting(true);
          const result = await signIn({ ...normalizedValues, rememberMe });
          signInAsRole(result.role.toLowerCase() as UserRole, result.token);
          const dashboardPath = getDashboardPathByRole(result.role.toLowerCase());
          navigate(dashboardPath);
      } catch (error) {
          setServerError(error instanceof Error ? error.message : "Login failed");
      } finally {
          setIsSubmitting(false);
      }
  };

  const canSubmit =
    !isSubmitting &&
    values.email.trim() !== "" &&
    values.password !== "" &&
    !validateEmail(values.email) &&
    !validatePassword(values.password);

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          className="auth-input"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onBlur={handleBlur("email")}
          onChange={handleChange("email")}
          autoComplete="email"
          inputMode="email"
          aria-invalid={touched.email && Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {touched.email && errors.email && (
          <p id="email-error" className="auth-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="password">
          Password
        </label>
        <div className="auth-input-wrap">
          <input
            id="password"
            className="auth-input has-trailing"
            type={inputType}
            placeholder="Enter your password"
            value={values.password}
            onBlur={handleBlur("password")}
            onChange={handleChange("password")}
            autoComplete="current-password"
            aria-invalid={touched.password && Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            className="auth-trailing-btn"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
          >
            {isVisible ? "Hide" : "Show"}
          </button>
        </div>
        {touched.password && errors.password && (
          <p id="password-error" className="auth-error" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <div className="auth-meta-row">
        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember me</span>
        </label>

        <Link className="auth-link" to="/reset-password">
          Forgot Password
        </Link>
      </div>

      <button className="auth-primary" type="submit" disabled={!canSubmit}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      <div className="auth-center-row">
        Don&apos;t have an account?{" "}
        <Link className="auth-link" to="/signup">
          Sign Up
        </Link>
      </div>

      <div className="auth-divider">Or</div>

      <button
        className="auth-secondary"
        type="button"
        onClick={() => navigate("/onboarding")}
      >
        Sign In With Google
      </button>
    </form>
  );
}
