"use server";

import { revalidatePath } from "next/cache";
import { logActivity, getRecentActivityLogs } from "@/lib/activity-log";
import type { ActivityLogRow } from "@/lib/activity-log";
import type { ReservationRow } from "@/lib/admin-utils";
import { getAllCities, getAllDistributorsForAdmin, getDistributorById } from "@/lib/network";
import type { CityRow, DistributorRow } from "@/lib/network-types";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { buildPassUrl } from "@/lib/parse-reservation-link";
import { prisma } from "@/lib/prisma";

const reservationInclude = {
  distributor: { include: { city: true } },
} as const;

function mapReservation(reservation: {
  id: string;
  code: string;
  distributorId: string;
  boxNumber: number;
  validFrom: Date;
  validTo: Date;
  isUsed: boolean;
  scannedAt: Date | null;
  distributor: {
    id: string;
    slug: string;
    name: string;
    cityId: string;
    city: { id: string; slug: string; name: string; region: string };
  };
}): ReservationRow {
  return {
    id: reservation.id,
    code: reservation.code,
    distributorId: reservation.distributorId,
    distributorSlug: reservation.distributor.slug,
    distributorName: reservation.distributor.name,
    cityId: reservation.distributor.cityId,
    citySlug: reservation.distributor.city.slug,
    cityName: reservation.distributor.city.name,
    region: reservation.distributor.city.region,
    boxNumber: reservation.boxNumber,
    validFrom: reservation.validFrom.toISOString(),
    validTo: reservation.validTo.toISOString(),
    isUsed: reservation.isUsed,
    scannedAt: reservation.scannedAt?.toISOString() ?? null,
  };
}

export async function getCities(): Promise<CityRow[]> {
  return getAllCities();
}

export async function getDistributors(): Promise<DistributorRow[]> {
  return getAllDistributorsForAdmin();
}

export async function getReservations(): Promise<ReservationRow[]> {
  const reservations = await prisma.reservation.findMany({
    include: reservationInclude,
    orderBy: { validFrom: "desc" },
  });

  return reservations.map(mapReservation);
}

export async function getActivityLogs(): Promise<ActivityLogRow[]> {
  return getRecentActivityLogs(100);
}

export async function deleteReservation(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });

  if (reservation) {
    await logActivity({
      type: "DELETE",
      distributorId: reservation.distributorId,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      reservationId: reservation.id,
      details: `Suppression · ${reservation.distributor.city.name} ${reservation.distributor.name}`,
    });
  }

  await prisma.reservation.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}

export type CreateReservationInput = {
  code: string;
  in: string;
  out: string;
  box: string;
  distributorId: string;
};

export type CreateReservationResult =
  | { ok: true; passUrl: string; reservation: ReservationRow }
  | { ok: false; error: string };

export async function createReservationManual(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const code = input.code.trim();
  const boxNumber = Number.parseInt(input.box, 10);

  if (!code) {
    return { ok: false, error: "Le code est requis." };
  }

  if (!input.distributorId) {
    return { ok: false, error: "Sélectionnez un distributeur." };
  }

  const distributor = await getDistributorById(input.distributorId);
  if (!distributor) {
    return { ok: false, error: "Distributeur introuvable." };
  }

  if (!Number.isInteger(boxNumber) || boxNumber < 1) {
    return { ok: false, error: "Le numéro de casier doit être un entier positif." };
  }

  if (boxNumber > distributor.totalBoxes) {
    return {
      ok: false,
      error: `Ce distributeur ne possède que ${distributor.totalBoxes} casier${distributor.totalBoxes > 1 ? "s" : ""}.`,
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
      error: "La date de fin doit être postérieure à la date de début.",
    };
  }

  try {
    const reservation = await prisma.reservation.upsert({
      where: { code },
      create: {
        code,
        distributorId: distributor.id,
        boxNumber,
        validFrom: validFromResult.date,
        validTo: validToResult.date,
        isUsed: false,
      },
      update: {
        distributorId: distributor.id,
        boxNumber,
        validFrom: validFromResult.date,
        validTo: validToResult.date,
      },
      include: reservationInclude,
    });

    await logActivity({
      type: "MANUAL_CREATE",
      distributorId: reservation.distributorId,
      code: reservation.code,
      boxNumber: reservation.boxNumber,
      reservationId: reservation.id,
      details: `Création manuelle · ${distributor.cityName} ${distributor.name}`,
    });

    revalidatePath("/admin");
    revalidatePath("/pass");

    return {
      ok: true,
      passUrl: buildPassUrl({
        code,
        in: input.in.trim(),
        out: input.out.trim(),
        box: String(boxNumber),
        site: distributor.slug,
      }),
      reservation: mapReservation(reservation),
    };
  } catch {
    return { ok: false, error: "Impossible de créer la réservation." };
  }
}

export async function remoteOpenBox(code: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { code },
    include: reservationInclude,
  });

  if (!reservation) {
    return { ok: false as const, error: "Code invalide", status: 404 };
  }

  const now = new Date();
  if (now < reservation.validFrom || now > reservation.validTo) {
    return {
      ok: false as const,
      error: "Hors des dates de validité",
      status: 403,
    };
  }

  await prisma.reservation.update({
    where: { code },
    data: { isUsed: true, scannedAt: now },
  });

  await logActivity({
    type: "REMOTE_OPEN",
    distributorId: reservation.distributorId,
    code: reservation.code,
    boxNumber: reservation.boxNumber,
    reservationId: reservation.id,
    details: `Ouverture à distance · ${reservation.distributor.city.name} ${reservation.distributor.name}`,
  });

  revalidatePath("/admin");

  return {
    ok: true as const,
    openBox: reservation.boxNumber,
    distributorSlug: reservation.distributor.slug,
    distributorName: reservation.distributor.name,
    cityName: reservation.distributor.city.name,
    code: reservation.code,
  };
}
