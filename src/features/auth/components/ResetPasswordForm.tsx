import { type FormEvent, useState } from "react";
import { Link } from "react-router";
import { requestPasswordReset } from "../api";
import type {
  ResetPasswordFormErrors,
  ResetPasswordFormValues,
} from "../types";
import {
  normalizeEmail,
  validateEmail,
  validateResetPasswordForm,
} from "../validation";

export function ResetPasswordForm() {
  const [values, setValues] = useState<ResetPasswordFormValues>({
    email: "",
  });
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedValues = {
      email: normalizeEmail(values.email),
    };
    const nextErrors = validateResetPasswordForm(normalizedValues);

    setErrors(nextErrors);
    setTouched(true);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset(normalizedValues);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-label" htmlFor="reset-email">
          Email Address
        </label>
        <input
          id="reset-email"
          className="auth-input"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(event) => {
            const nextEmail = event.target.value;
            setValues({ email: nextEmail });
            setErrors({ email: validateEmail(nextEmail) });
          }}
          aria-invalid={touched && Boolean(errors.email)}
          aria-describedby={errors.email ? "reset-email-error" : undefined}
        />
        {touched && errors.email && (
          <p id="reset-email-error" className="auth-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {isSubmitted && (
        <p className="auth-help">
          If an account exists for that email, a reset link has been sent.
        </p>
      )}

      <button
        className="auth-primary"
        type="submit"
        disabled={isSubmitting || Boolean(validateEmail(values.email))}
      >
        {isSubmitting ? "Sending..." : "Reset Password"}
      </button>

      <div className="auth-back-link">
        <Link className="auth-link" to="/signin">
          Back to login screen
        </Link>
      </div>
    </form>
  );
}
