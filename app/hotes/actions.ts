"use server";

import {
  addKeyDeposit as adminAddKeyDeposit,
  createClientPassFromKey as adminCreateClientPassFromKey,
  depositKeyInLocker as adminDepositKeyInLocker,
  getLandlords,
  getSubscriptionPlans,
} from "@/app/admin/landlord-actions";
import type { HostDistributorOption } from "@/components/landlord/mock-landlord-data";
import {
  MOCK_HOST_DISTRIBUTORS,
  MOCK_LANDLORD_DASHBOARD,
} from "@/components/landlord/mock-landlord-data";
import type { LandlordDashboardData } from "@/components/landlord/mock-landlord-data";
import { DEFAULT_DEMO_HOST_EMAIL } from "@/lib/host-config";
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
      distributor: {
        include: { city: true },
      },
      keyDeposit: {
        select: {
          propertyLabel: true,
          propertyAddress: true,
        },
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
    propertyAddress: row.keyDeposit?.propertyAddress ?? null,
    boxNumber: row.boxNumber,
    distributorName: row.distributor.name,
    distributorSlug: row.distributor.slug,
    cityName: row.distributor.city.name,
    createdAt: row.createdAt.toISOString(),
    scannedAt: row.scannedAt?.toISOString() ?? null,
  }));
}

export async function refreshGuestReservations(
  landlordId: string,
): Promise<LandlordGuestReservationRow[]> {
  return getLandlordReservations(landlordId);
}

async function getHostDistributorsFromDb(): Promise<HostDistributorOption[]> {
  const now = new Date();
  const distributors = await prisma.distributor.findMany({
    where: { isActive: true },
    include: {
      city: true,
      reservations: {
        where: { checkOut: { gte: now }, isUsed: false },
        select: { boxNumber: true },
      },
    },
    orderBy: { name: "asc" },
    take: 30,
  });

  if (distributors.length === 0) {
    return MOCK_HOST_DISTRIBUTORS;
  }

  return distributors.map((d) => {
    const occupied = new Set(d.reservations.map((r) => r.boxNumber));
    const availableBoxes: number[] = [];
    for (let i = 1; i <= d.totalBoxes; i++) {
      if (!occupied.has(i)) availableBoxes.push(i);
    }
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      cityName: d.city.name,
      address: d.address ?? "",
      availableBoxes: availableBoxes.length > 0 ? availableBoxes : [1],
    };
  });
}

/** Charge l'hôte depuis Turso (fallback mock si indisponible). */
export async function getHostDashboardData(): Promise<{
  data: LandlordDashboardData;
  isFromDatabase: boolean;
}> {
  try {
    const [landlords, plans, distributors] = await Promise.all([
      getLandlords(),
      getSubscriptionPlans(),
      getHostDistributorsFromDb(),
    ]);

    const landlord =
      landlords.find((l) => l.email === DEFAULT_DEMO_HOST_EMAIL) ?? landlords[0];

    if (!landlord) {
      return { data: MOCK_LANDLORD_DASHBOARD, isFromDatabase: false };
    }

    return {
      data: { landlord, plans, distributors },
      isFromDatabase: true,
    };
  } catch {
    return { data: MOCK_LANDLORD_DASHBOARD, isFromDatabase: false };
  }
}
