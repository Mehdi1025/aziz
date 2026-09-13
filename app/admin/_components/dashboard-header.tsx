"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { ThemeToggle } from "@/app/admin/_components/theme-toggle";
import { ADMIN_HEALTH_CHECK_INTERVAL_MS, ADMIN_POLL_INTERVAL_MS } from "@/lib/admin-config";
import { heading, muted } from "@/lib/admin-theme";

type DashboardHeaderProps = {
  isLight: boolean;
  onToggleTheme: () => void;
  activeTabLabel: string;
  locationPicker?: ReactNode;
};

export function DashboardHeader({
  isLight,
  onToggleTheme,
  activeTabLabel,
  locationPicker,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 space-y-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-[0.25em] ${muted(isLight)}`}>
            {activeTabLabel}
          </p>
          <h1 className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${heading(isLight)}`}>
            Dashboard Distributeur
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle isLight={isLight} onToggle={onToggleTheme} />
          <LiveStatus isLight={isLight} />
        </div>
      </div>

      {locationPicker && (
        <div className="flex flex-wrap items-center gap-3">{locationPicker}</div>
      )}
    </motion.header>
  );
}

function LiveStatus({ isLight }: { isLight: boolean }) {
  const [time, setTime] = useState("—");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    };

    updateClock();
    const clockInterval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch("/api/admin/health");
        const data = (await response.json()) as { ok?: boolean };
        setOnline(Boolean(response.ok && data.ok));
      } catch {
        setOnline(false);
      }
    }

    checkHealth();
    const healthInterval = window.setInterval(
      checkHealth,
      ADMIN_HEALTH_CHECK_INTERVAL_MS,
    );
    return () => window.clearInterval(healthInterval);
  }, []);

  return (
    <ThemedPanel isLight={isLight} className="flex items-center gap-4 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          {online && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`}
          />
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${online ? "text-emerald-500" : "text-red-400"}`}
        >
          {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {online ? "En ligne" : "Hors ligne"}
        </span>
      </div>
      <div className={`hidden h-4 w-px sm:block ${isLight ? "bg-zinc-200" : "bg-white/10"}`} />
      <p className={`font-mono text-sm tabular-nums ${heading(isLight)}`}>{time}</p>
      <div className={`hidden h-4 w-px sm:block ${isLight ? "bg-zinc-200" : "bg-white/10"}`} />
      <span className={`hidden items-center gap-1 text-[10px] font-medium uppercase tracking-wider sm:flex ${muted(isLight)}`}>
        <RefreshCw className="h-3 w-3" />
        {ADMIN_POLL_INTERVAL_MS / 1000}s
      </span>
    </ThemedPanel>
  );
}
