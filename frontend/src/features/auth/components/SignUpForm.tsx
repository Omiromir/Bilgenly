import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { signUp } from "../api";
import { usePasswordVisibility } from "../hooks";
import type { UserRole } from "../../../lib/auth";
import type { SignUpFormErrors, SignUpFormValues } from "../types";
import {
    getPasswordStrength,
    normalizeEmail,
    validateEmail,
    validateFullName,
    validateSignUpForm,
    validateStrongPassword,
} from "../validation";
import { getDashboardPathByRole } from "../../../lib/auth";
import {useAuth} from "../../../app/providers/AuthProvider";

export function SignUpForm() {
    const navigate = useNavigate();
    const { inputType, isVisible, toggleVisibility } = usePasswordVisibility();
    const { signInAsRole } = useAuth();
    const [values, setValues] = useState<SignUpFormValues>({
        email: "",
        fullName: "",
        password: "",
        role: "Student",
    });
    const [errors, setErrors] = useState<SignUpFormErrors>({});
    const [touched, setTouched] = useState<Record<keyof SignUpFormValues, boolean>>({
        email: false,
        fullName: false,
        password: false,
        role: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const passwordStrength = getPasswordStrength(values.password);

    const handleChange =
        (field: keyof SignUpFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const nextValue = event.target.value;
            setValues((current) => ({ ...current, [field]: nextValue }));

            if (field !== "role") {
                setErrors((current) => ({
                    ...current,
                    [field]:
                        field === "fullName"
                            ? validateFullName(nextValue)
                            : field === "email"
                                ? validateEmail(nextValue)
                                : validateStrongPassword(nextValue),
                }));
            }
        };

    const handleBlur = (field: keyof SignUpFormValues) => () => {
        setTouched((current) => ({ ...current, [field]: true }));

        if (field !== "role") {
            setErrors((current) => ({
                ...current,
                [field]:
                    field === "fullName"
                        ? validateFullName(values.fullName)
                        : field === "email"
                            ? validateEmail(values.email)
                            : validateStrongPassword(values.password),
            }));
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setServerError(null);

        const normalizedValues: SignUpFormValues = {
            email: normalizeEmail(values.email),
            fullName: values.fullName.trim(),
            password: values.password,
            role: values.role,
        };

        const nextErrors = validateSignUpForm(normalizedValues);
        setErrors(nextErrors);
        setTouched({ email: true, fullName: true, password: true, role: true });

        if (Object.values(nextErrors).some(Boolean)) return;

        try {
            setIsSubmitting(true);
            const result = await signUp(normalizedValues);
            signInAsRole(result.role.toLowerCase() as UserRole, result.token);
            const dashboardPath = getDashboardPathByRole(result.role.toLowerCase());
            navigate(dashboardPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Registration failed";
            setServerError(message);
            toast.error(message);
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

            {/* Ошибка сервера */}
            {serverError && (
                <p className="auth-error" role="alert">
                    {serverError}
                </p>
            )}

            <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">Full Name</label>
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
                />
                {touched.fullName && errors.fullName && (
                    <p className="auth-error" role="alert">{errors.fullName}</p>
                )}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email Address</label>
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
                />
                {touched.email && errors.email && (
                    <p className="auth-error" role="alert">{errors.email}</p>
                )}
            </div>

            <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
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
                <p className="auth-help">
                    Use at least 8 characters with uppercase, lowercase, and a number.
                </p>
                {touched.password && errors.password && (
                    <p className="auth-error" role="alert">{errors.password}</p>
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

            <div className="auth-field">
                <label className="auth-label" htmlFor="role">I am a...</label>
                <select
                    id="role"
                    className="auth-input"
                    value={values.role}
                    onChange={handleChange("role")}
                >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                </select>
            </div>

            <button className="auth-primary" type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>

            <div className="auth-center-row">
                Already have an account?{" "}
                <Link className="auth-link" to="/signin">Sign In.</Link>
            </div>
        </form>
    );
}
