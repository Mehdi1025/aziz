"use client";

import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { ThemeToggle } from "@/app/admin/_components/theme-toggle";
import { heading, muted } from "@/lib/admin-theme";

type LandlordHeaderProps = {
  isLight: boolean;
  onToggleTheme: () => void;
};

export function LandlordHeader({ isLight, onToggleTheme }: LandlordHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-transparent backdrop-blur-xl"
      style={{
        borderColor: isLight ? "rgba(228,228,231,0.8)" : "rgba(255,255,255,0.06)",
        background: isLight ? "rgba(255,255,255,0.75)" : "rgba(9,9,11,0.75)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              isLight
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
                : "bg-white text-zinc-950 shadow-lg shadow-white/10"
            }`}
          >
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-sm font-black tracking-tight ${heading(isLight)}`}>
              KeyNest
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Espace Hôte
            </p>
          </div>
        </div>

        <ThemeToggle isLight={isLight} onToggle={onToggleTheme} />
      </div>
    </motion.header>
  );
}
