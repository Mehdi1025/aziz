import type { ActivityLogRow } from "@/lib/activity-log-shared";
import {
  computeDistributorStats,
  computeKpis,
  type ReservationRow,
} from "@/lib/admin-utils";
import {
  detectNetworkAnomalies,
  type NetworkAnomaly,
} from "@/lib/anomaly-radar";
import type { CityRow, DistributorRow } from "@/lib/network-types";

export type ActionPriority = "critical" | "urgent" | "attention" | "info";

export type ActionStatus = "todo" | "in_progress" | "done";

export type ControlTowerAction = {
  id: string;
  priority: ActionPriority;
  status: ActionStatus;
  title: string;
  description: string;
  impact: string;
  slaLabel: string;
  assignee: string | null;
  distributorId?: string;
  cityName?: string;
  region?: string;
  suggestedCta: string;
  anomalyId?: string;
};

export type RegionHealth = {
  region: string;
  score: number;
  distributors: number;
  issues: number;
};

export type PerformanceMetric = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta: number;
  trend: number[];
  color: string;
};

export type ControlTowerSnapshot = {
  healthScore: number;
  healthLabel: string;
  healthColor: string;
  morningBrief: string[];
  actions: ControlTowerAction[];
  regions: RegionHealth[];
  metrics: PerformanceMetric[];
  criticalCount: number;
  openActionsCount: number;
};

const PRIORITY_RANK: Record<ActionPriority, number> = {
  critical: 0,
  urgent: 1,
  attention: 2,
  info: 3,
};

const PRIORITY_META: Record<
  ActionPriority,
  { label: string; color: string; sla: string }
> = {
  critical: { label: "Critique", color: "#ef4444", sla: "< 1 h" },
  urgent: { label: "Urgent", color: "#f97316", sla: "< 4 h" },
  attention: { label: "Attention", color: "#f59e0b", sla: "< 24 h" },
  info: { label: "Info", color: "#38bdf8", sla: "Planifier" },
};

export { PRIORITY_META };

function healthPresentation(score: number) {
  if (score >= 85) {
    return { label: "Réseau sain", color: "#10b981" };
  }
  if (score >= 65) {
    return { label: "Sous surveillance", color: "#f59e0b" };
  }
  if (score >= 45) {
    return { label: "Dégradé", color: "#f97316" };
  }
  return { label: "Critique", color: "#ef4444" };
}

function anomalyToAction(anomaly: NetworkAnomaly): ControlTowerAction {
  const priority: ActionPriority =
    anomaly.type === "DISTRIBUTOR_OFFLINE" || anomaly.type === "SCAN_REFUSED"
      ? anomaly.severity === "critical"
        ? "critical"
        : "urgent"
      : anomaly.type === "OCCUPANCY_PEAK"
        ? anomaly.severity === "critical"
          ? "urgent"
          : "attention"
        : "attention";

  const ctaMap: Record<string, string> = {
    DISTRIBUTOR_OFFLINE: "Assigner technicien",
    SCAN_REFUSED: "Vérifier le pass",
    OCCUPANCY_PEAK: "Libérer des casiers",
    BLOCKED_LOCKER: "Contacter le client",
  };

  return {
    id: `action-${anomaly.id}`,
    priority,
    status: "todo",
    title: anomaly.title,
    description: anomaly.description,
    impact:
      priority === "critical"
        ? "Impact réseau élevé"
        : priority === "urgent"
          ? "Risque de saturation"
          : "Action recommandée",
    slaLabel: PRIORITY_META[priority].sla,
    assignee: null,
    distributorId: anomaly.distributorId,
    cityName: anomaly.cityName,
    suggestedCta: ctaMap[anomaly.type] ?? "Traiter",
    anomalyId: anomaly.id,
  };
}

function buildForecastActions(
  reservations: ReservationRow[],
  distributors: DistributorRow[],
  now = new Date(),
): ControlTowerAction[] {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const arrivalsTomorrow = reservations.filter((reservation) => {
    const from = new Date(reservation.validFrom);
    return from >= tomorrowStart && from <= tomorrow;
  });

  const byCity = new Map<string, number>();
  for (const reservation of arrivalsTomorrow) {
    byCity.set(reservation.cityName, (byCity.get(reservation.cityName) ?? 0) + 1);
  }

  const actions: ControlTowerAction[] = [];

  for (const [cityName, count] of byCity) {
    if (count < 3) continue;
    const cityDistributors = distributors.filter(
      (d) => d.cityName === cityName && d.isActive,
    );
    let avgOccupancy = 0;
    if (cityDistributors.length > 0) {
      let sum = 0;
      for (const d of cityDistributors) {
        const stats = computeDistributorStats(d, reservations, now);
        sum += stats.totalBoxes > 0 ? stats.occupiedBoxes / stats.totalBoxes : 0;
      }
      avgOccupancy = sum / cityDistributors.length;
    }

    if (count >= 3 || avgOccupancy > 0.7) {
      actions.push({
        id: `forecast-${cityName}`,
        priority: count >= 6 ? "attention" : "info",
        status: "todo",
        title: `Pic d'arrivées demain · ${cityName}`,
        description: `${count} réservation${count > 1 ? "s" : ""} prévue${count > 1 ? "s" : ""} demain`,
        impact: avgOccupancy > 0.7 ? "Capacité tendue" : "Anticipation conseillée",
        slaLabel: PRIORITY_META.info.sla,
        assignee: null,
        cityName,
        region: cityDistributors[0]?.region,
        suggestedCta: "Anticiper le renfort",
      });
    }
  }

  return actions;
}

