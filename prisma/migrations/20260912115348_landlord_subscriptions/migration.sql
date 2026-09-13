-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxKeys" INTEGER NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Landlord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landlordId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" DATETIME NOT NULL,
    "canceledAt" DATETIME,
    CONSTRAINT "Subscription_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeyDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landlordId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "propertyLabel" TEXT NOT NULL,
    "propertyAddress" TEXT,
    "distributorId" TEXT,
    "boxNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending_deposit',
    "notes" TEXT,
    "depositedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyDeposit_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Landlord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeyDeposit_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KeyDeposit_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Distributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "totalBoxes" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Distributor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Distributor" ("address", "cityId", "createdAt", "departmentCode", "departmentName", "id", "isActive", "latitude", "longitude", "name", "slug", "totalBoxes") SELECT "address", "cityId", "createdAt", "departmentCode", "departmentName", "id", "isActive", "latitude", "longitude", "name", "slug", "totalBoxes" FROM "Distributor";
DROP TABLE "Distributor";
ALTER TABLE "new_Distributor" RENAME TO "Distributor";
CREATE UNIQUE INDEX "Distributor_slug_key" ON "Distributor"("slug");
CREATE INDEX "Distributor_cityId_idx" ON "Distributor"("cityId");
CREATE INDEX "Distributor_departmentCode_idx" ON "Distributor"("departmentCode");
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" DATETIME,
    "keyDepositId" TEXT,
    CONSTRAINT "Reservation_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_keyDepositId_fkey" FOREIGN KEY ("keyDepositId") REFERENCES "KeyDeposit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("boxNumber", "code", "distributorId", "id", "isUsed", "scannedAt", "validFrom", "validTo") SELECT "boxNumber", "code", "distributorId", "id", "isUsed", "scannedAt", "validFrom", "validTo" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");
CREATE INDEX "Reservation_distributorId_boxNumber_idx" ON "Reservation"("distributorId", "boxNumber");
CREATE INDEX "Reservation_keyDepositId_idx" ON "Reservation"("keyDepositId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Landlord_email_key" ON "Landlord"("email");

-- CreateIndex
CREATE INDEX "Subscription_landlordId_idx" ON "Subscription"("landlordId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "KeyDeposit_landlordId_idx" ON "KeyDeposit"("landlordId");

-- CreateIndex
CREATE INDEX "KeyDeposit_subscriptionId_idx" ON "KeyDeposit"("subscriptionId");

-- CreateIndex
CREATE INDEX "KeyDeposit_distributorId_boxNumber_idx" ON "KeyDeposit"("distributorId", "boxNumber");
