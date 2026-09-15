"use client";

import { motion } from "framer-motion";
import { Calendar, Check, Crown, Sparkles, Zap } from "lucide-react";
import { QuotaProgress } from "@/components/landlord/quota-progress";
import { btnPrimary, heading, muted, panel, subheading } from "@/lib/admin-theme";
import type { SubscriptionPlanRow, SubscriptionRow } from "@/lib/subscription-types";
import { formatPriceMonthly } from "@/lib/subscription-types";

type SubscriptionPanelProps = {
  subscription: SubscriptionRow;
  plans: SubscriptionPlanRow[];
  keysUsed: number;
  isLight: boolean;
};

const PLAN_ICONS: Record<string, typeof Crown> = {
  starter: Sparkles,
  pro: Crown,
  business: Zap,
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["Jusqu'à 2 clés", "Passes voyageurs illimités", "Support email"],
  pro: ["Jusqu'à 5 clés", "Passes voyageurs illimités", "Support prioritaire", "Statistiques"],
  business: [
    "Jusqu'à 15 clés",
    "Passes voyageurs illimités",
    "Support dédié",
    "Multi-comptes",
    "API accès",
  ],
};

export function SubscriptionPanel({
  subscription,
  plans,
  keysUsed,
  isLight,
}: SubscriptionPanelProps) {
  const PlanIcon = PLAN_ICONS[subscription.planSlug] ?? Crown;
  const features = PLAN_FEATURES[subscription.planSlug] ?? PLAN_FEATURES.pro;
  const renewDate = new Date(subscription.renewsAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${
          isLight ? "border-zinc-200/80" : "border-white/[0.08]"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isLight
              ? "bg-linear-to-br from-violet-50 via-white to-fuchsia-50"
              : "bg-linear-to-br from-violet-500/10 via-transparent to-fuchsia-500/10"
          }`}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div
              className={`mb-4 inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 ${
                isLight
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-300"
              }`}
            >
              <PlanIcon className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Formule {subscription.planName}
              </span>
            </div>
            <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${heading(isLight)}`}>
              {formatPriceMonthly(subscription.priceMonthly)}
              <span className={`text-base font-semibold ${muted(isLight)}`}>/ mois</span>
            </h2>
            <p className={`mt-2 flex items-center gap-2 text-sm ${muted(isLight)}`}>
              <Calendar className="h-4 w-4" />
              Renouvellement le {renewDate}
            </p>
          </div>
          <div
            className={`rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              subscription.status === "active"
                ? isLight
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-emerald-500/15 text-emerald-400"
                : muted(isLight)
            }`}
          >
            {subscription.status === "active" ? "Actif" : subscription.status}
          </div>
        </div>

        <div className="relative mt-8 max-w-md">
          <QuotaProgress
            used={keysUsed}
            max={subscription.maxKeys}
            isLight={isLight}
            planSlug={subscription.planSlug}
          />
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-2xl p-6 backdrop-blur-xl ${panel(isLight)}`}>
          <h3 className={`text-sm font-bold ${heading(isLight)}`}>Inclus dans votre formule</h3>
          <ul className="mt-4 space-y-3">
            {features.map((feature) => (
              <li key={feature} className={`flex items-center gap-3 text-sm ${subheading(isLight)}`}>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isLight ? "bg-emerald-100 text-emerald-600" : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className={`rounded-2xl p-6 backdrop-blur-xl ${panel(isLight)}`}>
          <h3 className={`text-sm font-bold ${heading(isLight)}`}>Autres formules</h3>
          <div className="mt-4 space-y-3">
            {plans
              .filter((p) => p.slug !== subscription.planSlug)
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${heading(isLight)}`}>{plan.name}</p>
                    <p className={`text-xs ${muted(isLight)}`}>{plan.maxKeys} clés max</p>
                  </div>
                  <p className={`text-sm font-bold ${subheading(isLight)}`}>
                    {formatPriceMonthly(plan.priceMonthly)}
                  </p>
                </div>
              ))}
          </div>
          <button
            type="button"
            className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${btnPrimary(isLight)}`}
          >
            Passer à une formule supérieure
          </button>
        </div>
      </section>
    </div>
  );
}
