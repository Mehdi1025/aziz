import type { CityRow, DistributorRow } from "@/lib/network-types";
import { MOCK_DISTRIBUTORS } from "@/lib/mock-network-data";
import { FRANCE_MAP_CENTER } from "@/lib/map-utils";
import { prisma } from "@/lib/prisma";

export type { CityRow, DistributorRow } from "@/lib/network-types";
export {
  ALL_CITIES_ID,
  ALL_DISTRIBUTORS_ID,
  isAllCitiesFilter,
  isAllDistributorsFilter,
  formatDistributorLabel,
  formatDistributorShort,
} from "@/lib/network-types";

function mapDistributor(distributor: {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  cityId: string;
  totalBoxes: number;
  isActive: boolean;
  city: { id: string; slug: string; name: string; region: string };
}): DistributorRow {
  const mock = MOCK_DISTRIBUTORS.find((m) => m.slug === distributor.slug);

  return {
    id: distributor.id,
    slug: distributor.slug,
    name: distributor.name,
    address: distributor.address ?? mock?.address ?? null,
    latitude: distributor.latitude ?? mock?.latitude ?? FRANCE_MAP_CENTER.lat,
    longitude: distributor.longitude ?? mock?.longitude ?? FRANCE_MAP_CENTER.lng,
    departmentCode: distributor.departmentCode ?? mock?.departmentCode ?? "00",
    departmentName: distributor.departmentName ?? mock?.departmentName ?? "France",
    cityId: distributor.cityId,
    citySlug: distributor.city.slug,
    cityName: distributor.city.name,
    region: distributor.city.region,
    totalBoxes: distributor.totalBoxes,
    isActive: distributor.isActive,
  };
}

const distributorInclude = {
  city: true,
} as const;

export async function getAllDistributors(): Promise<DistributorRow[]> {
  const distributors = await prisma.distributor.findMany({
    where: { isActive: true },
    include: distributorInclude,
    orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
  });

  return distributors.map(mapDistributor);
}

export async function getAllDistributorsForAdmin(): Promise<DistributorRow[]> {
  const distributors = await prisma.distributor.findMany({
    include: distributorInclude,
    orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
  });

  return distributors.map(mapDistributor);
}

export async function getAllCities(): Promise<CityRow[]> {
  const cities = await prisma.city.findMany({
    include: {
      distributors: { where: { isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  return cities.map((city) => ({
    id: city.id,
    slug: city.slug,
    name: city.name,
    region: city.region,
    distributorCount: city.distributors.length,
    totalBoxes: city.distributors.reduce((sum, d) => sum + d.totalBoxes, 0),
  }));
}

export async function getDistributorBySlug(
  slug: string,
): Promise<DistributorRow | null> {
  const distributor = await prisma.distributor.findUnique({
    where: { slug: slug.trim().toLowerCase() },
    include: distributorInclude,
  });

  return distributor ? mapDistributor(distributor) : null;
}

export async function getDistributorById(
  id: string,
): Promise<DistributorRow | null> {
  const distributor = await prisma.distributor.findUnique({
    where: { id },
    include: distributorInclude,
  });

  return distributor ? mapDistributor(distributor) : null;
}

export async function getDefaultDistributor(): Promise<DistributorRow> {
  const envSlug = process.env.DEFAULT_DISTRIBUTOR_SLUG?.trim().toLowerCase();

  if (envSlug) {
    const fromEnv = await getDistributorBySlug(envSlug);
    if (fromEnv) return fromEnv;
  }

  const first = await prisma.distributor.findFirst({
    where: { isActive: true },
    include: distributorInclude,
    orderBy: { createdAt: "asc" },
  });

  if (!first) {
    throw new Error("Aucun distributeur configuré. Exécutez npm run db:seed.");
  }

  return mapDistributor(first);
}

/** Résout le slug distributeur passé dans l'URL (?site=). */
export async function resolveDistributorSlug(
  slug: string | undefined | null,
): Promise<DistributorRow> {
  if (slug?.trim()) {
    const distributor = await getDistributorBySlug(slug);
    if (distributor) return distributor;
  }

  return getDefaultDistributor();
}

/** Compat anciens slugs Location → nouveaux Distributor. */
const LEGACY_SLUG_MAP: Record<string, string> = {
  "paris-opera": "paris-opera",
  "paris-montmartre": "paris-montmartre",
  "lyon-part-dieu": "lyon-part-dieu",
  "marseille-vieux-port": "marseille-vieux-port",
  "nice-promenade": "nice-promenade",
  "bordeaux-centre": "bordeaux-bourse",
  "toulouse-capitole": "toulouse-capitole",
  "nantes-gare": "nantes-gare",
  "lille-flandres": "lille-flandres",
  "strasbourg-centre": "strasbourg-petite-france",
  "rennes-gare": "rennes-gare",
  "montpellier-comedie": "montpellier-comedie",
  "grenoble-gare": "grenoble-gare",
  "nancy-stanislas": "nancy-stanislas",
  "reims-cathedrale": "reims-cathedrale",
};

export async function resolveDistributorSlugWithLegacy(
  slug: string | undefined | null,
): Promise<DistributorRow> {
  if (slug?.trim()) {
    const normalized = slug.trim().toLowerCase();
    const mapped = LEGACY_SLUG_MAP[normalized] ?? normalized;
    const distributor = await getDistributorBySlug(mapped);
    if (distributor) return distributor;
  }

  return getDefaultDistributor();
}
