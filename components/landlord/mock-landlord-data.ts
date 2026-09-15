import type { LandlordGuestReservationRow } from "@/lib/landlord-guest-types";
import type {
  KeyDepositRow,
  LandlordRow,
  SubscriptionPlanRow,
} from "@/lib/subscription-types";

/** Distributeur simplifié pour le dépôt de clés (mock). */
export type HostDistributorOption = {
  id: string;
  slug: string;
  name: string;
  cityName: string;
  address: string;
  availableBoxes: number[];
};

export type LandlordDashboardData = {
  landlord: LandlordRow;
  plans: SubscriptionPlanRow[];
  distributors: HostDistributorOption[];
};

// ─── Mock plans ─────────────────────────────────────────────────────────────

export const MOCK_PLANS: SubscriptionPlanRow[] = [
  {
    id: "plan_starter",
    slug: "starter",
    name: "Starter",
    description: "Idéal pour un premier logement",
    maxKeys: 2,
    priceMonthly: 1900,
    isActive: true,
  },
  {
    id: "plan_pro",
    slug: "pro",
    name: "Pro",
    description: "Pour les hôtes multi-logements",
    maxKeys: 5,
    priceMonthly: 4900,
    isActive: true,
  },
  {
    id: "plan_business",
    slug: "business",
    name: "Business",
    description: "Gestion avancée & volume",
    maxKeys: 15,
    priceMonthly: 9900,
    isActive: true,
  },
];

// ─── Mock distributeurs ───────────────────────────────────────────────────────

export const MOCK_HOST_DISTRIBUTORS: HostDistributorOption[] = [
  {
    id: "dist_paris_opera",
    slug: "paris-opera",
    name: "Opéra",
    cityName: "Paris",
    address: "1 Place de l'Opéra, 75009 Paris",
    availableBoxes: [2, 4, 7, 9],
  },
  {
    id: "dist_paris_bastille",
    slug: "paris-bastille",
    name: "Bastille",
    cityName: "Paris",
    address: "14 Place de la Bastille, 75011 Paris",
    availableBoxes: [1, 3, 5, 8, 11],
  },
  {
    id: "dist_lyon_bellecour",
    slug: "lyon-bellecour",
    name: "Bellecour",
    cityName: "Lyon",
    address: "5 Place Bellecour, 69002 Lyon",
    availableBoxes: [2, 6, 10],
  },
  {
    id: "dist_nice_promenade",
    slug: "nice-promenade",
    name: "Promenade",
    cityName: "Nice",
    address: "12 Promenade des Anglais, 06000 Nice",
    availableBoxes: [1, 4, 8],
  },
];

// ─── Mock clés ────────────────────────────────────────────────────────────────

const MOCK_KEYS: KeyDepositRow[] = [
  {
    id: "demo-key-sophie-t1",
    landlordId: "landlord_sophie",
    subscriptionId: "sub_sophie_pro",
    propertyLabel: "Appartement Marais",
    propertyAddress: "12 Rue des Rosiers, 75004 Paris",
    distributorId: "dist_paris_opera",
    distributorName: "Opéra",
    cityName: "Paris",
    boxNumber: 3,
    status: "in_locker",
    notes: null,
    depositedAt: "2026-09-01T10:30:00.000Z",
    createdAt: "2026-08-28T09:00:00.000Z",
    activeReservationCode: "HMNCWQN8DM",
  },
  {
    id: "key_bastille",
    landlordId: "landlord_sophie",
    subscriptionId: "sub_sophie_pro",
    propertyLabel: "Studio Bastille",
    propertyAddress: "8 Rue de la Roquette, 75011 Paris",
    distributorId: null,
    distributorName: null,
    cityName: null,
    boxNumber: null,
    status: "pending_deposit",
    notes: null,
    depositedAt: null,
    createdAt: "2026-09-10T14:20:00.000Z",
    activeReservationCode: null,
  },
  {
    id: "key_canal",
    landlordId: "landlord_sophie",
    subscriptionId: "sub_sophie_pro",
    propertyLabel: "Loft Canal Saint-Martin",
    propertyAddress: "45 Quai de Valmy, 75010 Paris",
    distributorId: "dist_paris_bastille",
    distributorName: "Bastille",
    cityName: "Paris",
    boxNumber: 5,
    status: "in_locker",
    notes: null,
    depositedAt: "2026-09-05T16:00:00.000Z",
    createdAt: "2026-09-02T11:00:00.000Z",
    activeReservationCode: null,
  },
  {
    id: "key_montmartre",
    landlordId: "landlord_sophie",
    subscriptionId: "sub_sophie_pro",
    propertyLabel: "T2 Montmartre",
    propertyAddress: "22 Rue Lepic, 75018 Paris",
    distributorId: "dist_paris_opera",
    distributorName: "Opéra",
    cityName: "Paris",
    boxNumber: 1,
    status: "checked_out",
    notes: "Clé retirée par le voyageur le 12 sept.",
    depositedAt: "2026-08-20T08:00:00.000Z",
    createdAt: "2026-08-15T10:00:00.000Z",
    activeReservationCode: null,
  },
];

