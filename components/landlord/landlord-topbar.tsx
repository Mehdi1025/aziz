"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/app/admin/_components/theme-toggle";
import type { LandlordTab } from "@/components/landlord/landlord-tabs";
import { LANDLORD_TABS } from "@/components/landlord/landlord-tabs";
import { heading, muted } from "@/lib/admin-theme";

type LandlordTopbarProps = {
  activeTab: LandlordTab;
  isLight: boolean;
  onToggleTheme: () => void;
};

export function LandlordTopbar({
  activeTab,
  isLight,
  onToggleTheme,
}: LandlordTopbarProps) {
  const tabMeta = LANDLORD_TABS.find((t) => t.id === activeTab);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
        isLight
          ? "border-zinc-200/80 bg-white/80"
          : "border-white/[0.06] bg-zinc-950/80"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 lg:hidden">
          <p className={`text-sm font-black ${heading(isLight)}`}>KeyNest</p>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            Espace Hôte
          </p>
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            {tabMeta?.label}
          </p>
          <h1 className={`mt-0.5 truncate text-lg font-black tracking-tight sm:text-xl ${heading(isLight)}`}>
            {tabMeta?.description}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle isLight={isLight} onToggle={onToggleTheme} />
        </div>
      </div>
    </motion.header>
  );
}
