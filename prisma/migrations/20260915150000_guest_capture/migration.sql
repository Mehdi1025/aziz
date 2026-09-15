-- Guest capture fields for multi-tenant host acquisition funnel
-- SQLite/Turso: no non-constant DEFAULT on ALTER TABLE — add nullable then backfill.
ALTER TABLE "Reservation" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "guestsCount" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN "createdAt" DATETIME;
UPDATE "Reservation" SET "createdAt" = datetime('now') WHERE "createdAt" IS NULL;
