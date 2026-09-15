import type { DistributorRow } from "@/lib/network-types";
import {
  isAllCitiesFilter,
  isAllDistributorsFilter,
} from "@/lib/network-types";
import { buildPassUrl } from "@/lib/parse-reservation-link";

export type ReservationRow = {
  id: string;
  code: string;
  distributorId: string;
  distributorSlug: string;
  distributorName: string;
  cityId: string;
  citySlug: string;
  cityName: string;
  region: string;
  boxNumber: number;
  checkIn: string;
  checkOut: string;
  isUsed: boolean;
  scannedAt: string | null;
};

export type ReservationFilter =
  | "all"
  | "today"
  | "week"
  | "used"
  | "pending";

export type ReservationSort = "arrival" | "departure";

export type ReservationBadge = "arrive_today" | "leave_tomorrow" | null;

export type AdminKpis = {
  occupiedBoxes: number;
  totalBoxes: number;
  arrivalsToday: number;
  departuresToday: number;
  pendingPasses: number;
  cityCount: number;
  distributorCount: number;
};

export function maskCode(code: string): string {
  if (code.length <= 4) {
    return `${code[0] ?? ""}***`;
  }
  return `${code[0]}***${code.slice(-3)}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

export function getBoxNumbersForDistributor(distributor: { totalBoxes: number }): number[] {
  return Array.from({ length: distributor.totalBoxes }, (_, index) => index + 1);
}

export function filterReservationsByNetwork(
  reservations: ReservationRow[],
  cityId: string | null,
  distributorId: string | null,
): ReservationRow[] {
  let filtered = reservations;

  if (!isAllCitiesFilter(cityId)) {
    filtered = filtered.filter((reservation) => reservation.cityId === cityId);
  }

  if (!isAllDistributorsFilter(distributorId)) {
    filtered = filtered.filter(
      (reservation) => reservation.distributorId === distributorId,
    );
  }

  return filtered;
}

export function getActiveReservation(
  boxNumber: number,
  distributorId: string,
  reservations: ReservationRow[],
  now = new Date(),
): ReservationRow | undefined {
  return reservations.find(
    (reservation) =>
      reservation.distributorId === distributorId &&
      reservation.boxNumber === boxNumber &&
      now >= new Date(reservation.checkIn) &&
      now <= new Date(reservation.checkOut),
  );
}

export function isBoxOccupied(
  boxNumber: number,
  distributorId: string,
  reservations: ReservationRow[],
  now = new Date(),
): boolean {
  return Boolean(getActiveReservation(boxNumber, distributorId, reservations, now));
}

export function getCodeInitials(code: string): string {
  return code.slice(0, 2).toUpperCase();
}

export function getFutureReservations(
  reservations: ReservationRow[],
  now = new Date(),
): ReservationRow[] {
  return reservations.filter(
    (reservation) => new Date(reservation.checkOut) >= now,
  );
}

export function getExpiredReservations(
  reservations: ReservationRow[],
  now = new Date(),
): ReservationRow[] {
  return reservations.filter(
    (reservation) => new Date(reservation.checkOut) < now,
  );
}

export function getReservationPassUrl(reservation: ReservationRow): string {
  const inDate = formatPassDateParam(new Date(reservation.checkIn));
  const outDate = formatPassDateParam(new Date(reservation.checkOut));
  return buildPassUrl({
    code: reservation.code,
    in: inDate,
    out: outDate,
    box: String(reservation.boxNumber),
    site: reservation.distributorSlug,
  });
}

function formatPassDateParam(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\./g, ".");
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function getReservationBadge(
  reservation: ReservationRow,
  now = new Date(),
): ReservationBadge {
  const validFrom = new Date(reservation.checkIn);
  const validTo = new Date(reservation.checkOut);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(validFrom, now)) {
    return "arrive_today";
  }

  if (isSameDay(validTo, tomorrow)) {
    return "leave_tomorrow";
  }

  return null;
}

export function getBadgeLabel(badge: ReservationBadge): string | null {
  if (badge === "arrive_today") return "Arrive aujourd'hui";
  if (badge === "leave_tomorrow") return "Part demain";
  return null;
}

export function computeKpis(
  reservations: ReservationRow[],
  distributors: DistributorRow[],
  cityId: string | null,
  distributorId: string | null,
  now = new Date(),
): AdminKpis {
  const scoped = filterReservationsByNetwork(reservations, cityId, distributorId);

  let activeDistributors = distributors.filter((d) => d.isActive);
  if (!isAllCitiesFilter(cityId)) {
    activeDistributors = activeDistributors.filter((d) => d.cityId === cityId);
  }
  if (!isAllDistributorsFilter(distributorId)) {
    activeDistributors = activeDistributors.filter((d) => d.id === distributorId);
  }

  let occupiedBoxes = 0;
  let totalBoxes = 0;

  for (const distributor of activeDistributors) {
    const distributorReservations = scoped.filter(
      (reservation) => reservation.distributorId === distributor.id,
    );
    const boxNumbers = getBoxNumbersForDistributor(distributor);
    totalBoxes += boxNumbers.length;
    occupiedBoxes += boxNumbers.filter((boxNumber) =>
      isBoxOccupied(boxNumber, distributor.id, distributorReservations, now),
    ).length;
  }

  const cityCount = new Set(activeDistributors.map((d) => d.cityId)).size;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const arrivalsToday = scoped.filter((reservation) => {
    const validFrom = new Date(reservation.checkIn);
    return validFrom >= todayStart && validFrom <= todayEnd;
  }).length;

  const departuresToday = scoped.filter((reservation) => {
    const validTo = new Date(reservation.checkOut);
    return validTo >= todayStart && validTo <= todayEnd;
  }).length;

  const pendingPasses = getFutureReservations(scoped, now).filter(
    (reservation) => !reservation.isUsed,
  ).length;

  return {
    occupiedBoxes,
    totalBoxes,
    arrivalsToday,
    departuresToday,
    pendingPasses,
    cityCount,
    distributorCount: activeDistributors.length,
  };
}

export function computeDistributorStats(
  distributor: DistributorRow,
  reservations: ReservationRow[],
  now = new Date(),
) {
  const distributorReservations = reservations.filter(
    (reservation) => reservation.distributorId === distributor.id,
  );
  const boxNumbers = getBoxNumbersForDistributor(distributor);
  const occupiedBoxes = boxNumbers.filter((boxNumber) =>
    isBoxOccupied(boxNumber, distributor.id, distributorReservations, now),
  ).length;

  return {
    distributor,
    occupiedBoxes,
    totalBoxes: boxNumbers.length,
    freeBoxes: boxNumbers.length - occupiedBoxes,
    pendingPasses: getFutureReservations(distributorReservations, now).filter(
      (reservation) => !reservation.isUsed,
    ).length,
  };
}

export function computeCityStats(
  cityId: string,
  cityName: string,
  region: string,
  distributors: DistributorRow[],
  reservations: ReservationRow[],
  now = new Date(),
) {
  const cityDistributors = distributors.filter((d) => d.cityId === cityId);
  let occupiedBoxes = 0;
  let totalBoxes = 0;

  for (const distributor of cityDistributors) {
    const stats = computeDistributorStats(distributor, reservations, now);
    occupiedBoxes += stats.occupiedBoxes;
    totalBoxes += stats.totalBoxes;
  }

  return {
    cityId,
    cityName,
    region,
    distributorCount: cityDistributors.length,
    occupiedBoxes,
    totalBoxes,
    freeBoxes: totalBoxes - occupiedBoxes,
  };
}

export function filterReservations(
  reservations: ReservationRow[],
  filter: ReservationFilter,
  query: string,
  now = new Date(),
): ReservationRow[] {
  const normalizedQuery = query.trim().toLowerCase();

  let filtered = reservations;

  switch (filter) {
    case "today": {
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      filtered = filtered.filter((reservation) => {
        const from = new Date(reservation.checkIn);
        const to = new Date(reservation.checkOut);
        return (
          (from >= todayStart && from <= todayEnd) ||
          (to >= todayStart && to <= todayEnd) ||
          (from <= todayStart && to >= todayEnd)
        );
      });
      break;
    }
    case "week": {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      filtered = filtered.filter(
        (reservation) => new Date(reservation.checkIn) <= weekEnd,
      );
      break;
    }
    case "used":
      filtered = filtered.filter((reservation) => reservation.isUsed);
      break;
    case "pending":
      filtered = filtered.filter((reservation) => !reservation.isUsed);
      break;
    default:
      break;
  }

  if (normalizedQuery) {
    filtered = filtered.filter(
      (reservation) =>
        reservation.code.toLowerCase().includes(normalizedQuery) ||
        String(reservation.boxNumber).includes(normalizedQuery) ||
        reservation.cityName.toLowerCase().includes(normalizedQuery) ||
        reservation.distributorName.toLowerCase().includes(normalizedQuery) ||
        reservation.distributorSlug.toLowerCase().includes(normalizedQuery),
    );
  }

  return filtered;
}

export function sortReservations(
  reservations: ReservationRow[],
  sort: ReservationSort,
): ReservationRow[] {
  return [...reservations].sort((a, b) => {
    if (sort === "departure") {
      return new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime();
    }
    return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
  });
}

export function exportReservationsCsv(reservations: ReservationRow[]): string {
  const headers = [
    "ID",
    "Ville",
    "Distributeur",
    "Code",
    "Box",
    "Valide du",
    "Valide au",
    "Utilisé",
    "Scanné le",
  ];

  const rows = reservations.map((reservation) => [
    reservation.id,
    reservation.cityName,
    reservation.distributorName,
    reservation.code,
    String(reservation.boxNumber),
    formatDateTime(reservation.checkIn),
    formatDateTime(reservation.checkOut),
    reservation.isUsed ? "Oui" : "Non",
    reservation.scannedAt ? formatDateTime(reservation.scannedAt) : "",
  ]);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

export type CalendarDay = {
  date: Date;
  inMonth: boolean;
  reservations: ReservationRow[];
};

export function buildCalendarDays(
  reservations: ReservationRow[],
  month: Date,
): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const dayReservations = reservations.filter((reservation) => {
      const from = startOfDay(new Date(reservation.checkIn));
      const to = endOfDay(new Date(reservation.checkOut));
      const current = startOfDay(date);
      return current >= from && current <= to;
    });

    return {
      date,
      inMonth: date.getMonth() === monthIndex,
      reservations: dayReservations,
    };
  });
}
