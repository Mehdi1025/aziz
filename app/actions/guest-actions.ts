"use server";

import { resolveDistributorSlugWithLegacy } from "@/lib/network";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { prisma } from "@/lib/prisma";

export type RegisterGuestFromLinkInput = {
  code: string;
  in: string;
  out: string;
  box: string;
  site?: string;
  name?: string;
  guests?: string;
  keyId?: string;
};

export type RegisterGuestFromLinkResult =
  | {
      ok: true;
      code: string;
      boxNumber: number;
      distributorName: string;
      cityName: string;
    }
  | { ok: false; error: string };

function parseGuestsCount(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const value = Number.parseInt(raw.trim(), 10);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

export async function registerGuestFromLink(
  data: RegisterGuestFromLinkInput,
): Promise<RegisterGuestFromLinkResult> {
  const code = data.code?.trim();
  const inRaw = data.in?.trim();
  const outRaw = data.out?.trim();
  const boxRaw = data.box?.trim();

  if (!code || !inRaw || !outRaw || !boxRaw) {
    return { ok: false, error: "Paramètres de réservation incomplets." };
  }

  const boxNumber = Number.parseInt(boxRaw, 10);
  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return { ok: false, error: "Numéro de casier invalide." };
  }

  const checkInResult = parseFrenchDateParam(inRaw, "in");
  if (!checkInResult.ok) {
    return { ok: false, error: checkInResult.error };
  }

  const checkOutResult = parseFrenchDateParam(outRaw, "out");
  if (!checkOutResult.ok) {
    return { ok: false, error: checkOutResult.error };
  }

  if (checkOutResult.date <= checkInResult.date) {
    return {
      ok: false,
      error: "La date de départ doit être postérieure à la date d'arrivée.",
    };
  }

  const guestName = data.name?.trim() || null;
  const guestsCount = parseGuestsCount(data.guests);

  let distributorId: string;
  let distributorName: string;
  let cityName: string;
  let resolvedBoxNumber = boxNumber;
  let keyDepositId: string | null = null;

  if (data.keyId?.trim()) {
    try {
      const keyDeposit = await prisma.keyDeposit.findUnique({
        where: { id: data.keyId.trim() },
        include: {
          distributor: { include: { city: true } },
        },
      });

      if (keyDeposit?.distributorId && keyDeposit.distributor && keyDeposit.boxNumber) {
        keyDepositId = keyDeposit.id;
        distributorId = keyDeposit.distributorId;
        distributorName = keyDeposit.distributor.name;
        cityName = keyDeposit.distributor.city.name;
        resolvedBoxNumber = keyDeposit.boxNumber;
      } else {
        const distributor = await resolveDistributorSlugWithLegacy(data.site);
        if (resolvedBoxNumber > distributor.totalBoxes) {
          return {
            ok: false,
            error: `Casier ${resolvedBoxNumber} invalide pour ${distributor.name}.`,
          };
        }
        distributorId = distributor.id;
        distributorName = distributor.name;
        cityName = distributor.cityName;
      }
    } catch {
      const distributor = await resolveDistributorSlugWithLegacy(data.site);
      if (resolvedBoxNumber > distributor.totalBoxes) {
        return {
          ok: false,
          error: `Casier ${resolvedBoxNumber} invalide pour ${distributor.name}.`,
        };
      }
      distributorId = distributor.id;
      distributorName = distributor.name;
      cityName = distributor.cityName;
    }
  } else {
    try {
      const distributor = await resolveDistributorSlugWithLegacy(data.site);
      if (resolvedBoxNumber > distributor.totalBoxes) {
        return {
          ok: false,
          error: `Casier ${resolvedBoxNumber} invalide pour ${distributor.name}.`,
        };
      }
      distributorId = distributor.id;
      distributorName = distributor.name;
      cityName = distributor.cityName;
    } catch {
      return { ok: false, error: "Distributeur introuvable." };
    }
  }

  try {
    const reservation = await prisma.reservation.upsert({
      where: { code },
      create: {
        code,
        guestName,
        guestsCount,
        checkIn: checkInResult.date,
        checkOut: checkOutResult.date,
        distributorId,
        boxNumber: resolvedBoxNumber,
        keyDepositId,
        isUsed: false,
      },
      update: {
        guestName: guestName ?? undefined,
        guestsCount: guestsCount ?? undefined,
        checkIn: checkInResult.date,
        checkOut: checkOutResult.date,
        distributorId,
        boxNumber: resolvedBoxNumber,
        ...(keyDepositId ? { keyDepositId } : {}),
      },
      include: {
        distributor: { include: { city: true } },
      },
    });

    return {
      ok: true,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      distributorName: reservation.distributor.name,
      cityName: reservation.distributor.city.name,
    };
  } catch {
    return {
      ok: false,
      error: "Impossible d'enregistrer la réservation.",
    };
  }
}
