"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Home, Plus } from "lucide-react";
import { KeyCard } from "@/components/landlord/key-card";
import { btnPrimary, btnSecondary, heading, muted } from "@/lib/admin-theme";
import type { KeyDepositRow } from "@/lib/subscription-types";

type KeyGridProps = {
  keys: KeyDepositRow[];
  isLight: boolean;
  canAddKey: boolean;
  quotaReached: boolean;
  onAddKey: () => void;
  onDeposit: (keyId: string) => void;
};

export function KeyGrid({
  keys,
  isLight,
  canAddKey,
  quotaReached,
  onAddKey,
  onDeposit,
}: KeyGridProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2">
            <Home className={`h-4 w-4 ${muted(isLight)}`} />
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Logements & Clés
            </p>
          </div>
          <h2 className={`text-xl font-black tracking-tight sm:text-2xl ${heading(isLight)}`}>
            Gestion des logements
          </h2>
          <p className={`mt-1 text-sm ${muted(isLight)}`}>
            {keys.length} logement{keys.length > 1 ? "s" : ""} enregistré{keys.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddKey}
          disabled={!canAddKey}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
            canAddKey ? btnPrimary(isLight) : btnSecondary(isLight)
          }`}
        >
          <Plus className="h-4 w-4" />
          Ajouter une clé
        </button>
      </div>

      <AnimatePresence>
        {quotaReached && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3 ${
              isLight
                ? "border-orange-200 bg-orange-50 text-orange-800"
                : "border-orange-500/30 bg-orange-500/10 text-orange-300"
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">
              Quota de clés atteint. Passez à une formule supérieure pour ajouter de nouveaux
              logements.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {keys.map((keyDeposit, index) => (
            <KeyCard
              key={keyDeposit.id}
              keyDeposit={keyDeposit}
              isLight={isLight}
              index={index}
              onDeposit={onDeposit}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {keys.length === 0 && (
        <div
          className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
            isLight ? "border-zinc-200 bg-zinc-50/50" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <Home className={`mx-auto h-10 w-10 ${muted(isLight)}`} />
          <p className={`mt-4 text-sm font-semibold ${heading(isLight)}`}>
            Aucun logement enregistré
          </p>
          <p className={`mt-1 text-sm ${muted(isLight)}`}>
            Ajoutez votre première clé pour commencer.
          </p>
        </div>
      )}
    </motion.section>
  );
}
