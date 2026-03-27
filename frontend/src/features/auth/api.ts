import type {
    ResetPasswordFormValues,
    SignInFormValues,
    SignUpFormValues,
} from "./types";

const API_URL = "http://localhost:5241";
const AUTH_TOKEN_KEY = "bilgenly_token";
const AUTH_ROLE_KEY = "bilgenly_role";


function saveAuth(token: string, role: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_ROLE_KEY, role.toLowerCase());
}

export function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRole() {
    return localStorage.getItem(AUTH_ROLE_KEY);
}

export function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
}

export async function signIn(data: SignInFormValues & { rememberMe: boolean }) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: data.email,
            password: data.password,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
    }

    const result = await response.json();
    saveAuth(result.token, result.role);
    return result;
}

export async function signUp(data: SignUpFormValues) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: data.fullName,
            email: data.email,
            password: data.password,
            role: data.role ?? "Student",
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
    }

    const result = await response.json();
    saveAuth(result.token, result.role);
    return result;
}

export async function requestPasswordReset(_: ResetPasswordFormValues) {
    return new Promise((resolve) => window.setTimeout(resolve, 400));
}