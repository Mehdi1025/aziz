/**
 * Anciens identifiants mock (messages Airbnb déjà envoyés) → clés Turso seed.
 */
const LEGACY_KEY_ID_MAP: Record<string, string> = {
  key_marais: "demo-key-sophie-t1",
  key_bastille: "demo-key-sophie-t2",
  key_canal: "demo-key-sophie-t3",
  key_montmartre: "demo-key-sophie-t1",
};

/** Résout un keyId historique vers l'id Prisma actuel. */
export function resolveLegacyKeyId(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return LEGACY_KEY_ID_MAP[trimmed] ?? trimmed;
}
