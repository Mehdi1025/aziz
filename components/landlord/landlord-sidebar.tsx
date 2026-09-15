"use client";

import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import {
  LANDLORD_TABS,
  type LandlordTab,
} from "@/components/landlord/landlord-tabs";
import { QuotaProgress } from "@/components/landlord/quota-progress";
import { heading, muted, sidebar, sidebarItem } from "@/lib/admin-theme";

type LandlordSidebarProps = {
  active: LandlordTab;
  onChange: (tab: LandlordTab) => void;
  isLight: boolean;
  hostName: string;
  hostEmail: string;
  planName: string;
  planSlug: string;
  keysUsed: number;
  maxKeys: number;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LandlordSidebar({
  active,
  onChange,
  isLight,
  hostName,
  hostEmail,
  planName,
  planSlug,
  keysUsed,
  maxKeys,
}: LandlordSidebarProps) {
  const initials = getInitials(hostName);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:h-screen lg:w-[280px] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r ${sidebar(isLight)}`}
      >
        <div className="flex h-full min-h-0 flex-col px-5 py-7">
          {/* Brand */}
          <div className="mb-10 px-1">
            <div className="flex items-center gap-3.5">
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${
                  isLight
                    ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/20"
                    : "bg-white text-zinc-950 shadow-xl shadow-white/10"
                }`}
              >
                <KeyRound className="h-5 w-5" strokeWidth={2.25} />
                <div
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 ${
                    isLight ? "border-white bg-emerald-500" : "border-zinc-950 bg-emerald-400"
                  }`}
                />
              </div>
              <div>
                <p className={`text-[15px] font-black tracking-tight ${heading(isLight)}`}>
                  KeyNest
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted(isLight)}`}>
                  Espace Hôte
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1.5">
            <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
              Menu
            </p>
            {LANDLORD_TABS.map((tab) => {
              const selected = active === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChange(tab.id)}
                  className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-colors duration-200 ${
                    selected ? "" : sidebarItem(false, isLight)
                  }`}
                >
                  {selected && (
                    <motion.div
                      layoutId="landlord-nav-active"
                      className={`absolute inset-0 rounded-2xl ${
                        isLight ? "bg-zinc-900" : "bg-white"
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-4 w-4 shrink-0 ${selected ? (isLight ? "text-white" : "text-zinc-950") : ""}`}
                    strokeWidth={selected ? 2.25 : 1.75}
                  />
                  <span className={`relative z-10 ${selected ? (isLight ? "text-white" : "text-zinc-950") : ""}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Quota widget */}
          <div
            className={`mb-5 rounded-2xl border p-4 ${
              isLight
                ? "border-zinc-200/80 bg-linear-to-br from-violet-50/80 to-white"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
          >
            <QuotaProgress
              used={keysUsed}
              max={maxKeys}
              isLight={isLight}
              planSlug={planSlug}
            />
          </div>

          {/* User profile */}
          <div
            className={`rounded-2xl border p-4 ${
              isLight
                ? "border-zinc-200/80 bg-zinc-50/80"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                  isLight
                    ? "bg-linear-to-br from-violet-600 to-fuchsia-600 text-white"
                    : "bg-linear-to-br from-violet-500 to-fuchsia-500 text-white"
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-bold ${heading(isLight)}`}>{hostName}</p>
                <p className={`truncate text-[11px] ${muted(isLight)}`}>{hostEmail}</p>
              </div>
            </div>
            <div
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                isLight
                  ? "bg-violet-100 text-violet-700"
                  : "bg-violet-500/15 text-violet-300"
              }`}
            >
              {planName}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 flex border-t px-1 py-2 lg:hidden ${sidebar(isLight)}`}
      >
        {LANDLORD_TABS.map((tab) => {
          const selected = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition-colors ${
                selected
                  ? isLight
                    ? "text-violet-700"
                    : "text-violet-300"
                  : muted(isLight)
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={selected ? 2.25 : 1.75} />
              <span className="truncate">{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
