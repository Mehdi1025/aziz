export type CityRow = {
  id: string;
  slug: string;
  name: string;
  region: string;
  distributorCount: number;
  totalBoxes: number;
};

export type DistributorRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  departmentCode: string;
  departmentName: string;
  cityId: string;
  citySlug: string;
  cityName: string;
  region: string;
  totalBoxes: number;
  isActive: boolean;
};

export type DepartmentRow = {
  code: string;
  name: string;
  distributorCount: number;
  totalBoxes: number;
  centerLat: number;
  centerLng: number;
};

export const ALL_CITIES_ID = "__all_cities__";
export const ALL_DISTRIBUTORS_ID = "__all_distributors__";
export const ALL_DEPARTMENTS_ID = "__all_departments__";

export function isAllCitiesFilter(cityId: string | null): boolean {
  return cityId === null || cityId === ALL_CITIES_ID;
}

export function isAllDistributorsFilter(distributorId: string | null): boolean {
  return distributorId === null || distributorId === ALL_DISTRIBUTORS_ID;
}

export function formatDistributorLabel(distributor: DistributorRow): string {
  return `${distributor.cityName} — ${distributor.name}`;
}

export function formatDistributorShort(distributor: DistributorRow): string {
  return `${distributor.cityName} · ${distributor.name}`;
}

export function formatDepartmentLabel(department: DepartmentRow): string {
  return `${department.code} — ${department.name}`;
}