// ─── Mock hôte complet ────────────────────────────────────────────────────────

export const MOCK_LANDLORD: LandlordRow = {
  id: "landlord_sophie",
  name: "Sophie Martin",
  email: "sophie.martin@email.fr",
  phone: "+33 6 12 34 56 78",
  company: "SM Locations",
  createdAt: "2026-06-01T08:00:00.000Z",
  subscription: {
    id: "sub_sophie_pro",
    landlordId: "landlord_sophie",
    planId: "plan_pro",
    planSlug: "pro",
    planName: "Pro",
    maxKeys: 5,
    priceMonthly: 4900,
    status: "active",
    startedAt: "2026-06-01T08:00:00.000Z",
    renewsAt: "2026-10-01T08:00:00.000Z",
    canceledAt: null,
    keysUsed: MOCK_KEYS.length,
    keysInLocker: MOCK_KEYS.filter((k) => k.status === "in_locker").length,
  },
  keys: MOCK_KEYS,
};

export const MOCK_LANDLORD_DASHBOARD: LandlordDashboardData = {
  landlord: MOCK_LANDLORD,
  plans: MOCK_PLANS,
  distributors: MOCK_HOST_DISTRIBUTORS,
};

export const MOCK_DISTRIBUTOR_SLUGS: Record<string, string> = Object.fromEntries(
  MOCK_HOST_DISTRIBUTORS.map((d) => [d.id, d.slug]),
);

export const MOCK_GUEST_RESERVATIONS: LandlordGuestReservationRow[] = [
  {
    id: "res_mock_1",
    code: "HMNCWQN8DM",
    guestName: "Emma",
    guestsCount: 2,
    checkIn: "2026-09-15T15:00:00.000Z",
    checkOut: "2026-09-18T11:00:00.000Z",
    isUsed: false,
    propertyLabel: "Appartement Marais",
    createdAt: "2026-09-10T09:30:00.000Z",
  },
  {
    id: "res_mock_2",
    code: "KXP92LMA4T",
    guestName: "Lucas",
    guestsCount: 1,
    checkIn: "2026-09-20T15:00:00.000Z",
    checkOut: "2026-09-23T11:00:00.000Z",
    isUsed: false,
    propertyLabel: "Loft Canal Saint-Martin",
    createdAt: "2026-09-12T14:00:00.000Z",
  },
  {
    id: "res_mock_3",
    code: "BRT77WNQ1Z",
    guestName: "Sophie",
    guestsCount: 3,
    checkIn: "2026-08-20T15:00:00.000Z",
    checkOut: "2026-08-25T11:00:00.000Z",
    isUsed: true,
    propertyLabel: "T2 Montmartre",
    createdAt: "2026-08-18T10:00:00.000Z",
  },
];
