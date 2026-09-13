export function getLibSqlConfig() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (authToken && url.startsWith("libsql://")) {
    return { url, authToken };
  }

  return { url };
}
