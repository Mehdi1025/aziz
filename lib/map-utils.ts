import type { DistributorRow, DepartmentRow } from "@/lib/network-types";

export const FRANCE_MAP_CENTER = { lat: 46.603354, lng: 1.888334 } as const;
export const FRANCE_MAP_ZOOM = 6;
export const DEPARTMENT_MAP_ZOOM = 10;

export function groupDistributorsByDepartment(
  distributors: DistributorRow[],
): DepartmentRow[] {
  const map = new Map<string, DepartmentRow & { latSum: number; lngSum: number }>();

  for (const distributor of distributors) {
    const existing = map.get(distributor.departmentCode);
    if (existing) {
      existing.distributorCount += 1;
      existing.totalBoxes += distributor.totalBoxes;
      existing.latSum += distributor.latitude;
      existing.lngSum += distributor.longitude;
      existing.centerLat = existing.latSum / existing.distributorCount;
      existing.centerLng = existing.lngSum / existing.distributorCount;
    } else {
      map.set(distributor.departmentCode, {
        code: distributor.departmentCode,
        name: distributor.departmentName,
        distributorCount: 1,
        totalBoxes: distributor.totalBoxes,
        centerLat: distributor.latitude,
        centerLng: distributor.longitude,
        latSum: distributor.latitude,
        lngSum: distributor.longitude,
      });
    }
  }

  return Array.from(map.values())
    .map(({ latSum: _a, lngSum: _b, ...department }) => department)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function getDistributorsInDepartment(
  distributors: DistributorRow[],
  departmentCode: string,
): DistributorRow[] {
  return distributors.filter((d) => d.departmentCode === departmentCode);
}

export function getDepartmentBounds(distributors: DistributorRow[]) {
  if (distributors.length === 0) {
    return [
      [FRANCE_MAP_CENTER.lat - 2, FRANCE_MAP_CENTER.lng - 2] as [number, number],
      [FRANCE_MAP_CENTER.lat + 2, FRANCE_MAP_CENTER.lng + 2] as [number, number],
    ];
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const d of distributors) {
    minLat = Math.min(minLat, d.latitude);
    maxLat = Math.max(maxLat, d.latitude);
    minLng = Math.min(minLng, d.longitude);
    maxLng = Math.max(maxLng, d.longitude);
  }

  const latPad = Math.max(0.05, (maxLat - minLat) * 0.2);
  const lngPad = Math.max(0.05, (maxLng - minLng) * 0.2);

  return [
    [minLat - latPad, minLng - lngPad] as [number, number],
    [maxLat + latPad, maxLng + lngPad] as [number, number],
  ];
}

export function hasValidCoordinates(distributor: DistributorRow): boolean {
  return (
    Number.isFinite(distributor.latitude) &&
    Number.isFinite(distributor.longitude)
  );
}

export function getGoogleMapsUrl(distributor: DistributorRow): string {
  const query = encodeURIComponent(distributor.address ?? `${distributor.latitude},${distributor.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
