"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  WifiOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { CityRow, DistributorRow } from "@/lib/network-types";
import {
  computeDistributorStats,
  type ReservationRow,
} from "@/lib/admin-utils";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { btnSecondary, heading, input as inputClass, muted } from "@/lib/admin-theme";
import {
  buildCityOverviewRows,
  filterCityRows,
  getOccupancyColors,
  groupByRegion,
  sortCityRows,
  type OverviewSort,
} from "@/lib/overview-utils";

type NetworkOverviewProps = {
  cities: CityRow[];
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  isLight?: boolean;
  onSelectCity: (cityId: string) => void;
  onSelectDistributor: (distributorId: string) => void;
};

export function NetworkOverview({
  cities,
  distributors,
  reservations,
  isLight = false,
  onSelectCity,
  onSelectDistributor,
}: NetworkOverviewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<OverviewSort>("occupancy_desc");
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  const cityRows = useMemo(
    () => sortCityRows(filterCityRows(buildCityOverviewRows(cities, distributors, reservations), query), sort),
    [cities, distributors, reservations, query, sort],
  );

  const regionGroups = useMemo(() => groupByRegion(cityRows), [cityRows]);

  const defaultExpanded = useMemo(() => {
    const high = regionGroups.filter((g) => g.percent >= 60 || g.offlineCount > 0);
    return new Set(high.map((g) => g.region));
  }, [regionGroups]);

  const activeExpanded =
    expandedRegions.size > 0 ? expandedRegions : defaultExpanded;

  function toggleRegion(region: string) {
    setExpandedRegions((current) => {
      const base = current.size > 0 ? current : new Set(defaultExpanded);
      const next = new Set(base);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  }

  function expandAll() {
    setExpandedRegions(new Set(regionGroups.map((g) => g.region)));
  }

  function collapseAll() {
    setExpandedRegions(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${muted(isLight)}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ville ou région…"
            className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none ${inputClass(isLight)}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as OverviewSort)}
            className={`rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          >
            <option value="occupancy_desc">Occupation ↓</option>
            <option value="occupancy_asc">Occupation ↑</option>
            <option value="name">Nom A→Z</option>
          </select>
          <button type="button" onClick={expandAll} className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${btnSecondary(isLight)}`}>
            Tout ouvrir
          </button>
          <button type="button" onClick={collapseAll} className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${btnSecondary(isLight)}`}>
            Tout fermer
          </button>
        </div>
      </div>

      {cityRows.length === 0 ? (
        <ThemedPanel isLight={isLight} className="px-6 py-10 text-center">
          <p className={`text-sm ${muted(isLight)}`}>Aucune ville ne correspond à votre recherche.</p>
        </ThemedPanel>
      ) : (
        <div className="space-y-3">
          {regionGroups.map((group, groupIndex) => {
            const open = activeExpanded.has(group.region);
            const colors = getOccupancyColors(group.percent, isLight);

            return (
              <motion.div
                key={group.region}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.03 }}
              >
                <ThemedPanel isLight={isLight} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleRegion(group.region)}
                    className={`flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 ${
                      isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/10 text-white"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-base font-black ${heading(isLight)}`}>{group.region}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>
                          {group.percent}%
                        </span>
                        {group.offlineCount > 0 && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isLight ? "bg-zinc-200 text-zinc-700" : "bg-white/10 text-neutral-400"
                          }`}>
                            <WifiOff className="h-3 w-3" />
                            {group.offlineCount} offline
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs ${muted(isLight)}`}>
                        {group.cities.length} ville{group.cities.length > 1 ? "s" : ""} ·{" "}
                        {group.occupiedBoxes}/{group.totalBoxes} casiers
                      </p>
                      <div className={`mt-2 h-1 max-w-xs overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
                        <div
                          className={`h-full rounded-full bg-linear-to-r ${colors.bar}`}
                          style={{ width: `${group.percent}%` }}
                        />
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${muted(isLight)}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className={`space-y-3 border-t p-4 sm:p-5 ${isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/[0.06] bg-white/[0.02]"}`}>
                          {group.cities.map((row) => (
                            <CityBlock
                              key={row.city.id}
                              row={row}
                              distributors={distributors.filter((d) => d.cityId === row.city.id)}
                              reservations={reservations}
                              isLight={isLight}
                              onSelectCity={onSelectCity}
                              onSelectDistributor={onSelectDistributor}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ThemedPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CityBlock({
  row,
  distributors,
  reservations,
  isLight,
  onSelectCity,
  onSelectDistributor,
}: {
  row: ReturnType<typeof buildCityOverviewRows>[number];
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  isLight: boolean;
  onSelectCity: (cityId: string) => void;
  onSelectDistributor: (distributorId: string) => void;
}) {
  const colors = getOccupancyColors(row.percent, isLight);

  return (
    <div
      className={`rounded-xl border ${
        isLight ? "border-zinc-200 bg-white" : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectCity(row.city.id)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
          isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.04]"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`font-bold ${heading(isLight)}`}>{row.city.name}</p>
            <span className={`text-xs font-bold tabular-nums ${colors.text}`}>{row.percent}%</span>
            {row.offlineCount > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${muted(isLight)}`}>
                <WifiOff className="h-3 w-3" />
                {row.offlineCount}
              </span>
            )}
          </div>
          <p className={`mt-0.5 text-xs ${muted(isLight)}`}>
            {row.distributorCount} site{row.distributorCount > 1 ? "s" : ""} · {row.occupiedBoxes}/{row.totalBoxes} casiers · {row.freeBoxes} libre{row.freeBoxes > 1 ? "s" : ""}
          </p>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 ${muted(isLight)}`} />
      </button>

      <div className={`grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3 ${isLight ? "border-zinc-100" : "border-white/[0.06]"}`}>
        {distributors.map((distributor) => {
          const stats = computeDistributorStats(distributor, reservations);
          const distPercent =
            stats.totalBoxes > 0
              ? Math.round((stats.occupiedBoxes / stats.totalBoxes) * 100)
              : 0;
          const distColors = getOccupancyColors(distPercent, isLight);

          return (
            <button
              key={distributor.id}
              type="button"
              onClick={() => onSelectDistributor(distributor.id)}
              className={`rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 ${
                isLight
                  ? "border-zinc-100 bg-zinc-50 hover:border-zinc-200 hover:shadow-sm"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
              } ${!distributor.isActive ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${heading(isLight)}`}>
                    {distributor.name}
                  </p>
                  <p className={`mt-0.5 line-clamp-1 text-[10px] ${muted(isLight)}`}>
                    {distributor.address ?? distributor.departmentName}
                  </p>
                </div>
                {!distributor.isActive ? (
                  <WifiOff className={`h-3.5 w-3.5 shrink-0 ${muted(isLight)}`} />
                ) : (
                  <Building2 className={`h-3.5 w-3.5 shrink-0 ${muted(isLight)}`} />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                <span className={muted(isLight)}>
                  {stats.occupiedBoxes}/{stats.totalBoxes}
                </span>
                <span className={distColors.text}>{distPercent}%</span>
              </div>
              <div className={`mt-1.5 h-1 overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
                <div
                  className={`h-full rounded-full bg-linear-to-r ${distColors.bar}`}
                  style={{ width: `${distPercent}%` }}
                />
              </div>
              {distPercent >= 85 && distributor.isActive && (
                <p className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold ${distColors.text}`}>
                  <AlertTriangle className="h-3 w-3" />
                  Saturation
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
