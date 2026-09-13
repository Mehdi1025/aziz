"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Radio,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import type { ReservationRow } from "@/lib/admin-utils";
import {
  btnPrimary,
  btnSecondary,
  heading,
  muted,
  panel,
} from "@/lib/admin-theme";
import {
  buildControlTowerSnapshot,
  mergeActionStates,
  PRIORITY_META,
  type ActionPriority,
  type ActionStatus,
  type ControlTowerAction,
} from "@/lib/control-tower";
import type { CityRow, DistributorRow } from "@/lib/network-types";

type ControlTowerPanelProps = {
  cities: CityRow[];
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  activityLogs: ActivityLogRow[];
  isLight?: boolean;
};

type PersistedState = Record<string, { status?: ActionStatus; assignee?: string | null }>;

const STORAGE_KEY = "control-tower-state-v1";
const ASSIGNEES = ["Équipe Paris", "Équipe Lyon", "Technicien terrain", "Support N1"];

const STATUS_COLUMNS: {
  id: ActionStatus;
  label: string;
  hint: string;
  accent: string;
}[] = [
  { id: "todo", label: "À traiter", hint: "Prioriser", accent: "#ef4444" },
  { id: "in_progress", label: "En cours", hint: "Suivi actif", accent: "#f59e0b" },
  { id: "done", label: "Résolu", hint: "Clôturé", accent: "#10b981" },
];

const PRIORITY_FILTERS: { id: ActionPriority | "all"; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "critical", label: "Critiques" },
  { id: "urgent", label: "Urgentes" },
  { id: "attention", label: "Attention" },
  { id: "info", label: "Info" },
];

