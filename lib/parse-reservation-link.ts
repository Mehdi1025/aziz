import { parseFrenchDateParam } from "@/lib/parse-french-date";

export type ParsedReservationLink =
  | {
      ok: true;
      code: string;
      in: string;
      out: string;
      box: string;
      site: string | null;
      passUrl: string;
    }
  | { ok: false; error: string };

function cleanInput(input: string): string {
  return input.trim().replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ");
}

function fixSpacesInUrl(url: string): string {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) {
    return url;
  }

  const base = url.slice(0, queryIndex + 1);
  const query = url.slice(queryIndex + 1);
  return base + query.replace(/ /g, "%20");
}

function extractQueryString(input: string): string {
  const cleaned = cleanInput(input);

  if (cleaned.startsWith("http")) {
    try {
      const url = new URL(fixSpacesInUrl(cleaned));
      return url.search.slice(1);
    } catch {
      const queryIndex = cleaned.indexOf("?");
      if (queryIndex !== -1) {
        return cleaned.slice(queryIndex + 1);
      }
    }
  }

  const queryIndex = cleaned.indexOf("?");
  if (queryIndex !== -1) {
    return cleaned.slice(queryIndex + 1);
  }

  if (/code=/i.test(cleaned)) {
    return cleaned.startsWith("?") ? cleaned.slice(1) : cleaned;
  }

  return cleaned;
}

function decodeQueryValue(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).trim();
  } catch {
    return value.replace(/\+/g, " ").trim();
  }
}

function parseLooseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleaned = queryString.trim().replace(/^\?/, "");

  for (const segment of cleaned.split("&")) {
    if (!segment) continue;

    const equalIndex = segment.indexOf("=");
    if (equalIndex === -1) continue;

    const key = decodeQueryValue(segment.slice(0, equalIndex)).toLowerCase();
    const value = decodeQueryValue(segment.slice(equalIndex + 1));

    if (key) {
      params[key] = value;
    }
  }

  return params;
}

export function buildPassUrl(params: {
  code: string;
  in: string;
  out: string;
  box: string;
  site?: string;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("code", params.code);
  searchParams.set("in", params.in);
  searchParams.set("out", params.out);
  searchParams.set("box", params.box);
  if (params.site) {
    searchParams.set("site", params.site);
  }
  return `/pass?${searchParams.toString()}`;
}

export function buildExamplePassLink(origin = "", site = "paris-opera"): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams({
    code: "HMNCWQN8DM",
    in: "1 sept. 2026",
    out: "2 sept. 2026",
    box: "1",
    site,
  });
  return `${base}/pass?${params.toString()}`;
}

function detectWrongLinkType(input: string, origin?: string): string | null {
  const cleaned = cleanInput(input);

  if (!cleaned.includes("code=") && !cleaned.includes("?")) {
    if (/\/recuperer\/?$/i.test(cleaned)) {
      const example = origin ? buildExamplePassLink(origin) : "/pass?code=DEMO-CLIENT&in=1 sept. 2026&out=5 sept. 2026&box=2";
      return `Ce lien pointe vers la page /recuperer, pas vers votre pass. Collez un lien qui contient /pass?code=...&in=...&out=...&box=... — par exemple : ${example}`;
    }

    return "Ce lien ne contient aucun paramètre de réservation. Il doit inclure code, in, out et box dans l'URL.";
  }

  if (/\/recuperer/i.test(cleaned) && !/code=/i.test(cleaned)) {
    const example = origin ? buildExamplePassLink(origin) : "/pass?code=...";
    return `Lien incorrect : vous avez collé l'adresse de cette page. Collez le lien /pass reçu par e-mail ou message, par exemple : ${example}`;
  }

  return null;
}

export function parseReservationLink(
  input: string,
  origin?: string,
): ParsedReservationLink {
  if (!input.trim()) {
    return {
      ok: false,
      error: "Collez le lien complet de votre réservation Airbnb.",
    };
  }

  const wrongLinkError = detectWrongLinkType(input, origin);
  if (wrongLinkError) {
    return { ok: false, error: wrongLinkError };
  }

  const queryString = extractQueryString(input);
  const params = parseLooseQueryString(queryString);

  const code = params.code;
  const inDate = params.in;
  const outDate = params.out;
  const box = params.box;
  const site = params.site?.trim().toLowerCase() || null;

  const missing: string[] = [];
  if (!code) missing.push("code");
  if (!inDate) missing.push("in");
  if (!outDate) missing.push("out");
  if (!box) missing.push("box");

  if (missing.length > 0) {
    const example = origin
      ? buildExamplePassLink(origin)
      : "/pass?code=DEMO-CLIENT&in=1 sept. 2026&out=5 sept. 2026&box=2";

    return {
      ok: false,
      error: `Lien incomplet : paramètre${missing.length > 1 ? "s" : ""} manquant${missing.length > 1 ? "s" : ""} (${missing.join(", ")}). Exemple valide : ${example}`,
    };
  }

  const boxNumber = Number.parseInt(box, 10);
  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return {
      ok: false,
      error: "Le numéro de casier (box) doit être un entier positif.",
    };
  }

  const validFromResult = parseFrenchDateParam(inDate, "in");
  if (!validFromResult.ok) {
    return { ok: false, error: validFromResult.error };
  }

  const validToResult = parseFrenchDateParam(outDate, "out");
  if (!validToResult.ok) {
    return { ok: false, error: validToResult.error };
  }

  if (validToResult.date <= validFromResult.date) {
    return {
      ok: false,
      error: "La date de départ doit être postérieure à la date d'arrivée.",
    };
  }

  return {
    ok: true,
    code,
    in: inDate,
    out: outDate,
    box: String(boxNumber),
    site,
    passUrl: buildPassUrl({
      code,
      in: inDate,
      out: outDate,
      box: String(boxNumber),
      site: site ?? undefined,
    }),
  };
}
