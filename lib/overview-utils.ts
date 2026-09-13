import {
  computeCityStats,
  computeDistributorStats,
  type ReservationRow,
} from "@/lib/admin-utils";
import type { CityRow, DistributorRow } from "@/lib/network-types";

export type CityOverviewRow = {
  city: CityRow;
  occupiedBoxes: number;
  totalBoxes: number;
  freeBoxes: number;
  percent: number;
  offlineCount: number;
  distributorCount: number;
};

export type RegionOverviewGroup = {
  region: string;
  cities: CityOverviewRow[];
  occupiedBoxes: number;
  totalBoxes: number;
  percent: number;
  offlineCount: number;
};

export type OverviewSort = "occupancy_desc" | "occupancy_asc" | "name";

export function buildCityOverviewRows(
  cities: CityRow[],
  distributors: DistributorRow[],
  reservations: ReservationRow[],
): CityOverviewRow[] {
  return cities.map((city) => {
    const stats = computeCityStats(
      city.id,
      city.name,
      city.region,
      distributors,
      reservations,
    );
    const cityDistributors = distributors.filter((d) => d.cityId === city.id);
    const offlineCount = cityDistributors.filter((d) => !d.isActive).length;
    const percent =
      stats.totalBoxes > 0
        ? Math.round((stats.occupiedBoxes / stats.totalBoxes) * 100)
        : 0;

    return {
      city,
      occupiedBoxes: stats.occupiedBoxes,
      totalBoxes: stats.totalBoxes,
      freeBoxes: stats.freeBoxes,
      percent,
      offlineCount,
      distributorCount: stats.distributorCount,
    };
  });
}

export function groupByRegion(rows: CityOverviewRow[]): RegionOverviewGroup[] {
  const map = new Map<string, CityOverviewRow[]>();

  for (const row of rows) {
    const list = map.get(row.city.region) ?? [];
    list.push(row);
    map.set(row.city.region, list);
  }

  return Array.from(map.entries())
    .map(([region, cities]) => {
      const occupiedBoxes = cities.reduce((sum, c) => sum + c.occupiedBoxes, 0);
      const totalBoxes = cities.reduce((sum, c) => sum + c.totalBoxes, 0);
      const offlineCount = cities.reduce((sum, c) => sum + c.offlineCount, 0);
      const percent =
        totalBoxes > 0 ? Math.round((occupiedBoxes / totalBoxes) * 100) : 0;

      return {
        region,
        cities,
        occupiedBoxes,
        totalBoxes,
        percent,
        offlineCount,
      };
    })
    .sort((a, b) => a.region.localeCompare(b.region, "fr"));
}

export function filterCityRows(
  rows: CityOverviewRow[],
  query: string,
): CityOverviewRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;

  return rows.filter(
    (row) =>
      row.city.name.toLowerCase().includes(normalized) ||
      row.city.region.toLowerCase().includes(normalized),
  );
}

export function sortCityRows(
  rows: CityOverviewRow[],
  sort: OverviewSort,
): CityOverviewRow[] {
  const copy = [...rows];
  switch (sort) {
    case "occupancy_desc":
      return copy.sort((a, b) => b.percent - a.percent || a.city.name.localeCompare(b.city.name, "fr"));
    case "occupancy_asc":
      return copy.sort((a, b) => a.percent - b.percent || a.city.name.localeCompare(b.city.name, "fr"));
    case "name":
    default:
      return copy.sort((a, b) => a.city.name.localeCompare(b.city.name, "fr"));
  }
}

export function getOccupancyTone(percent: number): "low" | "medium" | "high" {
  if (percent >= 85) return "high";
  if (percent >= 60) return "medium";
  return "low";
}

export function getOccupancyColors(
  percent: number,
  isLight: boolean,
): { bar: string; text: string; badge: string } {
  const tone = getOccupancyTone(percent);
  if (tone === "high") {
    return {
      bar: "from-red-500 to-orange-500",
      text: isLight ? "text-red-600" : "text-red-400",
      badge: isLight ? "bg-red-50 text-red-700" : "bg-red-500/15 text-red-400",
    };
  }
  if (tone === "medium") {
    return {
      bar: "from-orange-500 to-amber-400",
      text: isLight ? "text-orange-600" : "text-orange-400",
      badge: isLight ? "bg-orange-50 text-orange-700" : "bg-orange-500/15 text-orange-400",
    };
  }
  return {
    bar: "from-emerald-500 to-teal-400",
    text: isLight ? "text-emerald-600" : "text-emerald-400",
    badge: isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/15 text-emerald-400",
  };
}

export function computeNetworkSnapshot(
  distributors: DistributorRow[],
  reservations: ReservationRow[],
) {
  const activeDistributors = distributors.filter((d) => d.isActive);
  const offlineCount = distributors.length - activeDistributors.length;

  let occupiedBoxes = 0;
  let totalBoxes = 0;
  let saturatedSites = 0;

  for (const distributor of distributors) {
    const stats = computeDistributorStats(distributor, reservations);
    occupiedBoxes += stats.occupiedBoxes;
    totalBoxes += stats.totalBoxes;
    if (stats.totalBoxes > 0 && stats.occupiedBoxes / stats.totalBoxes >= 0.85) {
      saturatedSites += 1;
    }
  }

  const percent = totalBoxes > 0 ? Math.round((occupiedBoxes / totalBoxes) * 100) : 0;

  return {
    occupiedBoxes,
    totalBoxes,
    freeBoxes: totalBoxes - occupiedBoxes,
    percent,
    offlineCount,
    saturatedSites,
    activeDistributorCount: activeDistributors.length,
  };
}
