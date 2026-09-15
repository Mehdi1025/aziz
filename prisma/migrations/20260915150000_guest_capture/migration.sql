-- Guest capture fields for multi-tenant host acquisition funnel
ALTER TABLE "Reservation" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "guestsCount" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
