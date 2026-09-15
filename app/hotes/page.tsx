import {
  getHostDashboardData,
  getLandlordReservations,
} from "@/app/hotes/actions";
import { LandlordDashboard } from "@/components/landlord/landlord-dashboard";

/**
 * Dashboard hôte branché sur Turso (Sophie Martin par défaut).
 */
export default async function HotesPage() {
  const { data: initialData, isFromDatabase } = await getHostDashboardData();

  let guestReservations: Awaited<ReturnType<typeof getLandlordReservations>> = [];
  if (isFromDatabase) {
    try {
      guestReservations = await getLandlordReservations(initialData.landlord.id);
    } catch {
      guestReservations = [];
    }
  }

  return (
    <LandlordDashboard
      initialData={initialData}
      initialGuestReservations={guestReservations}
      useMockActions={!isFromDatabase}
    />
  );
}
