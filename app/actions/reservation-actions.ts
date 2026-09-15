"use server";

import { resolveLegacyKeyId } from "@/lib/legacy-key-ids";
import { resolveDistributorSlugWithLegacy } from "@/lib/network";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { prisma } from "@/lib/prisma";
import type { ReservationCaptureData } from "@/lib/reservation-capture-types";

function parseGuestsCount(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const match = raw.trim().match(/\d+/);
  if (!match) return null;
  const value = Number.parseInt(match[0], 10);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

/**
 * Capture silencieuse des données voyageur (upsert par code).
 * Ne lève jamais d'exception — les erreurs sont loguées côté serveur.
 */
export async function captureReservationData(
  data: ReservationCaptureData,
): Promise<void> {
  try {
    const code = data.code?.trim();
    const inRaw = data.in?.trim();
    const outRaw = data.out?.trim();
    const boxRaw = data.box?.trim();

    if (!code || !inRaw || !outRaw || !boxRaw) {
      console.error("[captureReservationData] Paramètres incomplets.", data);
      return;
    }

    const lockerNumber = Number.parseInt(boxRaw, 10);
    if (!Number.isInteger(lockerNumber) || lockerNumber < 1) {
      console.error("[captureReservationData] box invalide.", boxRaw);
      return;
    }

    const checkInResult = parseFrenchDateParam(inRaw, "in");
    if (!checkInResult.ok) {
      console.error("[captureReservationData]", checkInResult.error);
      return;
    }

    const checkOutResult = parseFrenchDateParam(outRaw, "out");
    if (!checkOutResult.ok) {
      console.error("[captureReservationData]", checkOutResult.error);
      return;
    }

    if (checkOutResult.date <= checkInResult.date) {
      console.error("[captureReservationData] checkOut <= checkIn.");
      return;
    }

    const guestName = data.name?.trim() || null;
    const guestsCount = parseGuestsCount(data.guests);

    let distributorId: string;
    let resolvedBoxNumber = lockerNumber;
    let keyDepositId: string | null = null;

    const resolvedKeyId = resolveLegacyKeyId(data.keyId);

    if (resolvedKeyId) {
      try {
        const keyDeposit = await prisma.keyDeposit.findUnique({
          where: { id: resolvedKeyId },
          include: { distributor: true },
        });

        if (keyDeposit) {
          keyDepositId = keyDeposit.id;
          if (keyDeposit.distributorId && keyDeposit.boxNumber) {
            distributorId = keyDeposit.distributorId;
            resolvedBoxNumber = keyDeposit.boxNumber;
          } else {
            const distributor = await resolveDistributorSlugWithLegacy(data.site);
            distributorId = distributor.id;
          }
        } else {
          const distributor = await resolveDistributorSlugWithLegacy(data.site);
          distributorId = distributor.id;
        }
      } catch (keyError) {
        console.error("[captureReservationData] keyId invalide, fallback site.", keyError);
        const distributor = await resolveDistributorSlugWithLegacy(data.site);
        distributorId = distributor.id;
      }
    } else {
      const distributor = await resolveDistributorSlugWithLegacy(data.site);
      distributorId = distributor.id;
    }

    await prisma.reservation.upsert({
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
    });
  } catch (error) {
    console.error("[captureReservationData] Échec upsert Prisma.", error);
  }
}
