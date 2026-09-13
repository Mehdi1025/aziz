-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "scannedAt" DATETIME;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "boxNumber" INTEGER,
    "reservationId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
