import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion?: string;
};

/** Incrémenter après changement de schéma pour invalider le singleton dev. */
const PRISMA_CLIENT_VERSION = "landlords-v1";

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma;

  if (
    existing &&
    globalForPrisma.prismaVersion === PRISMA_CLIENT_VERSION &&
    "activityLog" in existing &&
    "reservation" in existing &&
    "distributor" in existing &&
    "city" in existing &&
    "landlord" in existing &&
    "subscriptionPlan" in existing &&
    "subscription" in existing &&
    "keyDeposit" in existing
  ) {
    return existing;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
  return client;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
