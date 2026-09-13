import {
  getActiveReservation,
  getBoxNumbersForDistributor,
  type ReservationRow,
} from "@/lib/admin-utils";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import type { DistributorRow } from "@/lib/network-types";
import {
  isAllCitiesFilter,
  isAllDistributorsFilter,
} from "@/lib/network-types";

export type BoxStatus = "free" | "occupied" | "blocked";

export type LiveBoxCell = {
  id: string;
  boxNumber: number;
  distributorId: string;
  distributorName: string;
  distributorSlug: string;
  cityName: string;
  departmentCode: string;
  status: BoxStatus;
  reservation: ReservationRow | null;
};

export type LiveGridStats = {
  total: number;
  free: number;
  occupied: number;
  blocked: number;
};

export type BoxStatusFilter = "all" | BoxStatus;

export function getBoxStatus(
  boxNumber: number,
  distributorId: string,
  reservations: ReservationRow[],
  now = new Date(),
): { status: BoxStatus; reservation: ReservationRow | null } {
  const active = getActiveReservation(boxNumber, distributorId, reservations, now);
  if (active) {
    return { status: "occupied", reservation: active };
  }

  const blocked = reservations.find(
    (reservation) =>
      reservation.distributorId === distributorId &&
      reservation.boxNumber === boxNumber &&
      !reservation.isUsed &&
      new Date(reservation.validTo) < now,
  );

  if (blocked) {
    return { status: "blocked", reservation: blocked };
  }

  return { status: "free", reservation: null };
}

export function buildLiveGridCells(
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  cityId: string,
  distributorId: string,
  now = new Date(),
): LiveBoxCell[] {
  let scoped = distributors.filter((d) => d.isActive);

  if (!isAllCitiesFilter(cityId)) {
    scoped = scoped.filter((d) => d.cityId === cityId);
  }
  if (!isAllDistributorsFilter(distributorId)) {
    scoped = scoped.filter((d) => d.id === distributorId);
  }

  const cells: LiveBoxCell[] = [];

  for (const distributor of scoped) {
    const distributorReservations = reservations.filter(
      (reservation) => reservation.distributorId === distributor.id,
    );

    for (const boxNumber of getBoxNumbersForDistributor(distributor)) {
      const { status, reservation } = getBoxStatus(
        boxNumber,
        distributor.id,
        distributorReservations,
        now,
      );

      cells.push({
        id: `${distributor.id}-${boxNumber}`,
        boxNumber,
        distributorId: distributor.id,
        distributorName: distributor.name,
        distributorSlug: distributor.slug,
        cityName: distributor.cityName,
        departmentCode: distributor.departmentCode,
        status,
        reservation,
      });
    }
  }

  return cells;
}

export function computeLiveGridStats(cells: LiveBoxCell[]): LiveGridStats {
  return cells.reduce(
    (acc, cell) => {
      acc.total += 1;
      acc[cell.status] += 1;
      return acc;
    },
    { total: 0, free: 0, occupied: 0, blocked: 0 },
  );
}

export function filterLiveGridCells(
  cells: LiveBoxCell[],
  statusFilter: BoxStatusFilter,
): LiveBoxCell[] {
  if (statusFilter === "all") return cells;
  return cells.filter((cell) => cell.status === statusFilter);
}

export type LiveGridGroup = {
  distributorId: string;
  distributorName: string;
  cityName: string;
  departmentCode: string;
  cells: LiveBoxCell[];
};

export function groupLiveGridCells(cells: LiveBoxCell[]): LiveGridGroup[] {
  const map = new Map<string, LiveGridGroup>();

  for (const cell of cells) {
    const existing = map.get(cell.distributorId);
    if (existing) {
      existing.cells.push(cell);
      continue;
    }

    map.set(cell.distributorId, {
      distributorId: cell.distributorId,
      distributorName: cell.distributorName,
      cityName: cell.cityName,
      departmentCode: cell.departmentCode,
      cells: [cell],
    });
  }

  return Array.from(map.values());
}

export function getLivePulseKeys(
  activityLogs: ActivityLogRow[],
  windowMs = 90_000,
  now = new Date(),
): Set<string> {
  const cutoff = now.getTime() - windowMs;
  const keys = new Set<string>();

  for (const log of activityLogs) {
    if (log.type !== "SCAN" && log.type !== "REMOTE_OPEN") continue;
    if (!log.distributorId || !log.boxNumber) continue;
    if (new Date(log.createdAt).getTime() < cutoff) continue;
    keys.add(`${log.distributorId}-${log.boxNumber}`);
  }

  return keys;
}

export const BOX_STATUS_META: Record<
  BoxStatus,
  { label: string; shortLabel: string; color: string; glow: string }
> = {
  free: {
    label: "Libre",
    shortLabel: "Libre",
    color: "#10b981",
    glow: "rgba(16,185,129,0.35)",
  },
  occupied: {
    label: "Occupé",
    shortLabel: "Occupé",
    color: "#f97316",
    glow: "rgba(249,115,22,0.35)",
  },
  blocked: {
    label: "Bloqué",
    shortLabel: "Bloqué",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.35)",
  },
};
