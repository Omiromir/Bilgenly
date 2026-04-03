interface UserStorageScopeInput {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  token?: string | null;
}

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
