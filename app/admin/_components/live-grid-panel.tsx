"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Radio,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { BoxCard } from "@/app/admin/_components/box-card";
import { LiveBoxTile } from "@/app/admin/_components/live-box-tile";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import { formatDateTime, type ReservationRow } from "@/lib/admin-utils";
import { btnSecondary, heading, input as inputClass, muted, panel } from "@/lib/admin-theme";
import {
  BOX_STATUS_META,
  buildLiveGridCells,
  computeLiveGridStats,
  filterLiveGridCells,
  getLivePulseKeys,
  groupLiveGridCells,
  type BoxStatusFilter,
  type LiveBoxCell,
} from "@/lib/live-grid-utils";
import type { DistributorRow } from "@/lib/network-types";
import { isAllDistributorsFilter } from "@/lib/network-types";

type LiveGridPanelProps = {
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  activityLogs: ActivityLogRow[];
  selectedCityId: string;
  selectedDistributorId: string;
  isLight?: boolean;
  onUpdated?: () => void;
};

const FILTERS: { id: BoxStatusFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "free", label: "Libres" },
  { id: "occupied", label: "Occupés" },
  { id: "blocked", label: "Bloqués" },
];

function OccupancyStrip({
  stats,
  isLight,
}: {
  stats: ReturnType<typeof computeLiveGridStats>;
  isLight: boolean;
}) {
  const occupiedRatio = stats.total > 0 ? (stats.occupied + stats.blocked) / stats.total : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em]">
        <span className={muted(isLight)}>Occupation réseau</span>
        <span className={heading(isLight)}>
          {Math.round(occupiedRatio * 100)}%
        </span>
      </div>
      <div
        className={`flex h-2 overflow-hidden rounded-full ${
          isLight ? "bg-zinc-100" : "bg-white/10"
        }`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${stats.total > 0 ? (stats.free / stats.total) * 100 : 0}%`,
          }}
          className="h-full bg-emerald-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${stats.total > 0 ? (stats.occupied / stats.total) * 100 : 0}%`,
          }}
          className="h-full bg-orange-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%`,
          }}
          className="h-full bg-red-500"
        />
      </div>
    </div>
  );
}

