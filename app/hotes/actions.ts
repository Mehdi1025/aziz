"use server";

/**
 * Server Actions pour l'espace hôte (/hotes).
 * Prêtes à être branchées sur la BDD — réutilisent la logique admin existante.
 */

import {
  addKeyDeposit as adminAddKeyDeposit,
  createClientPassFromKey as adminCreateClientPassFromKey,
  depositKeyInLocker as adminDepositKeyInLocker,
} from "@/app/admin/landlord-actions";
import type { LandlordGuestReservationRow } from "@/lib/landlord-guest-types";
import { prisma } from "@/lib/prisma";

export async function addKeyDeposit(input: {
  landlordId: string;
  propertyLabel: string;
  propertyAddress?: string;
  notes?: string;
}) {
  return adminAddKeyDeposit(input);
}

export async function depositKeyInLocker(input: {
  keyId: string;
  distributorId: string;
  boxNumber: number;
}) {
  return adminDepositKeyInLocker(input);
}

export async function createClientPassFromKey(input: {
  keyId: string;
  code: string;
  in: string;
  out: string;
}) {
  return adminCreateClientPassFromKey(input);
}

/** Multi-tenant : réservations rattachées aux clés de l'hôte uniquement. */
export async function getLandlordReservations(
  landlordId: string,
): Promise<LandlordGuestReservationRow[]> {
  const rows = await prisma.reservation.findMany({
    where: {
      keyDeposit: { landlordId },
    },
    include: {
      keyDeposit: {
        select: { propertyLabel: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    guestName: row.guestName,
    guestsCount: row.guestsCount,
    checkIn: row.checkIn.toISOString(),
    checkOut: row.checkOut.toISOString(),
    isUsed: row.isUsed,
    propertyLabel: row.keyDeposit?.propertyLabel ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
