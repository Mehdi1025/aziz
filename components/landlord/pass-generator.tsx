"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Link2, Sparkles, User } from "lucide-react";
import { useMemo, useState } from "react";
import { buildPassUrl } from "@/lib/parse-reservation-link";
import { btnPrimary, btnSecondary, heading, input as inputClass, muted, panel, subheading } from "@/lib/admin-theme";
import type { HostDistributorOption } from "@/components/landlord/mock-landlord-data";
import type { KeyDepositRow } from "@/lib/subscription-types";

type PassGeneratorProps = {
  keys: KeyDepositRow[];
  distributors: HostDistributorOption[];
  isLight: boolean;
  onGenerate?: (data: {
    keyId: string;
    guestFirstName: string;
    validFrom: string;
    validTo: string;
  }) => Promise<{ passUrl: string; code: string } | null>;
};

export function formatPassDateParam(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\./g, ".");
}

export function generatePassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PassGenerator({ keys, distributors, isLight, onGenerate }: PassGeneratorProps) {
  const eligibleKeys = useMemo(
    () => keys.filter((k) => k.status === "in_locker" && k.boxNumber !== null),
    [keys],
  );

  const defaultIn = useMemo(() => {
    const d = new Date();
    d.setHours(15, 0, 0, 0);
    return toDatetimeLocalValue(d);
  }, []);

  const defaultOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(11, 0, 0, 0);
    return toDatetimeLocalValue(d);
  }, []);

  const [selectedKeyId, setSelectedKeyId] = useState(eligibleKeys[0]?.id ?? "");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [validFrom, setValidFrom] = useState(defaultIn);
  const [validTo, setValidTo] = useState(defaultOut);
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [passCode, setPassCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedKey = eligibleKeys.find((k) => k.id === selectedKeyId) ?? null;
  const isValid =
    selectedKey &&
    guestFirstName.trim().length >= 2 &&
    validFrom &&
    validTo &&
    new Date(validTo) > new Date(validFrom);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !selectedKey) return;

    setIsGenerating(true);
    try {
      if (onGenerate) {
        const result = await onGenerate({
          keyId: selectedKey.id,
          guestFirstName: guestFirstName.trim(),
          validFrom,
          validTo,
        });
        if (result) {
          setPassUrl(result.passUrl);
          setPassCode(result.code);
          return;
        }
      }

      const code = generatePassCode();
      const inFormatted = formatPassDateParam(new Date(validFrom));
      const outFormatted = formatPassDateParam(new Date(validTo));
      const distributorSlug = selectedKey.distributorId
        ? distributors.find((d) => d.id === selectedKey.distributorId)?.slug
        : undefined;

      const url = buildPassUrl({
        code,
        in: inFormatted,
        out: outFormatted,
        box: String(selectedKey.boxNumber),
        site: distributorSlug,
      });

      setPassCode(code);
      setPassUrl(url);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!passUrl) return;
    const fullUrl =
      typeof window !== "undefined" ? `${window.location.origin}${passUrl}` : passUrl;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-3xl p-6 sm:p-8 backdrop-blur-xl ${panel(isLight)}`}
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${isLight ? "text-violet-500" : "text-violet-400"}`} />
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Accès voyageur
            </p>
          </div>
          <h2 className={`text-xl font-black tracking-tight sm:text-2xl ${heading(isLight)}`}>
            Génération de pass client
          </h2>
          <p className={`mt-1 max-w-lg text-sm ${muted(isLight)}`}>
            Créez un lien sécurisé pour votre voyageur Airbnb. Il pourra récupérer la clé via
            le distributeur.
          </p>
        </div>
      </div>

      {eligibleKeys.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed px-6 py-10 text-center ${
            isLight ? "border-zinc-200 bg-zinc-50/50" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <Link2 className={`mx-auto h-8 w-8 ${muted(isLight)}`} />
          <p className={`mt-3 text-sm ${muted(isLight)}`}>
            Aucune clé en casier disponible pour générer un pass.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label htmlFor="pass-key" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                Logement
              </label>
              <select
                id="pass-key"
                value={selectedKeyId}
                onChange={(e) => {
                  setSelectedKeyId(e.target.value);
                  setPassUrl(null);
                  setPassCode(null);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
              >
                {eligibleKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.propertyLabel} — Casier {key.boxNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="guest-name" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                Prénom du voyageur
              </label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${muted(isLight)}`} />
                <input
                  id="guest-name"
                  type="text"
                  value={guestFirstName}
                  onChange={(e) => setGuestFirstName(e.target.value)}
                  placeholder="Ex. Emma"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition-all ${inputClass(isLight)}`}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="valid-from" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                  Entrée (check-in)
                </label>
                <input
                  id="valid-from"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
                />
              </div>
              <div>
                <label htmlFor="valid-to" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                  Sortie (check-out)
                </label>
                <input
                  id="valid-to"
                  type="datetime-local"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isGenerating}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${btnPrimary(isLight)}`}
            >
              <Link2 className="h-4 w-4" />
              {isGenerating ? "Génération…" : "Générer le pass"}
            </button>
          </form>

          <div className="flex flex-col justify-center">
            <AnimatePresenceResult passUrl={passUrl} passCode={passCode} isLight={isLight} copied={copied} onCopy={handleCopy} />
          </div>
        </div>
      )}
    </motion.section>
  );
}

function AnimatePresenceResult({
  passUrl,
  passCode,
  isLight,
  copied,
  onCopy,
}: {
  passUrl: string | null;
  passCode: string | null;
  isLight: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {passUrl ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className={`rounded-2xl border p-5 ${
            isLight
              ? "border-emerald-200 bg-emerald-50/80"
              : "border-emerald-500/25 bg-emerald-500/10"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              isLight ? "text-emerald-700" : "text-emerald-400"
            }`}
          >
            Pass généré
          </p>
          {passCode && (
            <p className={`mt-2 font-mono text-lg font-bold tracking-wider ${heading(isLight)}`}>
              {passCode}
            </p>
          )}
          <p
            className={`mt-3 break-all rounded-xl px-3 py-2.5 font-mono text-xs ${
              isLight ? "bg-white text-zinc-700" : "bg-black/30 text-neutral-300"
            }`}
          >
            {passUrl}
          </p>
          <button
            type="button"
            onClick={onCopy}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              copied
                ? isLight
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500 text-white"
                : btnSecondary(isLight)
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
                Copier le lien
              </>
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`rounded-2xl border border-dashed px-6 py-12 text-center ${
            isLight ? "border-zinc-200 bg-zinc-50/30" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <Link2 className={`mx-auto h-8 w-8 opacity-30 ${muted(isLight)}`} />
          <p className={`mt-3 text-sm ${muted(isLight)}`}>
            Le lien d&apos;accès apparaîtra ici après génération.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
