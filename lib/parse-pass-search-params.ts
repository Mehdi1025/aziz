import { parseFrenchDateParam } from "@/lib/parse-french-date";
import type { ParsedPassParams, ReservationCaptureData } from "@/lib/reservation-capture-types";

export function parsePassSearchParams(input: {
  code?: string;
  in?: string;
  out?: string;
  box?: string;
  site?: string;
  name?: string;
  guests?: string;
  keyId?: string;
}): ParsedPassParams {
  const code = input.code?.trim();
  const inRaw = input.in?.trim();
  const outRaw = input.out?.trim();
  const boxRaw = input.box?.trim();

  const missing: string[] = [];
  if (!code) missing.push("code");
  if (!inRaw) missing.push("in");
  if (!outRaw) missing.push("out");
  if (!boxRaw) missing.push("box");

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Paramètres manquants : ${missing.join(", ")}.`,
    };
  }

  const boxNumber = Number.parseInt(boxRaw!, 10);
  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return { ok: false, error: "Le paramètre box doit être un entier positif." };
  }

  const checkInResult = parseFrenchDateParam(inRaw!, "in");
  if (!checkInResult.ok) {
    return { ok: false, error: checkInResult.error };
  }

  const checkOutResult = parseFrenchDateParam(outRaw!, "out");
  if (!checkOutResult.ok) {
    return { ok: false, error: checkOutResult.error };
  }

  if (checkOutResult.date <= checkInResult.date) {
    return {
      ok: false,
      error: "La date de fin (out) doit être postérieure à la date de début (in).",
    };
  }

  const data: ReservationCaptureData = {
    code: code!,
    in: inRaw!,
    out: outRaw!,
    box: String(boxNumber),
    site: input.site?.trim() || undefined,
    name: input.name?.trim() || undefined,
    guests: input.guests?.trim() || undefined,
    keyId: input.keyId?.trim() || undefined,
  };

  return { ok: true, data, boxNumber };
}
