import type { ActivityLogRow } from "@/lib/activity-log-shared";
import {
  computeDistributorStats,
  getBoxNumbersForDistributor,
  isBoxOccupied,
  type ReservationRow,
} from "@/lib/admin-utils";
import type { DistributorRow } from "@/lib/network-types";

export type AnomalyType =
  | "BLOCKED_LOCKER"
  | "SCAN_REFUSED"
  | "DISTRIBUTOR_OFFLINE"
  | "OCCUPANCY_PEAK";

export type AnomalySeverity = "warning" | "critical";

export type NetworkAnomaly = {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  distributorId: string;
  distributorName: string;
  cityName: string;
  departmentCode: string;
  latitude: number;
  longitude: number;
  boxNumber?: number;
  createdAt?: string;
};

export const ANOMALY_META: Record<
  AnomalyType,
  { label: string; shortLabel: string; color: string; glow: string }
> = {
  BLOCKED_LOCKER: {
    label: "Casier bloqué",
    shortLabel: "Bloqué",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.45)",
  },
  SCAN_REFUSED: {
    label: "Scan refusé",
    shortLabel: "Refusé",
    color: "#ef4444",
    glow: "rgba(239,68,68,0.45)",
  },
  DISTRIBUTOR_OFFLINE: {
    label: "Hors ligne",
    shortLabel: "Offline",
    color: "#71717a",
    glow: "rgba(113,113,122,0.45)",
  },
  OCCUPANCY_PEAK: {
    label: "Pic d'occupation",
    shortLabel: "Saturation",
    color: "#f97316",
    glow: "rgba(249,115,22,0.45)",
  },
};

const SCAN_REFUSED_WINDOW_MS = 24 * 60 * 60 * 1000;
const OCCUPANCY_WARNING_RATIO = 0.85;
const OCCUPANCY_CRITICAL_RATIO = 1;

type DetectAnomaliesOptions = {
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  activityLogs: ActivityLogRow[];
  now?: Date;
};

function hasGeo(distributor: DistributorRow): boolean {
  return Number.isFinite(distributor.latitude) && Number.isFinite(distributor.longitude);
}

