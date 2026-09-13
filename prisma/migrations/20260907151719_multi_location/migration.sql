-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "totalBoxes" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- Seed emplacements France
INSERT INTO "Location" ("id", "slug", "name", "city", "region", "address", "totalBoxes", "isActive", "createdAt") VALUES
  ('loc_paris_opera', 'paris-opera', 'Distributeur Opéra', 'Paris', 'Île-de-France', 'Place de l''Opéra, 75009 Paris', 12, true, CURRENT_TIMESTAMP),
  ('loc_lyon_partdieu', 'lyon-part-dieu', 'Distributeur Part-Dieu', 'Lyon', 'Auvergne-Rhône-Alpes', 'Gare Part-Dieu, 69003 Lyon', 10, true, CURRENT_TIMESTAMP),
  ('loc_marseille_vieuxport', 'marseille-vieux-port', 'Distributeur Vieux-Port', 'Marseille', 'Provence-Alpes-Côte d''Azur', 'Quai du Port, 13002 Marseille', 8, true, CURRENT_TIMESTAMP),
  ('loc_bordeaux_centre', 'bordeaux-centre', 'Distributeur Centre', 'Bordeaux', 'Nouvelle-Aquitaine', 'Place de la Bourse, 33000 Bordeaux', 10, true, CURRENT_TIMESTAMP),
  ('loc_lille_flandres', 'lille-flandres', 'Distributeur Flandres', 'Lille', 'Hauts-de-France', 'Gare Lille-Flandres, 59000 Lille', 8, true, CURRENT_TIMESTAMP),
  ('loc_nice_promenade', 'nice-promenade', 'Distributeur Promenade', 'Nice', 'Provence-Alpes-Côte d''Azur', 'Promenade des Anglais, 06000 Nice', 6, true, CURRENT_TIMESTAMP),
  ('loc_toulouse_capitole', 'toulouse-capitole', 'Distributeur Capitole', 'Toulouse', 'Occitanie', 'Place du Capitole, 31000 Toulouse', 8, true, CURRENT_TIMESTAMP),
  ('loc_nantes_gare', 'nantes-gare', 'Distributeur Gare Sud', 'Nantes', 'Pays de la Loire', 'Gare de Nantes, 44000 Nantes', 8, true, CURRENT_TIMESTAMP);

-- Redefine ActivityLog with locationId
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "locationId" TEXT,
    "code" TEXT,
    "boxNumber" INTEGER,
    "reservationId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("boxNumber", "code", "createdAt", "details", "id", "reservationId", "type")
SELECT "boxNumber", "code", "createdAt", "details", "id", "reservationId", "type" FROM "ActivityLog";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";

-- Redefine Reservation with locationId (existing rows → Paris Opéra)
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" DATETIME,
    CONSTRAINT "Reservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("id", "code", "locationId", "boxNumber", "validFrom", "validTo", "isUsed", "scannedAt")
SELECT "id", "code", 'loc_paris_opera', "boxNumber", "validFrom", "validTo", "isUsed", "scannedAt" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");
CREATE INDEX "Reservation_locationId_boxNumber_idx" ON "Reservation"("locationId", "boxNumber");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
