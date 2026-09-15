"use client";

import { motion } from "framer-motion";
import { ArrowRight, Home, Link2, Plus } from "lucide-react";
import type { LandlordTab } from "@/components/landlord/landlord-tabs";
import { heading, muted, panel } from "@/lib/admin-theme";

type OverviewShortcutsProps = {
  isLight: boolean;
  onNavigate: (tab: LandlordTab) => void;
  onAddKey: () => void;
  pendingDepositCount: number;
  keysInLockerCount: number;
};

export function OverviewShortcuts({
  isLight,
  onNavigate,
  onAddKey,
  pendingDepositCount,
  keysInLockerCount,
}: OverviewShortcutsProps) {
  const shortcuts = [
    {
      title: "Ajouter un logement",
      description: "Enregistrez une nouvelle clé à déposer",
      icon: Plus,
      accent: "#8b5cf6",
      action: onAddKey,
    },
    {
      title: "Déposer une clé",
      description:
        pendingDepositCount > 0
          ? `${pendingDepositCount} clé${pendingDepositCount > 1 ? "s" : ""} en attente de dépôt`
          : "Toutes vos clés sont à jour",
      icon: Home,
      accent: "#f59e0b",
      action: () => onNavigate("properties"),
    },
    {
      title: "Générer un pass",
      description:
        keysInLockerCount > 0
          ? `${keysInLockerCount} logement${keysInLockerCount > 1 ? "s" : ""} prêt${keysInLockerCount > 1 ? "s" : ""}`
          : "Déposez d'abord une clé en casier",
      icon: Link2,
      accent: "#10b981",
      action: () => onNavigate("passes"),
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
          Actions rapides
        </p>
        <h2 className={`mt-1 text-lg font-black tracking-tight ${heading(isLight)}`}>
          Que souhaitez-vous faire ?
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {shortcuts.map((item, index) => (
          <motion.button
            key={item.title}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.06, duration: 0.4 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={item.action}
            className={`group flex flex-col rounded-2xl p-5 text-left backdrop-blur-xl transition-shadow hover:shadow-lg ${panel(isLight)}`}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <p className={`text-sm font-bold ${heading(isLight)}`}>{item.title}</p>
            <p className={`mt-1 flex-1 text-xs leading-relaxed ${muted(isLight)}`}>
              {item.description}
            </p>
            <span
              className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold transition-transform group-hover:translate-x-0.5`}
              style={{ color: item.accent }}
            >
              Continuer
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
