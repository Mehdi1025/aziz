export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";

export type KeyDepositStatus =
  | "pending_deposit"
  | "in_locker"
  | "checked_out"
  | "inactive";

export type SubscriptionPlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  maxKeys: number;
  priceMonthly: number;
  isActive: boolean;
};

export type KeyDepositRow = {
  id: string;
  landlordId: string;
  subscriptionId: string;
  propertyLabel: string;
  propertyAddress: string | null;
  distributorId: string | null;
  distributorName: string | null;
  cityName: string | null;
  boxNumber: number | null;
  status: KeyDepositStatus;
  notes: string | null;
  depositedAt: string | null;
  createdAt: string;
  activeReservationCode: string | null;
};

export type SubscriptionRow = {
  id: string;
  landlordId: string;
  planId: string;
  planSlug: string;
  planName: string;
  maxKeys: number;
  priceMonthly: number;
  status: SubscriptionStatus;
  startedAt: string;
  renewsAt: string;
  canceledAt: string | null;
  keysUsed: number;
  keysInLocker: number;
};

export type LandlordRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  subscription: SubscriptionRow | null;
  keys: KeyDepositRow[];
};

export type SubscriptionKpis = {
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  monthlyRevenueCents: number;
  totalKeysUsed: number;
  totalKeysAllowed: number;
  keysInLockers: number;
  keysPendingDeposit: number;
};

export const SUBSCRIPTION_STATUS_META: Record<
  SubscriptionStatus,
  { label: string; color: string }
> = {
  trial: { label: "Essai", color: "#38bdf8" },
  active: { label: "Actif", color: "#10b981" },
  past_due: { label: "Impayé", color: "#f97316" },
  canceled: { label: "Résilié", color: "#71717a" },
};

export const KEY_STATUS_META: Record<
  KeyDepositStatus,
  { label: string; color: string }
> = {
  pending_deposit: { label: "À déposer", color: "#f59e0b" },
  in_locker: { label: "En casier", color: "#10b981" },
  checked_out: { label: "Récupérée", color: "#38bdf8" },
  inactive: { label: "Inactive", color: "#71717a" },
};

export function formatPriceMonthly(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function isSubscriptionBillable(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trial";
}

export function canAddKey(
  subscription: SubscriptionRow | null,
  currentKeyCount: number,
): boolean {
  if (!subscription || !isSubscriptionBillable(subscription.status)) {
    return false;
  }
  return currentKeyCount < subscription.maxKeys;
}
