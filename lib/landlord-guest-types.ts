export type LandlordGuestReservationRow = {
  id: string;
  code: string;
  guestName: string | null;
  guestsCount: number | null;
  checkIn: string;
  checkOut: string;
  isUsed: boolean;
  propertyLabel: string | null;
  propertyAddress: string | null;
  boxNumber: number;
  distributorName: string;
  distributorSlug: string;
  cityName: string;
  createdAt: string;
  scannedAt: string | null;
};

export function getGuestReservationStatus(
  reservation: Pick<LandlordGuestReservationRow, "isUsed" | "checkIn" | "checkOut">,
  now = new Date(),
): "active" | "used" | "upcoming" | "expired" {
  if (reservation.isUsed) return "used";
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  if (now < checkIn) return "upcoming";
  if (now > checkOut) return "expired";
  return "active";
}

export const GUEST_STATUS_META: Record<
  ReturnType<typeof getGuestReservationStatus>,
  { label: string; color: string }
> = {
  active: { label: "En cours", color: "#10b981" },
  upcoming: { label: "À venir", color: "#38bdf8" },
  used: { label: "Utilisé", color: "#71717a" },
  expired: { label: "Expiré", color: "#f97316" },
};