export function LiveGridPanel({
  distributors,
  reservations,
  activityLogs,
  selectedCityId,
  selectedDistributorId,
  isLight = false,
  onUpdated,
}: LiveGridPanelProps) {
  const [statusFilter, setStatusFilter] = useState<BoxStatusFilter>("all");
  const [selectedCell, setSelectedCell] = useState<LiveBoxCell | null>(null);
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const singleSite = !isAllDistributorsFilter(selectedDistributorId);

  const allCells = useMemo(
    () =>
      buildLiveGridCells(
        distributors,
        reservations,
        selectedCityId,
        selectedDistributorId,
      ),
    [distributors, reservations, selectedCityId, selectedDistributorId],
  );

  const filteredCells = useMemo(() => {
    let cells = filterLiveGridCells(allCells, statusFilter);
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cells;

    return cells.filter(
      (cell) =>
        String(cell.boxNumber).includes(normalized) ||
        cell.cityName.toLowerCase().includes(normalized) ||
        cell.distributorName.toLowerCase().includes(normalized),
    );
  }, [allCells, statusFilter, query]);

  const groups = useMemo(
    () => groupLiveGridCells(filteredCells),
    [filteredCells],
  );

  const stats = useMemo(() => computeLiveGridStats(allCells), [allCells]);
  const pulseKeys = useMemo(
    () => getLivePulseKeys(activityLogs),
    [activityLogs],
  );

  const recentScans = useMemo(
    () =>
      activityLogs
        .filter((log) => log.type === "SCAN" || log.type === "REMOTE_OPEN")
        .slice(0, 6),
    [activityLogs],
  );

  useEffect(() => {
    if (!selectedCell) return;
    const stillVisible = filteredCells.some((cell) => cell.id === selectedCell.id);
    if (!stillVisible) setSelectedCell(null);
  }, [filteredCells, selectedCell]);

  function toggleGroup(distributorId: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(distributorId)) next.delete(distributorId);
      else next.add(distributorId);
      return next;
    });
  }

  function focusCellFromLog(log: ActivityLogRow) {
    if (!log.distributorId || !log.boxNumber) return;
    const cell = allCells.find(
      (item) =>
        item.distributorId === log.distributorId &&
        item.boxNumber === log.boxNumber,
    );
    if (cell) {
      setSelectedCell(cell);
      setCollapsedGroups((current) => {
        const next = new Set(current);
        next.delete(cell.distributorId);
        return next;
      });
    }
  }

  return (
    <section className="relative -mx-1 space-y-5 sm:-mx-0">
      {/* Hero command bar */}
      <ThemedPanel
        isLight={isLight}
        className={`relative overflow-hidden ${isLight ? "border-zinc-200/80" : "border-white/[0.08]"}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)]"
              : "bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)]"
          }`}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
                    isLight ? "text-emerald-600" : "text-emerald-400"
                  }`}
                >
                  Live Grid
                </span>
              </div>
              <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${heading(isLight)}`}>
                Casiers en direct
              </h2>
              <p className={`mt-1 max-w-xl text-sm ${muted(isLight)}`}>
                {stats.total} casiers monitorés · pulse sur les ouvertures des 90 dernières secondes
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "free", ...BOX_STATUS_META.free },
                  { key: "occupied", ...BOX_STATUS_META.occupied },
                  { key: "blocked", ...BOX_STATUS_META.blocked },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setStatusFilter((current) =>
                      current === item.key ? "all" : item.key,
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    statusFilter === item.key
                      ? isLight
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                        : "border-white bg-white text-zinc-950 shadow-lg shadow-white/10"
                      : panel(isLight)
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    {item.label}
                  </p>
                  <p className="text-lg font-black tabular-nums leading-none">
                    {stats[item.key]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 max-w-2xl">
            <OccupancyStrip stats={stats} isLight={isLight} />
          </div>
        </div>
      </ThemedPanel>

      {/* Sticky toolbar */}
      <div
        className={`sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-2xl border p-2 backdrop-blur-xl ${
          isLight
            ? "border-zinc-200/80 bg-white/85 shadow-sm"
            : "border-white/[0.08] bg-zinc-950/85 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
        }`}
      >
        <div className="relative min-w-[160px] flex-1">
          <Search
            className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${muted(isLight)}`}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Casier, ville, site…"
            className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-medium outline-none ${inputClass(isLight)}`}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.id;
            const count =
              filter.id === "all"
                ? stats.total
                : stats[filter.id as keyof typeof stats];

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${
                  active
                    ? isLight
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-950"
                    : btnSecondary(isLight)
                }`}
              >
                {filter.label}
                <span className="ml-1 opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* Grid canvas */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <ThemedPanel isLight={isLight} className="px-6 py-20 text-center">
              <Sparkles className={`mx-auto h-10 w-10 ${muted(isLight)}`} />
              <p className={`mt-4 text-sm font-semibold ${heading(isLight)}`}>
                Aucun casier trouvé
              </p>
              <p className={`mt-1 text-xs ${muted(isLight)}`}>
                Modifiez vos filtres ou votre recherche.
              </p>
            </ThemedPanel>
          ) : singleSite && groups.length === 1 ? (
            <ThemedPanel isLight={isLight} className="p-4 sm:p-5">
              <motion.div
                layout
                className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
              >
                {groups[0].cells.map((cell, index) => (
                  <LiveBoxTile
                    key={cell.id}
                    cell={cell}
                    index={index}
                    isLight={isLight}
                    isPulsing={pulseKeys.has(cell.id)}
                    isSelected={selectedCell?.id === cell.id}
                    onSelect={() => setSelectedCell(cell)}
                  />
                ))}
              </motion.div>
            </ThemedPanel>
          ) : (
            groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.distributorId);
              const groupStats = computeLiveGridStats(group.cells);

              return (
                <ThemedPanel
                  key={group.distributorId}
                  isLight={isLight}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.distributorId)}
                    className={`flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors ${
                      isLight
                        ? "border-zinc-100 hover:bg-zinc-50/80"
                        : "border-white/[0.06] hover:bg-white/[0.03]"
                    }`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${
                        isCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${heading(isLight)}`}>
                        {group.cityName} · {group.distributorName}
                      </p>
                      <p className={`text-xs ${muted(isLight)}`}>
                        {group.departmentCode} · {group.cells.length} casiers visibles
                      </p>
                    </div>
                    <div className="hidden items-center gap-1.5 sm:flex">
                      {groupStats.occupied > 0 && (
                        <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-500">
                          {groupStats.occupied}
                        </span>
                      )}
                      {groupStats.blocked > 0 && (
                        <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">
                          {groupStats.blocked}
                        </span>
                      )}
                      {groupStats.free > 0 && (
                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          {groupStats.free}
                        </span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-5">
                          {group.cells.map((cell, index) => (
                            <LiveBoxTile
                              key={cell.id}
                              cell={cell}
                              index={index}
                              isLight={isLight}
                              isPulsing={pulseKeys.has(cell.id)}
                              isSelected={selectedCell?.id === cell.id}
                              onSelect={() => setSelectedCell(cell)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ThemedPanel>
              );
            })
          )}
        </div>

        {/* Side rail */}
        <div className="space-y-4 xl:sticky xl:top-[4.5rem] xl:self-start">
          <ThemedPanel isLight={isLight} className="overflow-hidden">
            <div
              className={`flex items-center justify-between border-b px-4 py-3 ${
                isLight ? "border-zinc-100" : "border-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-sky-500" />
                <p className={`text-sm font-bold ${heading(isLight)}`}>Focus casier</p>
              </div>
              {selectedCell && (
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  aria-label="Fermer"
                  className={`rounded-lg p-1.5 ${btnSecondary(isLight)}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {selectedCell ? (
                  <motion.div
                    key={selectedCell.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                  >
                    <div
                      className={`mb-4 rounded-xl border px-3 py-2.5 ${
                        isLight ? "border-zinc-100 bg-zinc-50" : "border-white/[0.06] bg-white/[0.03]"
                      }`}
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                        Site sélectionné
                      </p>
                      <p className={`mt-1 text-sm font-bold ${heading(isLight)}`}>
                        {selectedCell.distributorName}
                      </p>
                      <p className={`text-xs ${muted(isLight)}`}>{selectedCell.cityName}</p>
                    </div>
                    <BoxCard
                      boxNumber={selectedCell.boxNumber}
                      distributorId={selectedCell.distributorId}
                      reservations={reservations.filter(
                        (r) => r.distributorId === selectedCell.distributorId,
                      )}
                      isLight={isLight}
                      onUpdated={onUpdated}
                      compact
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                        isLight ? "bg-zinc-100" : "bg-white/[0.06]"
                      }`}
                    >
                      <Zap className={`h-6 w-6 ${muted(isLight)}`} />
                    </div>
                    <p className={`mt-4 text-sm font-semibold ${heading(isLight)}`}>
                      Sélectionnez un casier
                    </p>
                    <p className={`mt-1 px-2 text-xs leading-relaxed ${muted(isLight)}`}>
                      Cliquez une tuile pour ouvrir le détail et déclencher une ouverture à distance.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ThemedPanel>

          <ThemedPanel isLight={isLight} className="overflow-hidden">
            <div
              className={`border-b px-4 py-3 ${
                isLight ? "border-zinc-100" : "border-white/[0.06]"
              }`}
            >
              <p className={`text-sm font-bold ${heading(isLight)}`}>Flux live</p>
              <p className={`mt-0.5 text-[10px] ${muted(isLight)}`}>
                Clic pour centrer sur le casier
              </p>
            </div>
            <div className={`divide-y ${isLight ? "divide-zinc-100" : "divide-white/[0.06]"}`}>
              {recentScans.length === 0 ? (
                <p className={`px-4 py-8 text-center text-xs ${muted(isLight)}`}>
                  En attente d&apos;ouverture…
                </p>
              ) : (
                recentScans.map((log) => {
                  const cellId =
                    log.distributorId && log.boxNumber
                      ? `${log.distributorId}-${log.boxNumber}`
                      : null;
                  const isHot = cellId ? pulseKeys.has(cellId) : false;

                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => focusCellFromLog(log)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-bold ${heading(isLight)}`}>
                          Casier {String(log.boxNumber ?? "—").padStart(2, "0")}
                        </p>
                        {isHot && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 truncate text-[10px] ${muted(isLight)}`}>
                        {log.cityName} · {log.distributorName}
                      </p>
                      <p className={`mt-1 text-[9px] ${muted(isLight)}`}>
                        {formatDateTime(log.createdAt)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </ThemedPanel>
        </div>
      </div>
    </section>
  );
}
