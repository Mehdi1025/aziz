"use client";

import { motion } from "framer-motion";
import { Check, Copy, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { heading, muted, panel, subheading } from "@/lib/admin-theme";
import type { KeyDepositRow } from "@/lib/subscription-types";

const DEFAULT_ORIGIN = "https://aziz-beta-six.vercel.app";

type AirbnbMessageGeneratorProps = {
  keys: KeyDepositRow[];
  distributorSlugs: Record<string, string>;
  isLight: boolean;
};

function buildFullAirbnbMessage(
  origin: string,
  keyDeposit: KeyDepositRow,
  siteSlug: string,
): string {
  const base = origin.replace(/\/$/, "");
  const passUrl =
    `${base}/pass?code=[Code de confirmation]` +
    `&in=[Date d'arrivée]` +
    `&out=[Date de départ]` +
    `&name=[Prénom du voyageur]` +
    `&guests=[Nombre de voyageurs]` +
    `&keyId=${keyDeposit.id}` +
    `&box=${keyDeposit.boxNumber ?? ""}` +
    `&site=${siteSlug}`;

  return `Bonjour ! Merci pour votre réservation.

Pour récupérer votre clé dans le distributeur automatique à votre arrivée, veuillez suivre ces deux étapes simples :

Étape 1 : Copiez votre lien de confirmation personnel ci-dessous :
${passUrl}

Étape 2 : Rendez-vous sur notre page sécurisée de récupération, collez votre lien dans le champ prévu à cet effet, et le système se chargera d'afficher instantanément votre QR code d'accès :
${base}/recuperer

Bon voyage et à très vite !`;
}

export function AirbnbMessageGenerator({
  keys,
  distributorSlugs,
  isLight,
}: AirbnbMessageGeneratorProps) {
  const eligibleKeys = useMemo(
    () => keys.filter((k) => k.status === "in_locker"),
    [keys],
  );

  const [selectedKeyId, setSelectedKeyId] = useState(eligibleKeys[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const selectedKey = eligibleKeys.find((k) => k.id === selectedKeyId) ?? null;

  const fullMessage = useMemo(() => {
    if (!selectedKey) return "";
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : DEFAULT_ORIGIN;
    const siteSlug = selectedKey.distributorId
      ? (distributorSlugs[selectedKey.distributorId] ?? "paris-opera")
      : "paris-opera";
    return buildFullAirbnbMessage(origin, selectedKey, siteSlug);
  }, [selectedKey, distributorSlugs]);

  async function handleCopy() {
    if (!fullMessage) return;
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (eligibleKeys.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 rounded-3xl p-6 sm:p-8 backdrop-blur-xl ${panel(isLight)}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2">
            <MessageSquareText
              className={`h-4 w-4 ${isLight ? "text-violet-500" : "text-violet-400"}`}
            />
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Message Airbnb
            </p>
          </div>
          <h2 className={`text-lg font-black tracking-tight ${heading(isLight)}`}>
            Message prêt à envoyer
          </h2>
          <p className={`mt-1 max-w-xl text-sm leading-relaxed ${muted(isLight)}`}>
            Copiez ce message complet et collez-le dans vos messages automatiques Airbnb.
            Les crochets{" "}
            <span className="font-mono text-[11px]">[Code de confirmation]</span> restent
            tels quels — remplacez-les par les variables Airbnb côté plateforme.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="message-key"
          className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}
        >
          Logement
        </label>
        <select
          id="message-key"
          value={selectedKeyId}
          onChange={(e) => setSelectedKeyId(e.target.value)}
          className={`w-full max-w-md rounded-xl border px-4 py-3 text-sm outline-none transition-colors ${
            isLight
              ? "border-zinc-200 bg-zinc-50 text-zinc-900 focus:border-violet-300"
              : "border-white/10 bg-white/[0.04] text-white focus:border-violet-500/40"
          }`}
        >
          {eligibleKeys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.propertyLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <pre
          className={`max-h-[420px] overflow-auto rounded-2xl border px-5 py-5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            isLight
              ? "border-zinc-200 bg-zinc-50 text-zinc-700"
              : "border-white/10 bg-zinc-950/60 text-neutral-300"
          }`}
          style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
        >
          {fullMessage}
        </pre>

        <motion.div
          className="mt-4 flex justify-end"
          initial={false}
          animate={copied ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <motion.button
            type="button"
            onClick={handleCopy}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
              copied
                ? isLight
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500 text-white"
                : isLight
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-white text-zinc-950 hover:bg-neutral-100"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Copié !
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copier le message complet
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}
