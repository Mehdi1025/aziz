"use client";

import { motion } from "framer-motion";
import {
  Box,
  CalendarArrowDown,
  CalendarArrowUp,
  KeyRound,
  TrendingUp,
} from "lucide-react";
import type { AdminKpis } from "@/lib/admin-utils";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { heading, muted } from "@/lib/admin-theme";

type KpiStripProps = {
  kpis: AdminKpis;
  isLight?: boolean;
};

const cards = [
  {
    key: "occupied" as const,
    label: "Casiers occupés",
    icon: Box,
    gradient: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/20",
    hint: "sur le parc total",
  },
  {
    key: "arrivals" as const,
    label: "Arrivées",
    icon: CalendarArrowDown,
    gradient: "from-sky-500 to-blue-500",
    glow: "shadow-sky-500/20",
    hint: "aujourd'hui",
  },
  {
    key: "departures" as const,
    label: "Départs",
    icon: CalendarArrowUp,
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/20",
    hint: "aujourd'hui",
  },
  {
    key: "pending" as const,
    label: "Pass en attente",
    icon: KeyRound,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    hint: "non scannés",
  },
];

export function KpiStrip({ kpis, isLight = false }: KpiStripProps) {
  const values: Record<(typeof cards)[number]["key"], string> = {
    occupied: `${kpis.occupiedBoxes}`,
    arrivals: String(kpis.arrivalsToday),
    departures: String(kpis.departuresToday),
    pending: String(kpis.pendingPasses),
  };

  const extras: Record<(typeof cards)[number]["key"], string | null> = {
    occupied: `/${kpis.totalBoxes}`,
    arrivals: null,
    departures: null,
    pending: null,
  };

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
      {cards.map(({ key, label, icon: Icon, gradient, glow, hint }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
        >
          <ThemedPanel
            isLight={isLight}
            hover
            className="group relative overflow-hidden p-5"
          >
            <div
              className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-linear-to-br ${gradient} opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.15]`}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${muted(isLight)}`}>
                  {label}
                </p>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <p className={`text-3xl font-bold tabular-nums tracking-tight ${heading(isLight)}`}>
                    {values[key]}
                  </p>
                  {extras[key] && (
                    <span className={`text-lg font-medium ${muted(isLight)}`}>
                      {extras[key]}
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-xs ${muted(isLight)}`}>{hint}</p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${gradient} text-white shadow-lg ${glow}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </div>

            {key === "occupied" && kpis.totalBoxes > 0 && (
              <div className="relative mt-4">
                <div
                  className={`h-1 overflow-hidden rounded-full ${isLight ? "bg-zinc-100" : "bg-white/[0.06]"}`}
                >
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${gradient}`}
                    style={{
                      width: `${(kpis.occupiedBoxes / kpis.totalBoxes) * 100}%`,
                    }}
                  />
                </div>
                <p className={`mt-1.5 flex items-center gap-1 text-[10px] ${muted(isLight)}`}>
                  <TrendingUp className="h-3 w-3" />
                  {Math.round((kpis.occupiedBoxes / kpis.totalBoxes) * 100)}% du parc
                </p>
              </div>
            )}
          </ThemedPanel>
        </motion.div>
      ))}
    </div>
  );
}
