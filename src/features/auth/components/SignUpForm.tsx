import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { signUp } from "../api";
import { usePasswordVisibility } from "../hooks";
import type { SignUpFormErrors, SignUpFormValues } from "../types";
import {
  getPasswordStrength,
  normalizeEmail,
  validateEmail,
  validateFullName,
  validateSignUpForm,
  validateStrongPassword,
} from "../validation";

export function SignUpForm() {
  const navigate = useNavigate();
  const { inputType, isVisible, toggleVisibility } = usePasswordVisibility();
  const [values, setValues] = useState<SignUpFormValues>({
    email: "",
    fullName: "",
    password: "",
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [touched, setTouched] = useState<Record<keyof SignUpFormValues, boolean>>(
    {
      email: false,
      fullName: false,
      password: false,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = getPasswordStrength(values.password);

  const handleChange =
    (field: keyof SignUpFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setValues((current) => ({
        ...current,
        [field]: nextValue,
      }));

      setErrors((current) => ({
        ...current,
        [field]:
          field === "fullName"
            ? validateFullName(nextValue)
            : field === "email"
              ? validateEmail(nextValue)
              : validateStrongPassword(nextValue),
      }));
    };

  const handleBlur = (field: keyof SignUpFormValues) => () => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setErrors((current) => ({
      ...current,
      [field]:
        field === "fullName"
          ? validateFullName(values.fullName)
          : field === "email"
            ? validateEmail(values.email)
            : validateStrongPassword(values.password),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues: SignUpFormValues = {
      email: normalizeEmail(values.email),
      fullName: values.fullName.trim(),
      password: values.password,
    };

    const nextErrors = validateSignUpForm(normalizedValues);

    setErrors(nextErrors);
    setTouched({
      email: true,
      fullName: true,
      password: true,
    });

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp(normalizedValues);
      navigate("/onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    values.fullName.trim() !== "" &&
    values.email.trim() !== "" &&
    values.password !== "" &&
    !validateFullName(values.fullName) &&
    !validateEmail(values.email) &&
    !validateStrongPassword(values.password);

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          className="auth-input"
          type="text"
          placeholder="Your full name"
          value={values.fullName}
          onBlur={handleBlur("fullName")}
          onChange={handleChange("fullName")}
          autoComplete="name"
          aria-invalid={touched.fullName && Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
        {touched.fullName && errors.fullName && (
          <p id="fullName-error" className="auth-error" role="alert">
            {errors.fullName}
          </p>
        )}
      </div>

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
            placeholder="Create a password"
            value={values.password}
            onBlur={handleBlur("password")}
            onChange={handleChange("password")}
            autoComplete="new-password"
            aria-invalid={touched.password && Boolean(errors.password)}
            aria-describedby={
              touched.password && errors.password
                ? "password-error"
                : "password-help"
            }
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

        <p id="password-help" className="auth-help">
          Use at least 8 characters with uppercase, lowercase, and a number.
        </p>

        {touched.password && errors.password && (
          <p id="password-error" className="auth-error" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <div className="auth-strength" aria-live="polite">
        <div className="auth-strength-bars">
          <span className={passwordStrength.score >= 1 ? "active" : ""} />
          <span className={passwordStrength.score >= 2 ? "active" : ""} />
          <span className={passwordStrength.score >= 3 ? "active" : ""} />
          <span className={passwordStrength.score >= 4 ? "active" : ""} />
        </div>
        <div className="auth-strength-label">
          Password strength: {passwordStrength.label}
        </div>
      </div>

      <button className="auth-primary" type="submit" disabled={!canSubmit}>
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </button>

      <div className="auth-center-row">
        Already have an account?{" "}
        <Link className="auth-link" to="/signin">
          Sign In.
        </Link>
      </div>

      <div className="auth-divider">Or</div>

      <div className="auth-stack">
        <button
          className="auth-secondary"
          type="button"
          onClick={() => navigate("/onboarding")}
        >
          Sign Up With Google
        </button>
      </div>
    </form>
  );
}
