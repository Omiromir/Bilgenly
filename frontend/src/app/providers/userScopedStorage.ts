interface UserStorageScopeInput {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  token?: string | null;
}

const GLOBAL_KEYS_TO_CLEAR = [
  "bilgenly_notifications",
  "bilgenly_reminder_last_shown",
] as const;

const SCOPED_BASE_KEYS = [
  "bilgenly_user_settings_v1",
  "bilgenly_quiz_library",
  "bilgenly_quiz_sessions",
  "bilgenly_shared_assigned_quiz_sessions",
  "bilgenly_hidden_class_assignments",
  "bilgenly_notifications",
  "bilgenly_reminder_last_shown",
  "bilgenly_quiz_builder_draft:teacher",
  "bilgenly_quiz_builder_draft:student",
] as const;

function normalizeStorageSegment(value: string) {
  return value.trim().toLowerCase();
}

function hashValue(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export function getUserStorageScope({
  userId,
  email,
  role,
  token,
}: UserStorageScopeInput) {
  if (userId?.trim()) {
    return `user:${normalizeStorageSegment(userId)}`;
  }

  if (email?.trim()) {
    return `email:${normalizeStorageSegment(email)}`;
  }

  if (token?.trim()) {
    const roleSegment = role?.trim().toLowerCase() || "user";
    return `session:${roleSegment}:${hashValue(token)}`;
  }

  if (role?.trim()) {
    return `role:${normalizeStorageSegment(role)}`;
  }

  return "anonymous";
}

export function getUserScopedStorageKey(baseKey: string, scope: string) {
  return `${baseKey}:${scope}`;
}

export function getScopedStorageValue(baseKey: string, scope: string) {
  const scopedKey = getUserScopedStorageKey(baseKey, scope);
  const scopedValue = localStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return scopedValue;
  }

  const legacyValue = localStorage.getItem(baseKey);

  if (legacyValue === null) {
    return null;
  }

  localStorage.setItem(scopedKey, legacyValue);
  localStorage.removeItem(baseKey);

  return legacyValue;
}


export function clearAllUserStorage({
  userId,
  email,
  role,
  token,
}: {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  token?: string | null;
}) {
  for (const key of GLOBAL_KEYS_TO_CLEAR) {
    localStorage.removeItem(key);
  }

  const userScopes = new Set<string>();
  if (userId?.trim()) {
    userScopes.add(`user:${normalizeStorageSegment(userId)}`);
  }
  if (email?.trim()) {
    userScopes.add(`email:${normalizeStorageSegment(email)}`);
  }
  if (token?.trim()) {
    const roleSegment = role?.trim().toLowerCase() || "user";
    userScopes.add(`session:${roleSegment}:${hashValue(token)}`);
  }
  if (role?.trim()) {
    userScopes.add(`role:${normalizeStorageSegment(role)}`);
  }

  if (userScopes.size === 0) return;

  for (const base of SCOPED_BASE_KEYS) {
    for (const scope of userScopes) {
      localStorage.removeItem(getUserScopedStorageKey(base, scope));
    }
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("bilgenly_")) continue;
    for (const scope of userScopes) {
      if (key.endsWith(`:${scope}`)) {
        keysToRemove.push(key);
        break;
      }
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}
