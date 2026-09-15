"use server";

import { revalidatePath } from "next/cache";
import { resolveDistributorSlugWithLegacy } from "@/lib/network";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { prisma } from "@/lib/prisma";

export type SavePassInput = {
  code: string;
  in: string;
  out: string;
  box: string;
  site?: string;
};

export type SavePassResult =
  | { ok: true; code: string; boxNumber: number; distributorSlug: string }
  | { ok: false; error: string };

export async function savePassReservation(
  input: SavePassInput,
): Promise<SavePassResult> {
  const code = input.code.trim();
  const boxNumber = Number.parseInt(input.box, 10);

  if (!code) {
    return { ok: false, error: "Code de réservation manquant." };
  }

  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return { ok: false, error: "Numéro de casier invalide." };
  }

  const distributor = await resolveDistributorSlugWithLegacy(input.site);
  if (boxNumber > distributor.totalBoxes) {
    return {
      ok: false,
      error: `Casier ${boxNumber} invalide pour ${distributor.cityName} ${distributor.name}.`,
    };
  }

  const validFromResult = parseFrenchDateParam(input.in, "in");
  if (!validFromResult.ok) {
    return { ok: false, error: validFromResult.error };
  }

  const validToResult = parseFrenchDateParam(input.out, "out");
  if (!validToResult.ok) {
    return { ok: false, error: validToResult.error };
  }

  if (validToResult.date <= validFromResult.date) {
    return {
      ok: false,
      error: "La date de départ doit être postérieure à la date d'arrivée.",
    };
  }

  try {
    const reservation = await prisma.reservation.upsert({
      where: { code },
      create: {
        code,
        distributorId: distributor.id,
        boxNumber,
        checkIn: validFromResult.date,
        checkOut: validToResult.date,
        isUsed: false,
      },
      update: {
        distributorId: distributor.id,
        boxNumber,
        checkIn: validFromResult.date,
        checkOut: validToResult.date,
      },
      include: { distributor: true },
    });

    revalidatePath("/pass");
    revalidatePath("/admin");

    return {
      ok: true,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      distributorSlug: reservation.distributor.slug,
    };
  } catch {
    return {
      ok: false,
      error: "Impossible d'enregistrer la réservation. Réessayez.",
    };
  }
}