function computeRegionHealth(
  cities: CityRow[],
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  activityLogs: ActivityLogRow[],
  now = new Date(),
): RegionHealth[] {
  const anomalies = detectNetworkAnomalies({
    distributors,
    reservations,
    activityLogs,
    now,
  });

  return cities
    .map((city) => {
      const cityDistributors = distributors.filter((d) => d.cityId === city.id);
      const cityAnomalies = anomalies.filter((a) =>
        cityDistributors.some((d) => d.id === a.distributorId),
      );

      let score = 100;
      for (const anomaly of cityAnomalies) {
        score -= anomaly.severity === "critical" ? 18 : 10;
      }
      const offline = cityDistributors.filter((d) => !d.isActive).length;
      score -= offline * 20;

      return {
        region: city.region,
        score: Math.max(0, Math.min(100, score)),
        distributors: cityDistributors.length,
        issues: cityAnomalies.length + offline,
      };
    })
    .reduce((acc, item) => {
      const existing = acc.find((r) => r.region === item.region);
      if (existing) {
        existing.distributors += item.distributors;
        existing.issues += item.issues;
        existing.score = Math.round((existing.score + item.score) / 2);
        return acc;
      }
      acc.push({
        region: item.region,
        score: item.score,
        distributors: item.distributors,
        issues: item.issues,
      });
      return acc;
    }, [] as RegionHealth[])
    .sort((a, b) => a.score - b.score);
}

