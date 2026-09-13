-- Adresses réelles + coordonnées GPS + départements

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Distributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL NOT NULL DEFAULT 46.603354,
    "longitude" REAL NOT NULL DEFAULT 1.888334,
    "departmentCode" TEXT NOT NULL DEFAULT '00',
    "departmentName" TEXT NOT NULL DEFAULT 'France',
    "cityId" TEXT NOT NULL,
    "totalBoxes" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Distributor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Distributor" ("id", "slug", "name", "address", "latitude", "longitude", "departmentCode", "departmentName", "cityId", "totalBoxes", "isActive", "createdAt")
SELECT "id", "slug", "name", "address", 46.603354, 1.888334, '00', 'France', "cityId", "totalBoxes", "isActive", "createdAt"
FROM "Distributor";

DROP TABLE "Distributor";
ALTER TABLE "new_Distributor" RENAME TO "Distributor";
CREATE UNIQUE INDEX "Distributor_slug_key" ON "Distributor"("slug");
CREATE INDEX "Distributor_cityId_idx" ON "Distributor"("cityId");
CREATE INDEX "Distributor_departmentCode_idx" ON "Distributor"("departmentCode");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
