-- City + Distributor hierarchy (Ville → Distributeur → Casiers)

CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

CREATE TABLE "Distributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "cityId" TEXT NOT NULL,
    "totalBoxes" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Distributor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Distributor_slug_key" ON "Distributor"("slug");
CREATE INDEX "Distributor_cityId_idx" ON "Distributor"("cityId");

-- Seed cities from existing Location data
INSERT INTO "City" ("id", "slug", "name", "region", "createdAt")
SELECT
  'city_' || LOWER(REPLACE(REPLACE(city, ' ', '_'), '''', '')),
  LOWER(REPLACE(REPLACE(city, ' ', '-'), '''', '')),
  city,
  region,
  CURRENT_TIMESTAMP
FROM "Location"
GROUP BY city, region;

-- Fix Paris duplicate slug issue: only one paris city
-- (GROUP BY already handles this)

-- Map old Location → new Distributor (preserve reservation links)
INSERT INTO "Distributor" ("id", "slug", "name", "address", "cityId", "totalBoxes", "isActive", "createdAt")
SELECT
  CASE "Location"."id"
    WHEN 'loc_paris_opera' THEN 'dist_paris_opera'
    WHEN 'loc_paris_montmartre' THEN 'dist_paris_montmartre'
    WHEN 'loc_lyon_partdieu' THEN 'dist_lyon_partdieu'
    WHEN 'loc_marseille_vieuxport' THEN 'dist_marseille_vieuxport'
    WHEN 'loc_nice_promenade' THEN 'dist_nice_promenade'
    WHEN 'loc_bordeaux_centre' THEN 'dist_bordeaux_bourse'
    WHEN 'loc_toulouse_capitole' THEN 'dist_toulouse_capitole'
    WHEN 'loc_nantes_gare' THEN 'dist_nantes_gare'
    WHEN 'loc_lille_flandres' THEN 'dist_lille_flandres'
    WHEN 'loc_strasbourg_centre' THEN 'dist_strasbourg_petitefrance'
    WHEN 'loc_rennes_gare' THEN 'dist_rennes_gare'
    WHEN 'loc_montpellier_comedie' THEN 'dist_montpellier_comedie'
    WHEN 'loc_grenoble_gare' THEN 'dist_grenoble_gare'
    WHEN 'loc_nancy_stanislas' THEN 'dist_nancy_stanislas'
    WHEN 'loc_reims_cathedrale' THEN 'dist_reims_cathedrale'
    ELSE 'dist_' || "Location"."slug"
  END,
  CASE "Location"."slug"
    WHEN 'bordeaux-centre' THEN 'bordeaux-bourse'
    WHEN 'strasbourg-centre' THEN 'strasbourg-petite-france'
    ELSE "Location"."slug"
  END,
  CASE
    WHEN "Location"."name" LIKE 'Distributeur %' THEN SUBSTR("Location"."name", 14)
    ELSE "Location"."name"
  END,
  "Location"."address",
  (SELECT c."id" FROM "City" c WHERE c."name" = "Location"."city" AND c."region" = "Location"."region" LIMIT 1),
  "Location"."totalBoxes",
  "Location"."isActive",
  "Location"."createdAt"
FROM "Location";

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- ActivityLog with distributorId
CREATE TABLE "new_ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "distributorId" TEXT,
    "code" TEXT,
    "boxNumber" INTEGER,
    "reservationId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActivityLog" ("id", "type", "distributorId", "code", "boxNumber", "reservationId", "details", "createdAt")
SELECT
  al."id",
  al."type",
  CASE l."id"
    WHEN 'loc_paris_opera' THEN 'dist_paris_opera'
    WHEN 'loc_paris_montmartre' THEN 'dist_paris_montmartre'
    WHEN 'loc_lyon_partdieu' THEN 'dist_lyon_partdieu'
    WHEN 'loc_marseille_vieuxport' THEN 'dist_marseille_vieuxport'
    WHEN 'loc_nice_promenade' THEN 'dist_nice_promenade'
    WHEN 'loc_bordeaux_centre' THEN 'dist_bordeaux_bourse'
    WHEN 'loc_toulouse_capitole' THEN 'dist_toulouse_capitole'
    WHEN 'loc_nantes_gare' THEN 'dist_nantes_gare'
    WHEN 'loc_lille_flandres' THEN 'dist_lille_flandres'
    WHEN 'loc_strasbourg_centre' THEN 'dist_strasbourg_petitefrance'
    WHEN 'loc_rennes_gare' THEN 'dist_rennes_gare'
    WHEN 'loc_montpellier_comedie' THEN 'dist_montpellier_comedie'
    WHEN 'loc_grenoble_gare' THEN 'dist_grenoble_gare'
    WHEN 'loc_nancy_stanislas' THEN 'dist_nancy_stanislas'
    WHEN 'loc_reims_cathedrale' THEN 'dist_reims_cathedrale'
    ELSE 'dist_' || l."slug"
  END,
  al."code",
  al."boxNumber",
  al."reservationId",
  al."details",
  al."createdAt"
FROM "ActivityLog" al
LEFT JOIN "Location" l ON l."id" = al."locationId";
DROP TABLE "ActivityLog";
ALTER TABLE "new_ActivityLog" RENAME TO "ActivityLog";

-- Reservation with distributorId
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "boxNumber" INTEGER NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" DATETIME,
    CONSTRAINT "Reservation_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("id", "code", "distributorId", "boxNumber", "validFrom", "validTo", "isUsed", "scannedAt")
SELECT
  r."id",
  r."code",
  CASE l."id"
    WHEN 'loc_paris_opera' THEN 'dist_paris_opera'
    WHEN 'loc_paris_montmartre' THEN 'dist_paris_montmartre'
    WHEN 'loc_lyon_partdieu' THEN 'dist_lyon_partdieu'
    WHEN 'loc_marseille_vieuxport' THEN 'dist_marseille_vieuxport'
    WHEN 'loc_nice_promenade' THEN 'dist_nice_promenade'
    WHEN 'loc_bordeaux_centre' THEN 'dist_bordeaux_bourse'
    WHEN 'loc_toulouse_capitole' THEN 'dist_toulouse_capitole'
    WHEN 'loc_nantes_gare' THEN 'dist_nantes_gare'
    WHEN 'loc_lille_flandres' THEN 'dist_lille_flandres'
    WHEN 'loc_strasbourg_centre' THEN 'dist_strasbourg_petitefrance'
    WHEN 'loc_rennes_gare' THEN 'dist_rennes_gare'
    WHEN 'loc_montpellier_comedie' THEN 'dist_montpellier_comedie'
    WHEN 'loc_grenoble_gare' THEN 'dist_grenoble_gare'
    WHEN 'loc_nancy_stanislas' THEN 'dist_nancy_stanislas'
    WHEN 'loc_reims_cathedrale' THEN 'dist_reims_cathedrale'
    ELSE 'dist_' || l."slug"
  END,
  r."boxNumber",
  r."validFrom",
  r."validTo",
  r."isUsed",
  r."scannedAt"
FROM "Reservation" r
JOIN "Location" l ON l."id" = r."locationId";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");
CREATE INDEX "Reservation_distributorId_boxNumber_idx" ON "Reservation"("distributorId", "boxNumber");

DROP TABLE "Location";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
