"use client";

import { motion } from "framer-motion";
import { Check, Copy, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { heading, muted, panel, subheading } from "@/lib/admin-theme";
import type { KeyDepositRow } from "@/lib/subscription-types";

type AirbnbMessageGeneratorProps = {
  keys: KeyDepositRow[];
  distributorSlugs: Record<string, string>;
  isLight: boolean;
};

function buildAirbnbMessageTemplate(
  origin: string,
  keyDeposit: KeyDepositRow,
  distributorSlug?: string,
): string {
  const domain = origin || "https://[TON-DOMAINE]";
  const parts = [
    `${domain}/pass?code=[Code de confirmation]`,
    "in=[Date d'arrivée]",
    "out=[Date de départ]",
    "name=[Prénom du voyageur]",
    "guests=[Nombre de voyageurs]",
    `keyId=${keyDeposit.id}`,
    `box=${keyDeposit.boxNumber ?? "[Numéro de casier]"}`,
    distributorSlug ? `site=${distributorSlug}` : "site=[Slug distributeur]",
  ];
  return parts.join("&");
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

  const messageTemplate = useMemo(() => {
    if (!selectedKey) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const slug = selectedKey.distributorId
      ? distributorSlugs[selectedKey.distributorId]
      : undefined;
    return buildAirbnbMessageTemplate(origin, selectedKey, slug);
  }, [selectedKey, distributorSlugs]);

  async function handleCopy() {
    if (!messageTemplate) return;
    await navigator.clipboard.writeText(messageTemplate);
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
            Lien d&apos;acquisition voyageur
          </h2>
          <p className={`mt-1 max-w-xl text-sm ${muted(isLight)}`}>
            Copiez ce modèle dans votre message Airbnb. Le{" "}
            <span className="font-semibold">keyId</span> lie automatiquement le voyageur à
            votre logement.
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
          className={`w-full max-w-md rounded-xl border px-4 py-3 text-sm outline-none ${
            isLight
              ? "border-zinc-200 bg-zinc-50 text-zinc-900"
              : "border-white/10 bg-white/[0.04] text-white"
          }`}
        >
          {eligibleKeys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.propertyLabel}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`rounded-2xl border px-4 py-4 font-mono text-xs leading-relaxed break-all ${
          isLight
            ? "border-zinc-200 bg-zinc-50 text-zinc-700"
            : "border-white/10 bg-black/20 text-neutral-300"
        }`}
      >
        {messageTemplate}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
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
            <Check className="h-4 w-4" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copier le message
          </>
        )}
      </button>
    </motion.section>
  );
}
