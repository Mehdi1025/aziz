import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getLibSqlConfig } from "../lib/libsql-config";

function stripSqlComments(sql: string) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

async function main() {
  const config = getLibSqlConfig();
  if (!config.url.startsWith("libsql://")) {
    throw new Error("DATABASE_URL must be a libsql:// Turso URL.");
  }

  const sqlPath = join(process.cwd(), "prisma", "turso-init.sql");
  const sql = stripSqlComments(readFileSync(sqlPath, "utf8"));

  const client = createClient({
    url: config.url,
    authToken: "authToken" in config ? config.authToken : undefined,
  });

  console.log("Applying schema to Turso…");
  await client.executeMultiple(sql);
  console.log("Schema applied successfully.");
}

main()
  .catch((error) => {
    console.error("Turso schema push failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
