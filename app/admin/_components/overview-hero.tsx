"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Box, MapPin, WifiOff } from "lucide-react";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { heading, muted } from "@/lib/admin-theme";
import { getOccupancyColors } from "@/lib/overview-utils";

type OverviewHeroProps = {
  cityCount: number;
  distributorCount: number;
  activeDistributorCount: number;
  occupiedBoxes: number;
  totalBoxes: number;
  percent: number;
  offlineCount: number;
  saturatedSites: number;
  isLight?: boolean;
  title: string;
  subtitle: string;
};

export function OverviewHero({
  cityCount,
  distributorCount,
  activeDistributorCount,
  occupiedBoxes,
  totalBoxes,
  percent,
  offlineCount,
  saturatedSites,
  isLight = false,
  title,
  subtitle,
}: OverviewHeroProps) {
  const colors = getOccupancyColors(percent, isLight);
  const free = totalBoxes - occupiedBoxes;

  const stats = [
    {
      label: "Villes",
      value: String(cityCount),
      icon: MapPin,
      color: "#38bdf8",
    },
    {
      label: "Distributeurs",
      value: `${activeDistributorCount}/${distributorCount}`,
      icon: Box,
      color: "#a855f7",
    },
    {
      label: "Hors ligne",
      value: String(offlineCount),
      icon: WifiOff,
      color: offlineCount > 0 ? "#ef4444" : "#71717a",
    },
    {
      label: "Sites saturés",
      value: String(saturatedSites),
      icon: AlertTriangle,
      color: saturatedSites > 0 ? "#f97316" : "#71717a",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border">
      <div
        className={`absolute inset-0 ${
          isLight
            ? "bg-linear-to-br from-sky-50 via-white to-orange-50"
            : "bg-linear-to-br from-sky-500/10 via-transparent to-orange-500/10"
        }`}
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${muted(isLight)}`}>
              Vue d&apos;ensemble
            </p>
            <h2 className={`mt-1 text-2xl font-black tracking-tight sm:text-3xl ${heading(isLight)}`}>
              {title}
            </h2>
            <p className={`mt-1 text-sm ${muted(isLight)}`}>{subtitle}</p>
          </div>
          <div className="text-right">
            <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted(isLight)}`}>
              Occupation réseau
            </p>
            <p className={`text-3xl font-black tabular-nums ${colors.text}`}>
              {percent}
              <span className={`text-lg font-semibold ${muted(isLight)}`}>%</span>
            </p>
            <p className={`text-xs ${muted(isLight)}`}>
              {occupiedBoxes} occupés · {free} libres
            </p>
          </div>
        </div>

        <div className={`mt-4 h-2 overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full bg-linear-to-r ${colors.bar}`}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <ThemedPanel key={stat.label} isLight={isLight} className="relative overflow-hidden p-4">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                  style={{ backgroundColor: stat.color }}
                />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${muted(isLight)}`}>
                      {stat.label}
                    </p>
                    <p className={`mt-1 text-xl font-black tabular-nums ${heading(isLight)}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className="h-4 w-4 opacity-40" style={{ color: stat.color }} />
                </div>
              </ThemedPanel>
            );
          })}
        </div>
      </div>
    </section>
  );
}
