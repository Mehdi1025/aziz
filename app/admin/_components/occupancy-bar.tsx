"use client";

import { motion } from "framer-motion";
import { panel, heading, muted } from "@/lib/admin-theme";

type OccupancyBarProps = {
  occupied: number;
  total: number;
  isLight?: boolean;
};

export function OccupancyBar({ occupied, total, isLight = false }: OccupancyBarProps) {
  const free = total - occupied;
  const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div className={`rounded-2xl p-5 ${panel(isLight)}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            Taux d&apos;occupation
          </p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${heading(isLight)}`}>
            {percent}
            <span className={`text-base font-medium ${muted(isLight)}`}>%</span>
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span className={muted(isLight)}>
              {occupied} occupé{occupied > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className={muted(isLight)}>
              {free} libre{free > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 h-2.5 overflow-hidden rounded-full ${isLight ? "bg-zinc-100" : "bg-white/[0.06]"}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-400"
        />
      </div>
    </div>
  );
}
