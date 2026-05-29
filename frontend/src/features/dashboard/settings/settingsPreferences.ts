export const SETTINGS_COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Kazakhstan",
] as const;

export const SETTINGS_TIME_ZONE_OPTIONS = [
  "Pacific Time (PT)",
  "Mountain Time (MT)",
  "Central Time (CT)",
  "Eastern Time (ET)",
  "Almaty Time (ALMT)",
  "Qyzylorda Time (QYZT)",
] as const;

export const SETTINGS_LANGUAGE_OPTIONS = [
  "English",
  "Kazakh",
  "Russian",
] as const;

export const SETTINGS_DATE_FORMAT_OPTIONS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
] as const;

export type SettingsCountry = (typeof SETTINGS_COUNTRY_OPTIONS)[number];
export type SettingsTimeZone = (typeof SETTINGS_TIME_ZONE_OPTIONS)[number];
export type SettingsLanguage = (typeof SETTINGS_LANGUAGE_OPTIONS)[number];
export type SettingsDateFormat = (typeof SETTINGS_DATE_FORMAT_OPTIONS)[number];

interface FormattingPreferences {
  language: SettingsLanguage;
  dateFormat: SettingsDateFormat;
  timeZone: SettingsTimeZone;
}

const DEFAULT_FORMATTING_PREFERENCES: FormattingPreferences = {
  language: "English",
  dateFormat: "MM/DD/YYYY",
  timeZone: "Pacific Time (PT)",
};

const LANGUAGE_TO_LOCALE: Record<SettingsLanguage, string> = {
  English: "en-US",
  Kazakh: "kk-KZ",
  Russian: "ru-RU",
};

const LANGUAGE_TO_DOCUMENT_LANG: Record<SettingsLanguage, string> = {
  English: "en",
  Kazakh: "kk",
  Russian: "ru",
};

const TIME_ZONE_TO_IANA: Record<SettingsTimeZone, string> = {
  "Pacific Time (PT)": "America/Los_Angeles",
  "Mountain Time (MT)": "America/Denver",
  "Central Time (CT)": "America/Chicago",
  "Eastern Time (ET)": "America/New_York",
  "Almaty Time (ALMT)": "Asia/Almaty",
  "Qyzylorda Time (QYZT)": "Asia/Qyzylorda",
};

let currentFormattingPreferences = DEFAULT_FORMATTING_PREFERENCES;

function isSupportedStringValue<T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function padDatePart(value: string) {
  return value.padStart(2, "0");
}

function resolveDate(value: string | Date) {
  if (typeof value === "string") {
    // The backend serializes DateTime (UTC) without a timezone suffix when
    // Npgsql reads timestamp-without-time-zone columns back as Unspecified.
    // Treat any ISO datetime string that has no explicit offset as UTC so
    // the browser doesn't interpret it as local time.
    const needsUtcSuffix =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) &&
      !value.endsWith("Z") &&
      !/[+-]\d{2}:?\d{2}$/.test(value);
    const normalized = needsUtcSuffix ? `${value}Z` : value;
    const resolvedDate = new Date(normalized);
    return Number.isNaN(resolvedDate.getTime()) ? null : resolvedDate;
  }
  const resolvedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(resolvedDate.getTime()) ? null : resolvedDate;
}

function getDateParts(date: Date, timeZone: SettingsTimeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE_TO_IANA[timeZone],
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return {
    year: padDatePart(year),
    month: padDatePart(month),
    day: padDatePart(day),
  };
}

function formatNumericDate(
  date: Date,
  preferences: FormattingPreferences,
  includeYear: boolean,
) {
  const parts = getDateParts(date, preferences.timeZone);

  if (preferences.dateFormat === "DD/MM/YYYY") {
    return includeYear
      ? `${parts.day}/${parts.month}/${parts.year}`
      : `${parts.day}/${parts.month}`;
  }

  if (preferences.dateFormat === "YYYY-MM-DD") {
    return includeYear
      ? `${parts.year}-${parts.month}-${parts.day}`
      : `${parts.month}-${parts.day}`;
  }

  return includeYear
    ? `${parts.month}/${parts.day}/${parts.year}`
    : `${parts.month}/${parts.day}`;
}

