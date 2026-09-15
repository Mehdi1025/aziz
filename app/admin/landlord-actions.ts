"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-log";
import { parseFrenchDateParam } from "@/lib/parse-french-date";
import { buildPassUrl } from "@/lib/parse-reservation-link";
import { prisma } from "@/lib/prisma";
import type {
  KeyDepositRow,
  KeyDepositStatus,
  LandlordRow,
  SubscriptionPlanRow,
  SubscriptionRow,
  SubscriptionStatus,
} from "@/lib/subscription-types";

const landlordInclude = {
  subscriptions: {
    include: { plan: true },
    orderBy: { startedAt: "desc" as const },
  },
  keyDeposits: {
    include: {
      distributor: { include: { city: true } },
      reservations: {
        orderBy: { checkIn: "desc" as const },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

function mapKeyDeposit(key: {
  id: string;
  landlordId: string;
  subscriptionId: string;
  propertyLabel: string;
  propertyAddress: string | null;
  distributorId: string | null;
  distributor: {
    name: string;
    city: { name: string };
  } | null;
  boxNumber: number | null;
  status: string;
  notes: string | null;
  depositedAt: Date | null;
  createdAt: Date;
  reservations: { code: string; checkOut: Date; isUsed: boolean }[];
}): KeyDepositRow {
  const now = new Date();
  const activeReservation =
    key.reservations.find(
      (reservation) => !reservation.isUsed && reservation.checkOut >= now,
    ) ?? null;

  return {
    id: key.id,
    landlordId: key.landlordId,
    subscriptionId: key.subscriptionId,
    propertyLabel: key.propertyLabel,
    propertyAddress: key.propertyAddress,
    distributorId: key.distributorId,
    distributorName: key.distributor?.name ?? null,
    cityName: key.distributor?.city.name ?? null,
    boxNumber: key.boxNumber,
    status: key.status as KeyDepositStatus,
    notes: key.notes,
    depositedAt: key.depositedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
    activeReservationCode: activeReservation?.code ?? null,
  };
}

function mapSubscription(
  subscription: {
    id: string;
    landlordId: string;
    planId: string;
    status: string;
    startedAt: Date;
    renewsAt: Date;
    canceledAt: Date | null;
    plan: {
      slug: string;
      name: string;
      maxKeys: number;
      priceMonthly: number;
    };
  },
  keys: KeyDepositRow[],
): SubscriptionRow {
  const activeKeys = keys.filter((key) => key.status !== "inactive");
  return {
    id: subscription.id,
    landlordId: subscription.landlordId,
    planId: subscription.planId,
    planSlug: subscription.plan.slug,
    planName: subscription.plan.name,
    maxKeys: subscription.plan.maxKeys,
    priceMonthly: subscription.plan.priceMonthly,
    status: subscription.status as SubscriptionStatus,
    startedAt: subscription.startedAt.toISOString(),
    renewsAt: subscription.renewsAt.toISOString(),
    canceledAt: subscription.canceledAt?.toISOString() ?? null,
    keysUsed: activeKeys.length,
    keysInLocker: activeKeys.filter((key) => key.status === "in_locker").length,
  };
}

function mapLandlord(landlord: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: Date;
  subscriptions: Array<{
    id: string;
    landlordId: string;
    planId: string;
    status: string;
    startedAt: Date;
    renewsAt: Date;
    canceledAt: Date | null;
    plan: {
      slug: string;
      name: string;
      maxKeys: number;
      priceMonthly: number;
    };
  }>;
  keyDeposits: Array<Parameters<typeof mapKeyDeposit>[0]>;
}): LandlordRow {
  const keys = landlord.keyDeposits.map(mapKeyDeposit);
  const currentSubscription =
    landlord.subscriptions.find((sub) => sub.status !== "canceled") ??
    landlord.subscriptions[0] ??
    null;

  return {
    id: landlord.id,
    name: landlord.name,
    email: landlord.email,
    phone: landlord.phone,
    company: landlord.company,
    createdAt: landlord.createdAt.toISOString(),
    subscription: currentSubscription
      ? mapSubscription(currentSubscription, keys)
      : null,
    keys,
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanRow[]> {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
  });

  return plans.map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    maxKeys: plan.maxKeys,
    priceMonthly: plan.priceMonthly,
    isActive: plan.isActive,
  }));
}

