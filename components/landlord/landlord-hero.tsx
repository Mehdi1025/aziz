"use client";

import { motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import { KpiCards, type HostKpis } from "@/components/landlord/kpi-cards";
import { QuotaProgress } from "@/components/landlord/quota-progress";
import { heading, muted } from "@/lib/admin-theme";

type LandlordHeroProps = {
  hostName: string;
  planName: string;
  planSlug: string;
  keysUsed: number;
  maxKeys: number;
  kpis: HostKpis;
  isLight: boolean;
};

const PLAN_BADGE: Record<string, { gradient: string; icon: typeof Crown }> = {
  starter: {
    gradient: "from-sky-500/20 to-cyan-500/20 border-sky-500/30 text-sky-500",
    icon: Sparkles,
  },
  pro: {
    gradient: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-500",
    icon: Crown,
  },
  business: {
    gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500",
    icon: Crown,
  },
};

export function LandlordHero({
  hostName,
  planName,
  planSlug,
  keysUsed,
  maxKeys,
  kpis,
  isLight,
}: LandlordHeroProps) {
  const badge = PLAN_BADGE[planSlug] ?? PLAN_BADGE.pro;
  const BadgeIcon = badge.icon;
  const firstName = hostName.split(" ")[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-3xl border ${
        isLight ? "border-zinc-200/80" : "border-white/[0.08]"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isLight
            ? "bg-linear-to-br from-violet-50 via-white to-emerald-50"
            : "bg-linear-to-br from-violet-500/10 via-transparent to-emerald-500/10"
        }`}
      />

      <div className="relative space-y-8 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Bienvenue
            </p>
            <h1
              className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${heading(isLight)}`}
            >
              Bonjour, {firstName}
            </h1>
            <p className={`mt-3 text-sm leading-relaxed sm:text-base ${muted(isLight)}`}>
              Gérez vos logements, déposez vos clés en casier et générez des accès sécurisés
              pour vos voyageurs Airbnb.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className={`inline-flex items-center gap-2.5 rounded-2xl border bg-linear-to-r px-4 py-2.5 ${badge.gradient}`}
          >
            <BadgeIcon className="h-4 w-4" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-80">
                Formule
              </p>
              <p className="text-sm font-black tracking-tight">{planName}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <QuotaProgress
            used={keysUsed}
            max={maxKeys}
            isLight={isLight}
            planSlug={planSlug}
          />
          <KpiCards kpis={kpis} isLight={isLight} />
        </div>
      </div>
    </motion.section>
  );
}
