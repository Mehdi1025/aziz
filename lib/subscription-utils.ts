import type {
  KeyDepositRow,
  LandlordRow,
  SubscriptionKpis,
  SubscriptionRow,
} from "@/lib/subscription-types";
import { isSubscriptionBillable } from "@/lib/subscription-types";

export function computeSubscriptionKpis(landlords: LandlordRow[]): SubscriptionKpis {
  let activeSubscriptions = 0;
  let trialSubscriptions = 0;
  let pastDueSubscriptions = 0;
  let monthlyRevenueCents = 0;
  let totalKeysUsed = 0;
  let totalKeysAllowed = 0;
  let keysInLockers = 0;
  let keysPendingDeposit = 0;

  for (const landlord of landlords) {
    const sub = landlord.subscription;
    if (!sub) continue;

    if (sub.status === "active") activeSubscriptions += 1;
    if (sub.status === "trial") trialSubscriptions += 1;
    if (sub.status === "past_due") pastDueSubscriptions += 1;

    if (isSubscriptionBillable(sub.status)) {
      monthlyRevenueCents += sub.priceMonthly;
      totalKeysAllowed += sub.maxKeys;
    }

    const activeKeys = landlord.keys.filter((key) => key.status !== "inactive");
    totalKeysUsed += activeKeys.length;
    keysInLockers += activeKeys.filter((key) => key.status === "in_locker").length;
    keysPendingDeposit += activeKeys.filter(
      (key) => key.status === "pending_deposit",
    ).length;
  }

  return {
    activeSubscriptions,
    trialSubscriptions,
    pastDueSubscriptions,
    monthlyRevenueCents,
    totalKeysUsed,
    totalKeysAllowed,
    keysInLockers,
    keysPendingDeposit,
  };
}

export function getSubscriptionUsage(subscription: SubscriptionRow): number {
  return Math.min(
    100,
    subscription.maxKeys > 0
      ? Math.round((subscription.keysUsed / subscription.maxKeys) * 100)
      : 0,
  );
}

export function filterLandlords(
  landlords: LandlordRow[],
  query: string,
  statusFilter: "all" | "active" | "past_due" | "trial" | "none",
): LandlordRow[] {
  const normalized = query.trim().toLowerCase();

  return landlords.filter((landlord) => {
    const matchesQuery =
      !normalized ||
      landlord.name.toLowerCase().includes(normalized) ||
      landlord.email.toLowerCase().includes(normalized) ||
      (landlord.company?.toLowerCase().includes(normalized) ?? false) ||
      landlord.keys.some((key) =>
        key.propertyLabel.toLowerCase().includes(normalized),
      );

    if (!matchesQuery) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "none") return !landlord.subscription;
    return landlord.subscription?.status === statusFilter;
  });
}

export function findKeyById(
  landlords: LandlordRow[],
  keyId: string,
): { landlord: LandlordRow; key: KeyDepositRow } | null {
  for (const landlord of landlords) {
    const key = landlord.keys.find((item) => item.id === keyId);
    if (key) return { landlord, key };
  }
  return null;
}