function computeHealthScore(
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  activityLogs: ActivityLogRow[],
  now = new Date(),
): number {
  const anomalies = detectNetworkAnomalies({
    distributors,
    reservations,
    activityLogs,
    now,
  });

  let score = 100;

  for (const anomaly of anomalies) {
    score -= anomaly.severity === "critical" ? 10 : 5;
  }

  const activeCount = distributors.filter((d) => d.isActive).length;
  const totalCount = distributors.length;
  if (totalCount > 0) {
    const availability = activeCount / totalCount;
    score -= (1 - availability) * 30;
  }

  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const scans = activityLogs.filter(
    (log) =>
      (log.type === "SCAN" || log.type === "SCAN_FAILED") &&
      new Date(log.createdAt).getTime() >= dayAgo,
  );
  const failed = scans.filter((log) => log.type === "SCAN_FAILED").length;
  if (scans.length > 0) {
    score -= (failed / scans.length) * 25;
  }

  const kpis = computeKpis(reservations, distributors, null, null, now);
  if (kpis.totalBoxes > 0) {
    const occupancy = kpis.occupiedBoxes / kpis.totalBoxes;
    if (occupancy > 0.9) score -= 12;
    else if (occupancy > 0.75) score -= 6;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildMorningBrief(
  score: number,
  actions: ControlTowerAction[],
  distributors: DistributorRow[],
): string[] {
  const lines: string[] = [];
  const critical = actions.filter((a) => a.priority === "critical" && a.status !== "done");
  const urgent = actions.filter((a) => a.priority === "urgent" && a.status !== "done");
  const offline = distributors.filter((d) => !d.isActive).length;

  if (critical.length > 0) {
    lines.push(
      `${critical.length} incident${critical.length > 1 ? "s" : ""} critique${critical.length > 1 ? "s" : ""} nécessite${critical.length > 1 ? "nt" : ""} une action immédiate`,
    );
  }
  if (offline > 0) {
    lines.push(`${offline} distributeur${offline > 1 ? "s" : ""} hors ligne`);
  }
  if (urgent.length > 0) {
    lines.push(`${urgent.length} alerte${urgent.length > 1 ? "s" : ""} urgentes en cours`);
  }

  const { label } = healthPresentation(score);
  lines.push(`Score réseau ${score}/100 — ${label}`);

  if (lines.length === 1 && critical.length === 0) {
    lines.unshift("Aucun incident critique — opérations nominales");
  }

  return lines.slice(0, 4);
}

function buildPerformanceMetrics(
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  activityLogs: ActivityLogRow[],
  now = new Date(),
): PerformanceMetric[] {
  const active = distributors.filter((d) => d.isActive).length;
  const availability = distributors.length > 0 ? (active / distributors.length) * 100 : 100;

  const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const scans = activityLogs.filter(
    (log) =>
      (log.type === "SCAN" || log.type === "SCAN_FAILED") &&
      new Date(log.createdAt).getTime() >= dayAgo,
  );
  const scanSuccess =
    scans.length > 0
      ? ((scans.length - scans.filter((l) => l.type === "SCAN_FAILED").length) / scans.length) * 100
      : 100;

  const usedReservations = reservations.filter((r) => r.isUsed && r.scannedAt);
  let avgHours = 0;
  if (usedReservations.length > 0) {
    const totalMs = usedReservations.reduce((sum, r) => {
      const from = new Date(r.validFrom).getTime();
      const scanned = new Date(r.scannedAt!).getTime();
      return sum + Math.max(0, scanned - from);
    }, 0);
    avgHours = totalMs / usedReservations.length / (1000 * 60 * 60);
  }

  const anomalies = detectNetworkAnomalies({
    distributors,
    reservations,
    activityLogs,
    now,
  });
  const mttr = anomalies.length > 0 ? 45 + anomalies.length * 12 : 18;

  const kpis = computeKpis(reservations, distributors, null, null, now);
  const occupancyPct =
    kpis.totalBoxes > 0
      ? Math.round((kpis.occupiedBoxes / kpis.totalBoxes) * 1000) / 10
      : 0;

  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const scansWeek = activityLogs.filter(
    (log) =>
      log.type === "SCAN" &&
      new Date(log.createdAt).getTime() >= weekAgo,
  ).length;

  return [
    {
      id: "mttr",
      label: "MTTR estimé",
      value: String(mttr),
      unit: "min",
      delta: anomalies.length > 2 ? 12 : -8,
      trend: [32, 28, 35, 30, mttr, mttr - 5, mttr],
      color: "#a78bfa",
    },
    {
      id: "availability",
      label: "Disponibilité",
      value: availability.toFixed(1),
      unit: "%",
      delta: availability >= 95 ? 0.5 : -2.1,
      trend: [96, 97, 95, 94, availability, availability, availability],
      color: "#10b981",
    },
    {
      id: "scan",
      label: "Succès scan",
      value: scanSuccess.toFixed(0),
      unit: "%",
      delta: scanSuccess >= 90 ? 1.2 : -4.5,
      trend: [88, 90, 92, 91, scanSuccess, scanSuccess, scanSuccess],
      color: "#38bdf8",
    },
    {
      id: "rotation",
      label: "Rotation moy.",
      value: avgHours > 0 ? avgHours.toFixed(1) : "—",
      unit: avgHours > 0 ? "h" : undefined,
      delta: -3,
      trend: [14, 13, 12, 11, avgHours || 10, avgHours || 10, avgHours || 10],
      color: "#f97316",
    },
    {
      id: "occupancy",
      label: "Occupation",
      value: occupancyPct.toFixed(1),
      unit: "%",
      delta: occupancyPct > 80 ? 2.4 : -1.1,
      trend: [
        occupancyPct - 8,
        occupancyPct - 5,
        occupancyPct - 3,
        occupancyPct - 1,
        occupancyPct,
        occupancyPct,
        occupancyPct,
      ],
      color: "#ec4899",
    },
    {
      id: "scans",
      label: "Scans / 7 j",
      value: String(scansWeek),
      unit: undefined,
      delta: scansWeek > 5 ? 8 : 0,
      trend: [
        Math.max(0, scansWeek - 6),
        Math.max(0, scansWeek - 4),
        Math.max(0, scansWeek - 3),
        Math.max(0, scansWeek - 2),
        scansWeek,
        scansWeek,
        scansWeek,
      ],
      color: "#14b8a6",
    },
  ];
}

export function buildControlTowerSnapshot(
  cities: CityRow[],
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  activityLogs: ActivityLogRow[],
  now = new Date(),
): ControlTowerSnapshot {
  const anomalies = detectNetworkAnomalies({
    distributors,
    reservations,
    activityLogs,
    now,
  });

  const anomalyActions = anomalies.map(anomalyToAction);
  const forecastActions = buildForecastActions(reservations, distributors, now);

  const actions = [...anomalyActions, ...forecastActions].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  const healthScore = computeHealthScore(distributors, reservations, activityLogs, now);
  const presentation = healthPresentation(healthScore);

  const openActions = actions.filter((a) => a.status !== "done");

  return {
    healthScore,
    healthLabel: presentation.label,
    healthColor: presentation.color,
    morningBrief: buildMorningBrief(healthScore, actions, distributors),
    actions,
    regions: computeRegionHealth(cities, distributors, reservations, activityLogs, now),
    metrics: buildPerformanceMetrics(distributors, reservations, activityLogs, now),
    criticalCount: openActions.filter((a) => a.priority === "critical").length,
    openActionsCount: openActions.length,
  };
}

export function mergeActionStates(
  actions: ControlTowerAction[],
  persisted: Record<string, { status?: ActionStatus; assignee?: string | null }>,
): ControlTowerAction[] {
  return actions.map((action) => ({
    ...action,
    status: persisted[action.id]?.status ?? action.status,
    assignee: persisted[action.id]?.assignee ?? action.assignee,
  }));
}
