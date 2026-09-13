export const TOTAL_BOXES = Math.max(
  1,
  Number.parseInt(process.env.TOTAL_BOXES ?? "12", 10) || 12,
);

export const ADMIN_POLL_INTERVAL_MS = 20_000;

export const ADMIN_HEALTH_CHECK_INTERVAL_MS = 30_000;
