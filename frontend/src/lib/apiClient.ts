const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5241"
    : "https://bilgenly-1.onrender.com")
).replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "bilgenly_token";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
}

function extractErrorMessage(payload: unknown, fallbackMessage: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string" &&
    (payload as { message: string }).message.trim()
  ) {
    return (payload as { message: string }).message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const title =
      "title" in payload && typeof (payload as { title?: unknown }).title === "string"
        ? (payload as { title: string }).title.trim()
        : "";
    const errors =
      "errors" in payload &&
      (payload as { errors?: unknown }).errors &&
      typeof (payload as { errors?: unknown }).errors === "object"
        ? ((payload as { errors: Record<string, unknown> }).errors ?? {})
        : null;

    if (errors) {
      const quizIdErrors = [
        errors.quizId,
        errors.QuizId,
        errors["$.quizId"],
        errors["$.QuizId"],
      ].flatMap((value) => (Array.isArray(value) ? value : typeof value === "string" ? [value] : []));

      if (quizIdErrors.length) {
        return "This quiz is not synced with the backend yet, so it cannot be assigned to a class.";
      }

      const dtoErrors = [
        errors.dto,
        errors.Dto,
      ].flatMap((value) => (Array.isArray(value) ? value : typeof value === "string" ? [value] : []));

      const firstFieldError = Object.values(errors).flatMap((value) =>
        Array.isArray(value) ? value : typeof value === "string" ? [value] : [],
      )[0];

      if (typeof firstFieldError === "string" && firstFieldError.trim()) {
        if (dtoErrors.length && title) {
          return title;
        }

        return firstFieldError;
      }
    }

    if (title) {
      return title;
    }
  }

  return fallbackMessage;
}

export function getRequestErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Unable to reach the server. Please try again.";
    }

    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
  fallbackErrorMessage?: string;
}

export async function apiRequest<T>(
  path: string,
  {
    body,
    headers,
    skipAuth = false,
    fallbackErrorMessage = "Request failed",
    ...init
  }: ApiRequestOptions = {},
) {
  const token = skipAuth ? null : getAuthToken();
  const nextHeaders = new Headers(headers);

  if (body !== undefined && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }

  if (token && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: nextHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    // 401 on an authenticated request means the token is no longer valid:
    // user was suspended, deleted, or the token expired. Broadcast a single
    // event so the AuthProvider can boot them out of the live session
    // without each call site having to know about auth.
    if (response.status === 401 && token) {
      const suspendedFlag =
        payload &&
        typeof payload === "object" &&
        "suspended" in payload &&
        Boolean((payload as { suspended?: unknown }).suspended);
      const message = extractErrorMessage(payload, "Your session has ended.");
      dispatchAuthRevoked({
        reason: suspendedFlag ? "suspended" : "expired",
        message,
      });
    }

    throw new ApiError(
      extractErrorMessage(payload, fallbackErrorMessage),
      response.status,
      payload,
    );
  }

  return payload as T;
}

/**
 * Dispatched whenever an authenticated API call comes back 401. The
 * AuthProvider subscribes to this event and runs `signOut()` so a user who
 * gets suspended/deleted on the backend is booted out without needing a page
 * refresh.
 */
export interface AuthRevokedDetail {
  reason: "suspended" | "expired";
  message: string;
}

export const AUTH_REVOKED_EVENT = "bilgenly:auth-revoked" as const;

let lastDispatchAt = 0;
function dispatchAuthRevoked(detail: AuthRevokedDetail) {
  // Bursting through 401s on parallel requests would otherwise fire the
  // event dozens of times and stack toasts. Throttle to one per 2s.
  const now = Date.now();
  if (now - lastDispatchAt < 2000) return;
  lastDispatchAt = now;
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthRevokedDetail>(AUTH_REVOKED_EVENT, { detail }),
  );
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function isGuidString(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}
