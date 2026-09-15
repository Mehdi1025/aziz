"use client";

import { motion } from "framer-motion";
import { heading, muted, subheading } from "@/lib/admin-theme";

type QuotaProgressProps = {
  used: number;
  max: number;
  isLight: boolean;
};

const PLAN_GRADIENT: Record<string, string> = {
  starter: "from-sky-400 to-cyan-500",
  pro: "from-violet-500 to-fuchsia-500",
  business: "from-amber-400 to-orange-500",
};

type QuotaProgressExtendedProps = QuotaProgressProps & {
  planSlug?: string;
};

export function QuotaProgress({
  used,
  max,
  isLight,
  planSlug = "pro",
}: QuotaProgressExtendedProps) {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const remaining = Math.max(0, max - used);
  const isFull = used >= max;
  const gradient = PLAN_GRADIENT[planSlug] ?? PLAN_GRADIENT.pro;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            Quota clés
          </p>
          <p className={`mt-1 text-2xl font-black tabular-nums tracking-tight ${heading(isLight)}`}>
            {used}
            <span className={`text-lg font-semibold ${subheading(isLight)}`}> / {max}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${muted(isLight)}`}>
            {isFull ? "Quota atteint" : `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`}
          </p>
          <p
            className={`text-sm font-bold tabular-nums ${
              isFull ? "text-orange-500" : isLight ? "text-emerald-600" : "text-emerald-400"
            }`}
          >
            {percent}%
          </p>
        </div>
      </div>

      <div
        className={`relative h-3 overflow-hidden rounded-full ${
          isLight ? "bg-zinc-100" : "bg-white/[0.06]"
        }`}
      >
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
        {isFull && (
          <motion.div
            className="absolute inset-0 bg-orange-500/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
