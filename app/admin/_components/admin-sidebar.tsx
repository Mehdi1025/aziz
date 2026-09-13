"use client";

import {
  CalendarDays,
  ClipboardList,
  Grid3x3,
  History,
  KeyRound,
  LayoutDashboard,
  Map,
  PlusCircle,
  ScrollText,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AdminTab } from "@/app/admin/_components/admin-tabs";
import { sidebar, sidebarItem } from "@/lib/admin-theme";

type AdminSidebarProps = {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
  isLight?: boolean;
  occupiedCount: number;
  totalBoxes: number;
  cityCount?: number;
  distributorCount?: number;
};

const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "map", label: "Carte", icon: Map },
  { id: "reservations", label: "Réservations", icon: ClipboardList },
  { id: "history", label: "Historique", icon: History },
  { id: "calendar", label: "Calendrier", icon: CalendarDays },
  { id: "create", label: "Créer", icon: PlusCircle },
  { id: "journal", label: "Journal", icon: ScrollText },
  { id: "livegrid", label: "Casiers Live", icon: Grid3x3 },
  { id: "loueurs", label: "Loueurs", icon: KeyRound },
  { id: "controltower", label: "Control Tower", icon: Shield },
];

export function AdminSidebar({
  active,
  onChange,
  isLight = false,
  occupiedCount,
  totalBoxes,
  cityCount = 1,
  distributorCount = 1,
}: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r ${sidebar(isLight)}`}
      >
        <div className="flex h-full min-h-0 flex-col px-4 py-6">
          <div className="mb-8 px-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isLight
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-950"
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-bold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
                  KeyNest
                </p>
                <p className={`text-[10px] font-medium uppercase tracking-[0.2em] ${isLight ? "text-zinc-400" : "text-neutral-500"}`}>
                  Control Panel
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {tabs.map((tab) => {
              const selected = active === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${sidebarItem(selected, isLight)}`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={selected ? 2.25 : 1.75} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div
            className={`mt-auto rounded-xl border p-4 ${
              isLight
                ? "border-zinc-200 bg-zinc-50"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLight ? "text-zinc-400" : "text-neutral-500"}`}>
              Occupation
            </p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${isLight ? "text-zinc-900" : "text-white"}`}>
              {occupiedCount}
              <span className={`text-sm font-normal ${isLight ? "text-zinc-400" : "text-neutral-500"}`}>
                /{totalBoxes}
              </span>
            </p>
            <p className={`mt-1 text-[10px] ${isLight ? "text-zinc-400" : "text-neutral-500"}`}>
              {cityCount} ville{cityCount > 1 ? "s" : ""} · {distributorCount} distributeur{distributorCount > 1 ? "s" : ""}
            </p>
            <div
              className={`mt-2 h-1.5 overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}
            >
              <motion.div
                animate={{
                  width: `${totalBoxes > 0 ? (occupiedCount / totalBoxes) * 100 : 0}%`,
                }}
                className="h-full rounded-full bg-linear-to-r from-orange-500 to-amber-400"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 flex border-t px-2 py-2 lg:hidden ${sidebar(isLight)}`}
      >
        {tabs.slice(0, 3).map((tab) => {
          const selected = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                selected
                  ? isLight
                    ? "text-zinc-900"
                    : "text-white"
                  : isLight
                    ? "text-zinc-400"
                    : "text-neutral-500"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={selected ? 2.25 : 1.75} />
              <span className="truncate">{tab.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange("livegrid")}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
            active === "livegrid"
              ? isLight
                ? "text-zinc-900"
                : "text-white"
              : isLight
                ? "text-zinc-400"
                : "text-neutral-500"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
          <span>Live</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("controltower")}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
            active === "controltower"
              ? isLight
                ? "text-zinc-900"
                : "text-white"
              : isLight
                ? "text-zinc-400"
                : "text-neutral-500"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Tower</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("journal")}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
            active === "journal"
              ? isLight
                ? "text-zinc-900"
                : "text-white"
              : isLight
                ? "text-zinc-400"
                : "text-neutral-500"
          }`}
        >
          <ScrollText className="h-4 w-4" />
          <span>Journal</span>
        </button>
      </nav>
    </>
  );
}
