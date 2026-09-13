const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1,
  janv: 1,
  jan: 1,
  fevrier: 2,
  fevr: 2,
  fev: 2,
  mars: 3,
  mar: 3,
  avril: 4,
  avr: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  juil: 7,
  aout: 8,
  septembre: 9,
  sept: 9,
  sep: 9,
  octobre: 10,
  oct: 10,
  novembre: 11,
  nov: 11,
  decembre: 12,
  dec: 12,
};

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim();
  } catch {
    return value.replace(/\+/g, " ").trim();
  }
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMonthToken(token: string): string {
  return removeAccents(token.toLowerCase()).replace(/\./g, "");
}

function isValidDateParts(
  date: Date,
  year: number,
  month: number,
  day: number,
): boolean {
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function applyBoundary(date: Date, boundary: "start" | "end"): Date {
  const result = new Date(date);

  if (boundary === "start") {
    result.setHours(0, 0, 0, 0);
  } else {
    result.setHours(23, 59, 59, 999);
  }

  return result;
}

function parseFromParts(
  day: number,
  month: number,
  year: number,
  boundary: "start" | "end",
): Date | null {
  const date = new Date(year, month - 1, day);

  if (!isValidDateParts(date, year, month, day)) {
    return null;
  }

  return applyBoundary(date, boundary);
}

function parseIsoLike(value: string, boundary: "start" | "end"): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) && !value.includes("T")) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return applyBoundary(date, boundary);
}

function parseNumericDate(
  value: string,
  boundary: "start" | "end",
): Date | null {
  const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  return parseFromParts(day, month, year, boundary);
}

function parseFrenchTextDate(
  value: string,
  boundary: "start" | "end",
): Date | null {
  const normalized = normalizeSpaces(removeAccents(value.toLowerCase()));
  const match = normalized.match(/^(\d{1,2})\s+([a-z.]+)\s+(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const monthWord = normalizeMonthToken(match[2]);
  const year = Number.parseInt(match[3], 10);
  const month = FRENCH_MONTHS[monthWord];

  if (!month) {
    return null;
  }

  return parseFromParts(day, month, year, boundary);
}

export function parseFrenchDate(
  raw: string,
  boundary: "start" | "end" = "start",
): Date | null {
  const cleaned = normalizeSpaces(decodeParam(raw));
  if (!cleaned) {
    return null;
  }

  const parsers = [
    () => parseIsoLike(cleaned, boundary),
    () => parseFrenchTextDate(cleaned, boundary),
    () => parseNumericDate(cleaned, boundary),
  ];

  for (const parser of parsers) {
    const parsed = parser();
    if (parsed) {
      return parsed;
    }
  }

  const fallback = new Date(cleaned);
  if (!Number.isNaN(fallback.getTime())) {
    return applyBoundary(fallback, boundary);
  }

  return null;
}

export function parseFrenchDateParam(
  raw: string,
  label: "in" | "out",
): { ok: true; date: Date } | { ok: false; error: string } {
  const boundary = label === "in" ? "start" : "end";
  const parsed = parseFrenchDate(raw, boundary);

  if (!parsed) {
    return {
      ok: false,
      error: `Impossible de lire la date « ${decodeParam(raw)} » (${label}). Formats acceptés : « 1 sept. 2026 », « 30 août 2026 » ou ISO.`,
    };
  }

  return { ok: true, date: parsed };
}
