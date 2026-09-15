import { getLandlordReservations } from "@/app/hotes/actions";
import { LandlordDashboard } from "@/components/landlord/landlord-dashboard";
import {
  MOCK_GUEST_RESERVATIONS,
  MOCK_LANDLORD_DASHBOARD,
} from "@/components/landlord/mock-landlord-data";

/**
 * Page Server Component — structure et données initiales.
 * Les réservations voyageurs sont filtrées multi-tenant par landlordId.
 */
export default async function HotesPage() {
  const initialData = MOCK_LANDLORD_DASHBOARD;

  let guestReservations = MOCK_GUEST_RESERVATIONS;
  try {
    const fromDb = await getLandlordReservations(initialData.landlord.id);
    if (fromDb.length > 0) {
      guestReservations = fromDb;
    }
  } catch {
    /* fallback mock pour la démo */
  }

  return (
    <LandlordDashboard
      initialData={initialData}
      initialGuestReservations={guestReservations}
      useMockActions
    />
  );
}