export async function getLandlords(): Promise<LandlordRow[]> {
  const landlords = await prisma.landlord.findMany({
    include: landlordInclude,
    orderBy: { createdAt: "desc" },
  });

  return landlords.map(mapLandlord);
}

async function getActiveSubscription(landlordId: string) {
  return prisma.subscription.findFirst({
    where: {
      landlordId,
      status: { in: ["active", "trial", "past_due"] },
    },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
}

async function countActiveKeys(subscriptionId: string) {
  return prisma.keyDeposit.count({
    where: {
      subscriptionId,
      status: { not: "inactive" },
    },
  });
}

async function isBoxAvailable(
  distributorId: string,
  boxNumber: number,
  excludeKeyId?: string,
) {
  const distributor = await prisma.distributor.findUnique({
    where: { id: distributorId },
  });
  if (!distributor || !distributor.isActive) {
    return { ok: false as const, error: "Distributeur indisponible." };
  }
  if (boxNumber < 1 || boxNumber > distributor.totalBoxes) {
    return {
      ok: false as const,
      error: `Casier invalide (1–${distributor.totalBoxes}).`,
    };
  }

  const occupiedReservation = await prisma.reservation.findFirst({
    where: {
      distributorId,
      boxNumber,
      checkOut: { gte: new Date() },
    },
  });
  if (occupiedReservation) {
    return { ok: false as const, error: "Casier déjà réservé." };
  }

  const occupiedKey = await prisma.keyDeposit.findFirst({
    where: {
      distributorId,
      boxNumber,
      status: "in_locker",
      ...(excludeKeyId ? { id: { not: excludeKeyId } } : {}),
    },
  });
  if (occupiedKey) {
    return { ok: false as const, error: "Casier déjà utilisé par une clé." };
  }

  return { ok: true as const };
}

export type CreateLandlordInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  planId: string;
  status?: SubscriptionStatus;
};

export async function createLandlordWithSubscription(
  input: CreateLandlordInput,
): Promise<{ ok: true; landlord: LandlordRow } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Nom et e-mail requis." };
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan || !plan.isActive) {
    return { ok: false, error: "Formule introuvable." };
  }

  const existing = await prisma.landlord.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Un loueur avec cet e-mail existe déjà." };
  }

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  const landlord = await prisma.landlord.create({
    data: {
      name,
      email,
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      subscriptions: {
        create: {
          planId: plan.id,
          status: input.status ?? "active",
          renewsAt,
        },
      },
    },
    include: landlordInclude,
  });

  await logActivity({
    type: "SUBSCRIPTION_CREATED",
    details: `Abonnement ${plan.name} · ${name} (${email})`,
  });

  revalidatePath("/admin");
  return { ok: true, landlord: mapLandlord(landlord) };
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, landlord: true },
  });
  if (!subscription) {
    return { ok: false, error: "Abonnement introuvable." };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status,
      canceledAt: status === "canceled" ? new Date() : null,
    },
  });

  await logActivity({
    type: "SUBSCRIPTION_UPDATED",
    details: `${subscription.landlord.name} · ${subscription.plan.name} → ${status}`,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export type AddKeyDepositInput = {
  landlordId: string;
  propertyLabel: string;
  propertyAddress?: string;
  notes?: string;
};

export async function addKeyDeposit(
  input: AddKeyDepositInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const propertyLabel = input.propertyLabel.trim();
  if (!propertyLabel) {
    return { ok: false, error: "Nom du logement requis." };
  }

  const subscription = await getActiveSubscription(input.landlordId);
  if (!subscription) {
    return { ok: false, error: "Aucun abonnement actif pour ce loueur." };
  }

  if (!["active", "trial"].includes(subscription.status)) {
    return {
      ok: false,
      error: "Abonnement impayé ou résilié — régularisez avant d'ajouter des clés.",
    };
  }

  const keyCount = await countActiveKeys(subscription.id);
  if (keyCount >= subscription.plan.maxKeys) {
    return {
      ok: false,
      error: `Quota atteint (${subscription.plan.maxKeys} clé${subscription.plan.maxKeys > 1 ? "s" : ""} max).`,
    };
  }

  const landlord = await prisma.landlord.findUnique({
    where: { id: input.landlordId },
  });
  if (!landlord) {
    return { ok: false, error: "Loueur introuvable." };
  }

  await prisma.keyDeposit.create({
    data: {
      landlordId: input.landlordId,
      subscriptionId: subscription.id,
      propertyLabel,
      propertyAddress: input.propertyAddress?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "pending_deposit",
    },
  });

  await logActivity({
    type: "KEY_REGISTERED",
    details: `Clé enregistrée · ${propertyLabel} · ${landlord.name}`,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export type DepositKeyInLockerInput = {
  keyId: string;
  distributorId: string;
  boxNumber: number;
};

export async function depositKeyInLocker(
  input: DepositKeyInLockerInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = await prisma.keyDeposit.findUnique({
    where: { id: input.keyId },
    include: { landlord: true, subscription: { include: { plan: true } } },
  });
  if (!key) {
    return { ok: false, error: "Clé introuvable." };
  }

  if (!["pending_deposit", "checked_out"].includes(key.status)) {
    return { ok: false, error: "Cette clé ne peut pas être déposée." };
  }

  const boxCheck = await isBoxAvailable(
    input.distributorId,
    input.boxNumber,
    key.id,
  );
  if (!boxCheck.ok) {
    return boxCheck;
  }

  const distributor = await prisma.distributor.findUnique({
    where: { id: input.distributorId },
    include: { city: true },
  });
  if (!distributor) {
    return { ok: false, error: "Distributeur introuvable." };
  }

  await prisma.keyDeposit.update({
    where: { id: key.id },
    data: {
      distributorId: input.distributorId,
      boxNumber: input.boxNumber,
      status: "in_locker",
      depositedAt: new Date(),
    },
  });

  await logActivity({
    type: "KEY_DEPOSITED",
    distributorId: distributor.id,
    boxNumber: input.boxNumber,
    details: `Clé déposée · ${key.propertyLabel} · ${distributor.city.name} ${distributor.name}`,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export type CreateClientPassInput = {
  keyId: string;
  code: string;
  in: string;
  out: string;
};

export async function createClientPassFromKey(
  input: CreateClientPassInput,
): Promise<
  | { ok: true; passUrl: string; code: string }
  | { ok: false; error: string }
> {
  const code = input.code.trim();
  if (!code) {
    return { ok: false, error: "Code pass requis." };
  }

  const key = await prisma.keyDeposit.findUnique({
    where: { id: input.keyId },
    include: {
      landlord: true,
      distributor: { include: { city: true } },
      subscription: { include: { plan: true } },
    },
  });

  if (!key) {
    return { ok: false, error: "Clé introuvable." };
  }

  if (key.status !== "in_locker" || !key.distributorId || !key.boxNumber) {
    return {
      ok: false,
      error: "La clé doit être déposée en casier avant de créer un pass client.",
    };
  }

  if (!["active", "trial"].includes(key.subscription.status)) {
    return { ok: false, error: "Abonnement du loueur inactif ou impayé." };
  }

  const validFromResult = parseFrenchDateParam(input.in, "in");
  if (!validFromResult.ok) {
    return { ok: false, error: validFromResult.error };
  }

  const validToResult = parseFrenchDateParam(input.out, "out");
  if (!validToResult.ok) {
    return { ok: false, error: validToResult.error };
  }

  if (validToResult.date <= validFromResult.date) {
    return {
      ok: false,
      error: "La date de fin doit être postérieure à la date de début.",
    };
  }

  const existingCode = await prisma.reservation.findUnique({ where: { code } });
  if (existingCode) {
    return { ok: false, error: "Ce code est déjà utilisé." };
  }

  const distributor = key.distributor!;

  await prisma.reservation.create({
    data: {
      code,
      distributorId: distributor.id,
      boxNumber: key.boxNumber,
      checkIn: validFromResult.date,
      checkOut: validToResult.date,
      keyDepositId: key.id,
    },
  });

  await logActivity({
    type: "KEY_PASS_CREATED",
    distributorId: distributor.id,
    code,
    boxNumber: key.boxNumber,
    details: `Pass client · ${key.propertyLabel} · ${key.landlord.name}`,
  });

  revalidatePath("/admin");
  revalidatePath("/pass");

  return {
    ok: true,
    code,
    passUrl: buildPassUrl({
      code,
      in: input.in.trim(),
      out: input.out.trim(),
      box: String(key.boxNumber),
      site: distributor.slug,
    }),
  };
}