function HealthRing({
  score,
  color,
  label,
  isLight,
  crisisMode,
}: {
  score: number;
  color: string;
  label: string;
  isLight: boolean;
  crisisMode: boolean;
}) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-[240px] w-[240px] items-center justify-center">
      <div
        className="tower-ring-glow absolute inset-4 rounded-full blur-2xl"
        style={{ backgroundColor: `${color}33` }}
      />
      <svg className="relative -rotate-90" width="240" height="240" aria-hidden>
        <circle
          cx="120"
          cy="120"
          r={radius + 14}
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"}
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={isLight ? "#e4e4e7" : "rgba(255,255,255,0.07)"}
          strokeWidth="12"
        />
        <motion.circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 16px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.p
          key={score}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black tabular-nums tracking-tighter"
          style={{ color }}
        >
          {score}
        </motion.p>
        <p className={`mt-1 text-[9px] font-bold uppercase tracking-[0.28em] ${muted(isLight)}`}>
          Health Score
        </p>
        <span
          className="mt-3 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: `${color}18`,
            color,
            boxShadow: crisisMode ? `0 0 20px ${color}44` : undefined,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function SparklinePath({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 36;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-9 w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function PerformanceStrip({
  metrics,
  isLight,
}: {
  metrics: ReturnType<typeof buildControlTowerSnapshot>["metrics"];
  isLight: boolean;
}) {
  return (
    <ThemedPanel isLight={isLight} className="overflow-hidden">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
          isLight ? "border-zinc-100" : "border-white/[0.06]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <div>
            <h3 className={`text-sm font-black ${heading(isLight)}`}>Performance Strip</h3>
            <p className={`text-[10px] ${muted(isLight)}`}>Indicateurs de gestion · 7 jours</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/[0.06] text-neutral-400"
          }`}
        >
          {metrics.length} KPIs
        </span>
      </div>

      <div
        className={`grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6 ${
          isLight ? "divide-zinc-100" : "divide-white/[0.06]"
        }`}
      >
        {metrics.map((metric, index) => {
          const positive = metric.delta >= 0;
          const invertPositive = metric.id === "mttr";

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative flex min-h-[132px] flex-col p-4 sm:p-5 ${
                isLight ? "bg-white/50" : "bg-white/[0.01]"
              }`}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
                style={{ backgroundColor: metric.color }}
              />
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted(isLight)}`}>
                  {metric.label}
                </p>
                <span
                  className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    (positive && !invertPositive) || (!positive && invertPositive)
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {positive ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {metric.delta >= 0 ? "+" : ""}
                  {metric.delta}%
                </span>
              </div>
              <p className={`mt-2 text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${heading(isLight)}`}>
                {metric.value}
                {metric.unit && (
                  <span className={`ml-1 text-sm font-semibold ${muted(isLight)}`}>{metric.unit}</span>
                )}
              </p>
              <div className="mt-auto pt-3">
                <SparklinePath values={metric.trend} color={metric.color} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </ThemedPanel>
  );
}

function ActionCard({
  action,
  isLight,
  onMove,
  onAssign,
}: {
  action: ControlTowerAction;
  isLight: boolean;
  onMove: (status: ActionStatus) => void;
  onAssign: () => void;
}) {
  const meta = PRIORITY_META[action.priority];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isLight
          ? "border-zinc-200/70 bg-white/90 hover:shadow-lg hover:shadow-zinc-200/60"
          : "border-white/[0.07] bg-white/[0.03] hover:border-white/14 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)]"
      }`}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: meta.color }}
      />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.color }}
            />
            {meta.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-semibold ${muted(isLight)}`}
          >
            <Clock3 className="h-3 w-3" />
            {action.slaLabel}
          </span>
        </div>

        <h4 className={`text-sm font-bold leading-snug ${heading(isLight)}`}>{action.title}</h4>
        <p className={`mt-1.5 text-xs leading-relaxed ${muted(isLight)}`}>{action.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span
            className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
              isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/[0.06] text-neutral-400"
            }`}
          >
            {action.impact}
          </span>
          {action.cityName && (
            <span
              className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                isLight ? "bg-violet-50 text-violet-700" : "bg-violet-500/10 text-violet-300"
              }`}
            >
              {action.cityName}
            </span>
          )}
        </div>

        {action.assignee && (
          <p className={`mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold ${isLight ? "text-sky-600" : "text-sky-400"}`}>
            <UserPlus className="h-3 w-3" />
            {action.assignee}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 opacity-100 transition-opacity sm:opacity-90 sm:group-hover:opacity-100">
          {action.status !== "done" ? (
            <>
              <button
                type="button"
                onClick={() => onMove(action.status === "todo" ? "in_progress" : "done")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold ${btnPrimary(isLight)}`}
              >
                {action.status === "todo" ? "Prendre en charge" : "Marquer résolu"}
                <ArrowRight className="h-3 w-3" />
              </button>
              {!action.assignee && (
                <button
                  type="button"
                  onClick={onAssign}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold ${btnSecondary(isLight)}`}
                >
                  <UserPlus className="h-3 w-3" />
                  Assigner
                </button>
              )}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Incident clôturé
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function ControlTowerPanel({
  cities,
  distributors,
  reservations,
  activityLogs,
  isLight = false,
}: ControlTowerPanelProps) {
  const [crisisMode, setCrisisMode] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState>({});
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ActionPriority | "all">("all");
  const [lastSync, setLastSync] = useState(() => new Date());

  useEffect(() => {
    setLastSync(new Date());
  }, [activityLogs, reservations]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setPersisted(JSON.parse(raw) as PersistedState);
    } catch {
      /* ignore */
    }
  }, []);

  function savePersisted(next: PersistedState) {
    setPersisted(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const snapshot = useMemo(
    () => buildControlTowerSnapshot(cities, distributors, reservations, activityLogs),
    [cities, distributors, reservations, activityLogs],
  );

  const actions = useMemo(
    () => mergeActionStates(snapshot.actions, persisted),
    [snapshot.actions, persisted],
  );

  const filteredRegions = selectedRegion
    ? snapshot.regions.filter((r) => r.region === selectedRegion)
    : snapshot.regions;

  const activeDistributors = distributors.filter((d) => d.isActive).length;

  function updateAction(id: string, patch: { status?: ActionStatus; assignee?: string | null }) {
    const next = { ...persisted, [id]: { ...persisted[id], ...patch } };
    savePersisted(next);
    if (patch.status === "done") toast.success("Incident clôturé");
    else if (patch.status === "in_progress") toast.message("Pris en charge");
  }

  function assignAction(action: ControlTowerAction) {
    const assignee = ASSIGNEES[Math.floor(Math.random() * ASSIGNEES.length)];
    updateAction(action.id, { assignee, status: "in_progress" });
    toast.success(`Assigné à ${assignee}`);
  }

  function filterAction(action: ControlTowerAction) {
    if (crisisMode && action.priority !== "critical" && action.priority !== "urgent") {
      return false;
    }
    if (priorityFilter !== "all" && action.priority !== priorityFilter) {
      return false;
    }
    if (selectedRegion && action.region !== selectedRegion && !crisisMode) {
      const regionMatch = snapshot.regions.find((r) => r.region === selectedRegion);
      if (regionMatch && action.cityName) {
        const city = cities.find((c) => c.name === action.cityName);
        if (city && city.region !== selectedRegion) return false;
      }
    }
    return true;
  }

  const openCritical = actions.filter(
    (a) => a.priority === "critical" && a.status !== "done",
  ).length;

  const syncLabel = lastSync.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <section className="relative space-y-6">
      {/* ── HERO COMMAND CENTER ── */}
      <div
        className={`tower-scanline relative overflow-hidden rounded-3xl border ${
          crisisMode
            ? isLight
              ? "border-red-300/80 bg-linear-to-br from-red-50 via-white to-orange-50"
              : "border-red-500/40 bg-linear-to-br from-red-950/40 via-zinc-950 to-zinc-900"
            : isLight
              ? "border-zinc-200/80 bg-linear-to-br from-violet-50/80 via-white to-sky-50/50"
              : "border-white/[0.08] bg-linear-to-br from-violet-950/20 via-zinc-950 to-zinc-900"
        }`}
      >
        <div className="tower-grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${
            crisisMode ? "bg-red-500/20" : "bg-violet-500/15"
          }`}
        />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                    isLight
                      ? "border-violet-200/80 bg-white/80"
                      : "border-violet-500/20 bg-violet-500/10"
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">
                    Control Tower
                  </span>
                </div>
                <div
                  className={`inline-flex items-center gap-2 text-[10px] font-semibold ${muted(isLight)}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Sync {syncLabel}
                </div>
              </div>

              <h2
                className={`max-w-xl text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl ${heading(isLight)}`}
              >
                Centre de
                <span className="block bg-linear-to-r from-violet-500 to-sky-500 bg-clip-text text-transparent">
                  pilotage réseau
                </span>
              </h2>

              <p className={`mt-3 max-w-lg text-sm leading-relaxed sm:text-base ${muted(isLight)}`}>
                Priorisez, assignez et mesurez la performance de votre flotte de distributeurs en temps réel.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  {
                    label: "Critiques",
                    value: openCritical,
                    color: "#ef4444",
                  },
                  {
                    label: "Actions ouvertes",
                    value: snapshot.openActionsCount,
                    color: "#f59e0b",
                  },
                  {
                    label: "Sites actifs",
                    value: `${activeDistributors}/${distributors.length}`,
                    color: "#10b981",
                  },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className={`rounded-2xl border px-4 py-2.5 backdrop-blur-sm ${
                      isLight
                        ? "border-white/80 bg-white/70"
                        : "border-white/[0.08] bg-white/[0.04]"
                    }`}
                  >
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                      {chip.label}
                    </p>
                    <p
                      className="mt-0.5 text-xl font-black tabular-nums"
                      style={{ color: chip.color }}
                    >
                      {chip.value}
                    </p>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setCrisisMode((v) => !v)}
                  className={`ml-auto inline-flex items-center gap-2 self-end rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
                    crisisMode
                      ? "border-red-500 bg-red-500 text-white shadow-xl shadow-red-500/30"
                      : isLight
                        ? "border-zinc-200 bg-white/80 hover:bg-white"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {crisisMode ? "Mode crise ON" : "Mode crise"}
                </button>
              </div>
            </div>

            <HealthRing
              score={snapshot.healthScore}
              color={crisisMode ? "#ef4444" : snapshot.healthColor}
              label={snapshot.healthLabel}
              isLight={isLight}
              crisisMode={crisisMode}
            />
          </div>

          {/* Brief matinal */}
          <div
            className={`mt-8 rounded-2xl border p-5 backdrop-blur-md sm:p-6 ${
              isLight
                ? "border-zinc-200/60 bg-white/60"
                : "border-white/[0.07] bg-black/25"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.14em] ${heading(isLight)}`}>
                    Brief matinal
                  </p>
                  <p className={`text-[10px] ${muted(isLight)}`}>Synthèse opérationnelle</p>
                </div>
              </div>
              {openCritical > 0 && (
                <span className="animate-pulse rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">
                  {openCritical} critique{openCritical > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {snapshot.morningBrief.map((line, index) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                    isLight ? "bg-zinc-50/80" : "bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                      isLight ? "bg-violet-100 text-violet-600" : "bg-violet-500/15 text-violet-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className={`text-sm leading-snug ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                    {line}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION QUEUE ── */}
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-500" />
              <h3 className={`text-xl font-black tracking-tight ${heading(isLight)}`}>
                Action Queue
              </h3>
            </div>
            <p className={`mt-1 text-xs ${muted(isLight)}`}>
              Priorisation intelligente · {snapshot.openActionsCount} action
              {snapshot.openActionsCount > 1 ? "s" : ""} en file
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {PRIORITY_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPriorityFilter(filter.id)}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                  priorityFilter === filter.id
                    ? isLight
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-950"
                    : btnSecondary(isLight)
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {STATUS_COLUMNS.map((column) => {
            const columnActions = actions.filter(
              (action) => action.status === column.id && filterAction(action),
            );

            return (
              <div
                key={column.id}
                className={`relative overflow-hidden rounded-2xl border ${
                  isLight
                    ? "border-zinc-200/70 bg-zinc-50/50"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                <div
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ backgroundColor: column.accent }}
                />
                <div className="border-b px-4 py-3.5" style={{ borderColor: `${column.accent}22` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wider ${heading(isLight)}`}>
                        {column.label}
                      </p>
                      <p className={`text-[10px] ${muted(isLight)}`}>{column.hint}</p>
                    </div>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black tabular-nums"
                      style={{
                        backgroundColor: `${column.accent}18`,
                        color: column.accent,
                      }}
                    >
                      {columnActions.length}
                    </span>
                  </div>
                </div>

                <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
                  <AnimatePresence mode="popLayout">
                    {columnActions.length === 0 ? (
                      <div className={`py-12 text-center ${muted(isLight)}`}>
                        <Activity className="mx-auto h-8 w-8 opacity-30" />
                        <p className="mt-2 text-xs font-medium">Aucune action</p>
                      </div>
                    ) : (
                      columnActions.map((action) => (
                        <ActionCard
                          key={action.id}
                          action={action}
                          isLight={isLight}
                          onMove={(status) => updateAction(action.id, { status })}
                          onAssign={() => assignAction(action)}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── REGIONS ── */}
      <ThemedPanel isLight={isLight} className="overflow-hidden">
        <div
          className={`border-b px-5 py-4 ${isLight ? "border-zinc-100" : "border-white/[0.06]"}`}
        >
          <h3 className={`text-sm font-black ${heading(isLight)}`}>Santé par région</h3>
          <p className={`text-xs ${muted(isLight)}`}>Filtrer la file d&apos;actions</p>
          {selectedRegion && (
            <button
              type="button"
              onClick={() => setSelectedRegion(null)}
              className="mt-2 text-[10px] font-bold text-violet-500 underline"
            >
              Réinitialiser le filtre
            </button>
          )}
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRegions.map((region, index) => {
            const color =
              region.score >= 80 ? "#10b981" : region.score >= 60 ? "#f59e0b" : "#ef4444";
            const isSelected = selectedRegion === region.region;

            return (
              <motion.button
                key={region.region}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => setSelectedRegion(isSelected ? null : region.region)}
                className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? isLight
                      ? "border-violet-300 bg-violet-50 shadow-md"
                      : "border-violet-500/40 bg-violet-500/10 shadow-[0_0_30px_-10px_rgba(139,92,246,0.5)]"
                    : isLight
                      ? "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50"
                      : "border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl"
                  style={{ backgroundColor: `${color}33` }}
                />
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                      {region.region}
                    </p>
                    <p
                      className="mt-1 text-3xl font-black tabular-nums leading-none"
                      style={{ color }}
                    >
                      {region.score}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] ${muted(isLight)}`}>{region.distributors} sites</p>
                    <p className="text-[10px] font-bold" style={{ color }}>
                      {region.issues} signal{region.issues !== 1 ? "aux" : ""}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-3 h-1.5 overflow-hidden rounded-full ${
                    isLight ? "bg-zinc-100" : "bg-white/10"
                  }`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${region.score}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      </ThemedPanel>

      {/* ── PERFORMANCE STRIP (pleine largeur) ── */}
      <PerformanceStrip metrics={snapshot.metrics} isLight={isLight} />
    </section>
  );
}