export function detectNetworkAnomalies({
  distributors,
  reservations,
  activityLogs,
  now = new Date(),
}: DetectAnomaliesOptions): NetworkAnomaly[] {
  const anomalies: NetworkAnomaly[] = [];
  const scanCutoff = now.getTime() - SCAN_REFUSED_WINDOW_MS;

  for (const distributor of distributors) {
    if (!hasGeo(distributor)) continue;

    if (!distributor.isActive) {
      anomalies.push({
        id: `offline-${distributor.id}`,
        type: "DISTRIBUTOR_OFFLINE",
        severity: "critical",
        title: "Distributeur hors ligne",
        description: `${distributor.cityName} · ${distributor.name} ne répond plus`,
        distributorId: distributor.id,
        distributorName: distributor.name,
        cityName: distributor.cityName,
        departmentCode: distributor.departmentCode,
        latitude: distributor.latitude,
        longitude: distributor.longitude,
      });
      continue;
    }

    const stats = computeDistributorStats(distributor, reservations, now);
    const occupancyRatio =
      stats.totalBoxes > 0 ? stats.occupiedBoxes / stats.totalBoxes : 0;

    if (occupancyRatio >= OCCUPANCY_WARNING_RATIO) {
      anomalies.push({
        id: `occupancy-${distributor.id}`,
        type: "OCCUPANCY_PEAK",
        severity: occupancyRatio >= OCCUPANCY_CRITICAL_RATIO ? "critical" : "warning",
        title:
          occupancyRatio >= OCCUPANCY_CRITICAL_RATIO
            ? "Saturation totale"
            : "Pic d'occupation",
        description: `${stats.occupiedBoxes}/${stats.totalBoxes} casiers occupés · ${distributor.name}`,
        distributorId: distributor.id,
        distributorName: distributor.name,
        cityName: distributor.cityName,
        departmentCode: distributor.departmentCode,
        latitude: distributor.latitude,
        longitude: distributor.longitude,
      });
    }

    const distributorReservations = reservations.filter(
      (reservation) => reservation.distributorId === distributor.id,
    );

    for (const boxNumber of getBoxNumbersForDistributor(distributor)) {
      const expiredUnused = distributorReservations.find(
        (reservation) =>
          reservation.boxNumber === boxNumber &&
          !reservation.isUsed &&
          new Date(reservation.validTo) < now,
      );

      if (expiredUnused) {
        anomalies.push({
          id: `blocked-${distributor.id}-${boxNumber}`,
          type: "BLOCKED_LOCKER",
          severity: "warning",
          title: `Casier ${boxNumber} bloqué`,
          description: `Pass expiré non récupéré · ${distributor.cityName}`,
          distributorId: distributor.id,
          distributorName: distributor.name,
          cityName: distributor.cityName,
          departmentCode: distributor.departmentCode,
          latitude: distributor.latitude,
          longitude: distributor.longitude,
          boxNumber,
          createdAt: expiredUnused.validTo,
        });
      }
    }
  }

  for (const log of activityLogs) {
    if (log.type !== "SCAN_FAILED") continue;
    if (new Date(log.createdAt).getTime() < scanCutoff) continue;
    if (!log.distributorId) continue;

    const distributor = distributors.find((item) => item.id === log.distributorId);
    if (!distributor || !hasGeo(distributor)) continue;

    anomalies.push({
      id: `scan-${log.id}`,
      type: "SCAN_REFUSED",
      severity: "critical",
      title: "Scan refusé",
      description: log.details ?? `Tentative invalide · ${distributor.name}`,
      distributorId: distributor.id,
      distributorName: distributor.name,
      cityName: distributor.cityName,
      departmentCode: distributor.departmentCode,
      latitude: distributor.latitude,
      longitude: distributor.longitude,
      boxNumber: log.boxNumber ?? undefined,
      createdAt: log.createdAt,
    });
  }

  const severityRank: Record<AnomalySeverity, number> = {
    critical: 0,
    warning: 1,
  };

  return anomalies.sort((a, b) => {
    const severityDiff = severityRank[a.severity] - severityRank[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });
}

export function countAnomaliesByType(anomalies: NetworkAnomaly[]): Record<AnomalyType, number> {
  return anomalies.reduce(
    (acc, anomaly) => {
      acc[anomaly.type] += 1;
      return acc;
    },
    {
      BLOCKED_LOCKER: 0,
      SCAN_REFUSED: 0,
      DISTRIBUTOR_OFFLINE: 0,
      OCCUPANCY_PEAK: 0,
    },
  );
}

export function bearingDegrees(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function ringPosition(
  width: number,
  height: number,
  angleDeg: number,
  inset = 18,
): { x: number; y: number } {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2 - inset;
  const ry = height / 2 - inset;
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + rx * Math.sin(rad),
    y: cy - ry * Math.cos(rad),
  };
}

export function spreadRingAngles(
  anomalies: NetworkAnomaly[],
  centerLat: number,
  centerLng: number,
) {
  const minGap = 22;
  const items = anomalies.map((anomaly) => ({
    anomaly,
    angle: bearingDegrees(centerLat, centerLng, anomaly.latitude, anomaly.longitude),
  }));

  items.sort((a, b) => a.angle - b.angle);

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const current = items[i];
    if (current.angle - prev.angle < minGap) {
      current.angle = prev.angle + minGap;
    }
  }

  if (items.length > 1) {
    const first = items[0];
    const last = items[items.length - 1];
    const wrap = 360 - last.angle + first.angle;
    if (wrap < minGap) {
      const shift = (minGap - wrap) / 2;
      for (const item of items) {
        item.angle = (item.angle + shift) % 360;
      }
    }
  }

  return items;
}

export function isDistributorInAnomalyState(
  distributorId: string,
  reservations: ReservationRow[],
  now = new Date(),
): boolean {
  return reservations.some(
    (reservation) =>
      reservation.distributorId === distributorId &&
      isBoxOccupied(reservation.boxNumber, distributorId, reservations, now),
  );
}
