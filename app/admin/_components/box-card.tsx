"use client";

import { motion } from "framer-motion";
import { useTransition } from "react";
import { Lock, LockOpen, Radio } from "lucide-react";
import { toast } from "sonner";
import { remoteOpenBox } from "@/app/admin/actions";
import {
  getActiveReservation,
  getBadgeLabel,
  getCodeInitials,
  getReservationBadge,
  type ReservationRow,
} from "@/lib/admin-utils";
import { heading, muted } from "@/lib/admin-theme";

type BoxCardProps = {
  boxNumber: number;
  distributorId: string;
  reservations: ReservationRow[];
  isLight?: boolean;
  onUpdated?: () => void;
  compact?: boolean;
};

export function BoxCard({
  boxNumber,
  distributorId,
  reservations,
  isLight = false,
  onUpdated,
  compact = false,
}: BoxCardProps) {
  const [isPending, startTransition] = useTransition();
  const activeReservation = getActiveReservation(boxNumber, distributorId, reservations);
  const occupied = Boolean(activeReservation);
  const badge = activeReservation ? getReservationBadge(activeReservation) : null;
  const badgeLabel = getBadgeLabel(badge);

  function handleRemoteOpen() {
    if (!activeReservation) {
      toast.error("Aucune réservation active sur ce casier");
      return;
    }

    startTransition(async () => {
      const result = await remoteOpenBox(activeReservation.code);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`Casier ${result.openBox} ouvert`, {
        description: `Signal envoyé pour ${activeReservation.code.slice(0, 2)}•••${activeReservation.code.slice(-2)}.`,
      });
      onUpdated?.();
    });
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        occupied
          ? isLight
            ? "border-orange-200/80 bg-linear-to-br from-orange-50 to-white shadow-sm hover:shadow-md hover:shadow-orange-100"
            : "border-orange-500/20 bg-linear-to-br from-orange-500/[0.08] to-white/[0.02] hover:border-orange-500/30 hover:shadow-[0_0_40px_-12px_rgba(249,115,22,0.3)]"
          : isLight
            ? "border-emerald-200/80 bg-linear-to-br from-emerald-50/80 to-white shadow-sm hover:shadow-md hover:shadow-emerald-100"
            : "border-emerald-500/15 bg-linear-to-br from-emerald-500/[0.06] to-white/[0.02] hover:border-emerald-500/25 hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.25)]"
      } ${compact ? "p-3.5" : "p-5"}`}
    >
      {/* Status indicator strip */}
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          occupied
            ? "bg-linear-to-r from-orange-500 to-amber-400"
            : "bg-linear-to-r from-emerald-500 to-teal-400"
        }`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            Casier
          </p>
          <p className={`font-bold tabular-nums tracking-tight ${heading(isLight)} ${compact ? "text-2xl" : "text-3xl"}`}>
            {String(boxNumber).padStart(2, "0")}
          </p>
        </div>
        <div
          className={`flex items-center justify-center rounded-xl ${
            compact ? "h-9 w-9" : "h-10 w-10"
          } ${
            occupied
              ? "bg-orange-500/15 text-orange-500"
              : "bg-emerald-500/15 text-emerald-500"
          }`}
        >
          {occupied ? (
            <Lock className="h-4 w-4" strokeWidth={2} />
          ) : (
            <LockOpen className="h-4 w-4" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className={`relative space-y-2 ${compact ? "mt-3" : "mt-4"}`}>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              occupied
                ? isLight
                  ? "bg-orange-100 text-orange-700"
                  : "bg-orange-500/15 text-orange-400"
                : isLight
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            {occupied ? "Occupé" : "Libre"}
          </span>

          {badgeLabel && (
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                isLight
                  ? "bg-amber-100 text-amber-700"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {badgeLabel}
            </span>
          )}
        </div>

        {occupied && activeReservation && !compact && (
          <div className="flex items-center gap-2.5 pt-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                isLight
                  ? "border border-zinc-200 bg-white text-zinc-800"
                  : "border border-white/10 bg-white/5 text-white"
              }`}
            >
              {getCodeInitials(activeReservation.code)}
            </div>
            <div>
              <p className={`text-[10px] ${muted(isLight)}`}>Code invité</p>
              <p className={`font-mono text-xs ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                {activeReservation.code.slice(0, 2)}•••
                {activeReservation.code.slice(-2)}
              </p>
            </div>
          </div>
        )}

        {!occupied && !compact && (
          <p className={`text-xs ${muted(isLight)}`}>Disponible</p>
        )}
      </div>

      {!compact && (
        <motion.button
          type="button"
          onClick={handleRemoteOpen}
          disabled={isPending || !occupied}
          whileHover={{ scale: occupied ? 1.02 : 1 }}
          whileTap={{ scale: occupied ? 0.98 : 1 }}
          className={`relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
            isLight
              ? "border-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800"
              : "border-white/10 bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          {isPending ? "Ouverture…" : "Ouvrir à distance"}
        </motion.button>
      )}
    </motion.article>
  );
}
