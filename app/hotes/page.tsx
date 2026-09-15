import { LandlordDashboard } from "@/components/landlord/landlord-dashboard";
import { MOCK_LANDLORD_DASHBOARD } from "@/components/landlord/mock-landlord-data";

/**
 * Page Server Component — structure et données initiales.
 * L'interactivité est déléguée au Client Component LandlordDashboard.
 *
 * Pour brancher la BDD : remplacer MOCK_LANDLORD_DASHBOARD par un fetch
 * Prisma (getLandlordBySession) et passer useMockActions={false}.
 */
export default function HotesPage() {
  return (
    <LandlordDashboard
      initialData={MOCK_LANDLORD_DASHBOARD}
      useMockActions
    />
  );
}
