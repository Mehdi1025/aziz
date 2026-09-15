"use client";

import { motion } from "framer-motion";
import { Box, MapPin, Upload } from "lucide-react";
import { btnPrimary, heading, muted, panel, subheading } from "@/lib/admin-theme";
import type { KeyDepositRow } from "@/lib/subscription-types";
import { KEY_STATUS_META } from "@/lib/subscription-types";

type KeyCardProps = {
  keyDeposit: KeyDepositRow;
  isLight: boolean;
  index: number;
  onDeposit: (keyId: string) => void;
};

export function KeyCard({ keyDeposit, isLight, index, onDeposit }: KeyCardProps) {
  const statusMeta = KEY_STATUS_META[keyDeposit.status];
  const canDeposit = keyDeposit.status === "pending_deposit";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col rounded-2xl p-5 backdrop-blur-xl ${panel(isLight, "hover:shadow-lg")}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`truncate text-base font-bold tracking-tight ${heading(isLight)}`}>
            {keyDeposit.propertyLabel}
          </h3>
          {keyDeposit.propertyAddress && (
            <p className={`mt-1 flex items-start gap-1.5 text-xs leading-relaxed ${muted(isLight)}`}>
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="line-clamp-2">{keyDeposit.propertyAddress}</span>
            </p>
          )}
        </div>

        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
          style={{
            color: statusMeta.color,
            backgroundColor: `${statusMeta.color}18`,
            border: `1px solid ${statusMeta.color}33`,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      {keyDeposit.status === "in_locker" && keyDeposit.distributorName && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            isLight ? "bg-zinc-50 text-zinc-600" : "bg-white/[0.04] text-neutral-400"
          }`}
        >
          <Box className="h-3.5 w-3.5 shrink-0" />
          <span>
            {keyDeposit.cityName} · {keyDeposit.distributorName} · Casier{" "}
            <span className={`font-bold ${subheading(isLight)}`}>{keyDeposit.boxNumber}</span>
          </span>
        </div>
      )}

      {keyDeposit.activeReservationCode && (
        <p
          className={`mb-4 text-[10px] font-semibold uppercase tracking-wider ${
            isLight ? "text-amber-600" : "text-amber-400"
          }`}
        >
          Pass actif · {keyDeposit.activeReservationCode}
        </p>
      )}

      <div className="mt-auto pt-2">
        {canDeposit ? (
          <button
            type="button"
            onClick={() => onDeposit(keyDeposit.id)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98] ${btnPrimary(isLight)}`}
          >
            <Upload className="h-4 w-4" />
            Déposer en distributeur
          </button>
        ) : (
          <div
            className={`rounded-xl px-3 py-2 text-center text-xs ${muted(isLight)} ${
              isLight ? "bg-zinc-50" : "bg-white/[0.03]"
            }`}
          >
            {keyDeposit.status === "in_locker"
              ? "Prête pour génération de pass"
              : keyDeposit.status === "checked_out"
                ? "Clé récupérée par le voyageur"
                : "Clé inactive"}
          </div>
        )}
      </div>
    </motion.article>
  );
}