function formatLocalizedTime(date: Date, preferences: FormattingPreferences) {
  return new Intl.DateTimeFormat(resolveLocale(preferences.language), {
    timeZone: TIME_ZONE_TO_IANA[preferences.timeZone],
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function isSupportedCountry(value: unknown): value is SettingsCountry {
  return isSupportedStringValue(value, SETTINGS_COUNTRY_OPTIONS);
}

export function isSupportedTimeZone(value: unknown): value is SettingsTimeZone {
  return isSupportedStringValue(value, SETTINGS_TIME_ZONE_OPTIONS);
}

export function isSupportedLanguage(value: unknown): value is SettingsLanguage {
  return isSupportedStringValue(value, SETTINGS_LANGUAGE_OPTIONS);
}

export function isSupportedDateFormat(value: unknown): value is SettingsDateFormat {
  return isSupportedStringValue(value, SETTINGS_DATE_FORMAT_OPTIONS);
}

export function getDefaultCountry(): SettingsCountry {
  return SETTINGS_COUNTRY_OPTIONS[0];
}

function detectBrowserTimeZone(): SettingsTimeZone {
  const ianaEntries = Object.entries(TIME_ZONE_TO_IANA) as [
    SettingsTimeZone,
    string,
  ][];

  // 1. Direct IANA match — works when the browser timezone is one of our
  //    supported zones (e.g. user is already on "Asia/Almaty")
  const browserIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const direct = ianaEntries.find(([, iana]) => iana === browserIana);
  if (direct) return direct[0];

  // 2. Closest by current UTC offset (handles all other IANA zones)
  //    JS getTimezoneOffset() = minutes WEST of UTC  →  negate for east
  const browserOffsetMin = -new Date().getTimezoneOffset();

  const getIanaOffsetMin = (iana: string): number => {
    // Use a fixed UTC reference so DST doesn't matter for comparison
    const ref = new Date("2024-07-15T12:00:00Z");
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(ref);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    // ref is 12:00 UTC; if local shows 17:00 → offset = +5 h east = +300 min
    const normalizedH = h >= 24 ? h - 24 : h;
    return (normalizedH - 12) * 60 + m;
  };

  let best: SettingsTimeZone = DEFAULT_FORMATTING_PREFERENCES.timeZone;
  let bestDiff = Infinity;
  for (const [tz, iana] of ianaEntries) {
    try {
      const diff = Math.abs(getIanaOffsetMin(iana) - browserOffsetMin);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = tz;
      }
    } catch {
      // ignore unsupported zones
    }
  }
  return best;
}

export function getDefaultTimeZone(): SettingsTimeZone {
  try {
    return detectBrowserTimeZone();
  } catch {
    return DEFAULT_FORMATTING_PREFERENCES.timeZone;
  }
}

export function getDefaultLanguage(): SettingsLanguage {
  return DEFAULT_FORMATTING_PREFERENCES.language;
}

export function getDefaultDateFormat(): SettingsDateFormat {
  return DEFAULT_FORMATTING_PREFERENCES.dateFormat;
}

export function normalizeCountry(
  value: unknown,
  fallback: SettingsCountry,
): SettingsCountry {
  return isSupportedCountry(value) ? value : fallback;
}

export function normalizeTimeZone(
  value: unknown,
  fallback: SettingsTimeZone,
): SettingsTimeZone {
  return isSupportedTimeZone(value) ? value : fallback;
}

export function normalizeLanguage(
  value: unknown,
  fallback: SettingsLanguage,
): SettingsLanguage {
  if (value === "en") {
    return "English";
  }

  if (value === "kk") {
    return "Kazakh";
  }

  if (value === "ru") {
    return "Russian";
  }

  return isSupportedLanguage(value) ? value : fallback;
}

export function normalizeDateFormat(
  value: unknown,
  fallback: SettingsDateFormat,
): SettingsDateFormat {
  return isSupportedDateFormat(value) ? value : fallback;
}

export function resolveLocale(language: SettingsLanguage) {
  return LANGUAGE_TO_LOCALE[language];
}

export function resolveDocumentLanguage(language: SettingsLanguage) {
  return LANGUAGE_TO_DOCUMENT_LANG[language];
}

export function syncFormattingPreferences(next: FormattingPreferences) {
  currentFormattingPreferences = next;
}

export function formatCurrentDate(
  value: string | Date,
  options?: {
    includeYear?: boolean;
  },
) {
  const resolvedDate = resolveDate(value);

  if (!resolvedDate) {
    return "Invalid date";
  }

  return formatNumericDate(
    resolvedDate,
    currentFormattingPreferences,
    options?.includeYear ?? true,
  );
}

export function formatCurrentDateTime(value: string | Date) {
  const resolvedDate = resolveDate(value);

  if (!resolvedDate) {
    return "Invalid date";
  }

  return `${formatNumericDate(
    resolvedDate,
    currentFormattingPreferences,
    true,
  )} · ${formatLocalizedTime(resolvedDate, currentFormattingPreferences)}`;
}

export function formatCurrentShortDate(value: string | Date) {
  const resolvedDate = resolveDate(value);

  if (!resolvedDate) {
    return "Invalid date";
  }

  return formatNumericDate(
    resolvedDate,
    currentFormattingPreferences,
    false,
  );
}
