import type {
    ResetPasswordFormValues,
    SignInFormValues,
    SignUpFormValues,
} from "./types";

const API_URL = "http://localhost:5241";
const AUTH_TOKEN_KEY = "bilgenly_token";
const AUTH_ROLE_KEY = "bilgenly_role";

async function readErrorMessage(response: Response, fallbackMessage: string) {
    try {
        const error = await response.json();
        if (typeof error?.message === "string" && error.message.trim() !== "") {
            return error.message;
        }
    } catch {
        //  Just ignore JSON parsing errors and return the fallback message
    }

    return fallbackMessage;
}

function getRequestErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
            return "Unable to reach the server. Please try again.";
        }

        return error.message;
    }

    return fallbackMessage;
}


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
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: data.email,
                password: data.password,
            }),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, "Login failed"));
        }

        const result = await response.json();
        saveAuth(result.token, result.role);
        return result;
    } catch (error) {
        throw new Error(getRequestErrorMessage(error, "Login failed"));
    }
}

export async function signUp(data: SignUpFormValues) {
    try {
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
            throw new Error(await readErrorMessage(response, "Registration failed"));
        }

        const result = await response.json();
        saveAuth(result.token, result.role);
        return result;
    } catch (error) {
        throw new Error(getRequestErrorMessage(error, "Registration failed"));
    }
}

export async function requestPasswordReset(_: ResetPasswordFormValues) {
    return new Promise((resolve) => window.setTimeout(resolve, 400));
}
export async function getMe() {
    const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) throw new Error("Unauthorized");
    return response.json();
}
