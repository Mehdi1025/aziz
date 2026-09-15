import "dotenv/config";
import { createClient } from "@libsql/client";
import { getLibSqlConfig } from "../lib/libsql-config";

const MIGRATION_STATEMENTS = [
  `ALTER TABLE "Reservation" ADD COLUMN "guestName" TEXT`,
  `ALTER TABLE "Reservation" ADD COLUMN "guestsCount" INTEGER`,
  `ALTER TABLE "Reservation" ADD COLUMN "createdAt" DATETIME`,
  `UPDATE "Reservation" SET "createdAt" = datetime('now') WHERE "createdAt" IS NULL`,
];

async function main() {
  const config = getLibSqlConfig();
  if (!config.url.startsWith("libsql://")) {
    throw new Error("DATABASE_URL must be a libsql:// Turso URL.");
  }

  const client = createClient({
    url: config.url,
    authToken: "authToken" in config ? config.authToken : undefined,
  });

  for (const sql of MIGRATION_STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("OK:", sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("duplicate column") || message.includes("already exists")) {
        console.log("SKIP (already exists):", sql);
        continue;
      }
      throw error;
    }
  }

  console.log("Guest capture migration complete.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
