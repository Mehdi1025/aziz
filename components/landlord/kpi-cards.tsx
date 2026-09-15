"use client";

import { motion } from "framer-motion";
import { Clock, KeyRound, PackageCheck } from "lucide-react";
import { heading, muted, panel } from "@/lib/admin-theme";

export type HostKpis = {
  keysInLocker: number;
  pendingPasses: number;
  keysRecovered: number;
};

type KpiCardsProps = {
  kpis: HostKpis;
  isLight: boolean;
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function KpiCards({ kpis, isLight }: KpiCardsProps) {
  const cards = [
    {
      label: "Clés en casier",
      value: kpis.keysInLocker,
      icon: KeyRound,
      color: "#10b981",
      bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10",
    },
    {
      label: "Pass en attente",
      value: kpis.pendingPasses,
      icon: Clock,
      color: "#f59e0b",
      bg: isLight ? "bg-amber-50" : "bg-amber-500/10",
    },
    {
      label: "Clés récupérées",
      value: kpis.keysRecovered,
      icon: PackageCheck,
      color: "#38bdf8",
      bg: isLight ? "bg-sky-50" : "bg-sky-500/10",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:grid-cols-3"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={item}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`rounded-2xl p-4 backdrop-blur-xl ${panel(isLight)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${muted(isLight)}`}>
                {card.label}
              </p>
              <p className={`mt-2 text-3xl font-black tabular-nums tracking-tight ${heading(isLight)}`}>
                {card.value}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className="h-5 w-5" style={{ color: card.color }} />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
