"use client";

import { motion } from "framer-motion";
import { Lock, LockOpen, AlertTriangle } from "lucide-react";
import {
  BOX_STATUS_META,
  type LiveBoxCell,
} from "@/lib/live-grid-utils";
import { heading, muted } from "@/lib/admin-theme";

type LiveBoxTileProps = {
  cell: LiveBoxCell;
  isLight?: boolean;
  isPulsing?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  index?: number;
};

const statusIcons = {
  free: LockOpen,
  occupied: Lock,
  blocked: AlertTriangle,
} as const;

export function LiveBoxTile({
  cell,
  isLight = false,
  isPulsing = false,
  isSelected = false,
  onSelect,
  index = 0,
}: LiveBoxTileProps) {
  const meta = BOX_STATUS_META[cell.status];
  const Icon = statusIcons[cell.status];

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.35), duration: 0.35 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
        isSelected
          ? isLight
            ? "z-10 border-sky-300 bg-sky-50/80 shadow-lg shadow-sky-100 ring-2 ring-sky-400/80"
            : "z-10 border-sky-500/40 bg-sky-500/10 shadow-[0_0_40px_-12px_rgba(56,189,248,0.45)] ring-2 ring-sky-500/50"
          : isLight
            ? "border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-md"
            : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]"
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${meta.color}, transparent 70%)`,
        }}
      />

      {isPulsing && (
        <>
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl animate-ping opacity-20"
            style={{ backgroundColor: meta.color }}
          />
          <span
            className="pointer-events-none absolute inset-x-2 top-2 h-1 rounded-full animate-pulse"
            style={{ backgroundColor: meta.color }}
          />
        </>
      )}

      <div className="relative flex h-full flex-col justify-between p-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[8px] font-bold uppercase tracking-[0.16em] ${muted(isLight)}`}>
              Casier
            </p>
            <p
              className={`mt-0.5 text-xl font-black tabular-nums leading-none tracking-tight ${heading(isLight)}`}
            >
              {String(cell.boxNumber).padStart(2, "0")}
            </p>
          </div>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-xl shadow-sm"
            style={{
              backgroundColor: `${meta.color}20`,
              color: meta.color,
              boxShadow: isSelected ? `0 0 16px ${meta.glow}` : undefined,
            }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <span
            className="inline-block rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${meta.color}15`,
              color: meta.color,
            }}
          >
            {meta.shortLabel}
          </span>
          <p className={`truncate text-[9px] font-semibold ${heading(isLight)}`}>
            {cell.cityName}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
