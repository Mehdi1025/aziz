import { RecupererClient } from "@/app/recuperer/recuperer-client";

/**
 * /recuperer — Le voyageur colle le lien hôte (8 paramètres).
 * Le nettoyage et la redirection sont gérés par parseReservationLink :
 * code, in, out, name, guests, keyId, box, site → /pass avec encodeURIComponent.
 */
export default function RecupererPage() {
  return <RecupererClient />;
}
