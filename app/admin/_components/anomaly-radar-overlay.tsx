"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleMarker, useMap } from "react-leaflet";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Radar,
  TrendingUp,
  WifiOff,
  XCircle,
} from "lucide-react";
import {
  ANOMALY_META,
  type AnomalyType,
  type NetworkAnomaly,
} from "@/lib/anomaly-radar";

type AnomalyRadarOverlayProps = {
  anomalies: NetworkAnomaly[];
  focusedAnomalyId: string | null;
  onFocusAnomaly: (anomaly: NetworkAnomaly) => void;
  isLight?: boolean;
};

const anomalyIcons = {
  BLOCKED_LOCKER: Lock,
  SCAN_REFUSED: XCircle,
  DISTRIBUTOR_OFFLINE: WifiOff,
  OCCUPANCY_PEAK: TrendingUp,
} as const;

const TYPE_ORDER: AnomalyType[] = [
  "SCAN_REFUSED",
  "DISTRIBUTOR_OFFLINE",
  "BLOCKED_LOCKER",
  "OCCUPANCY_PEAK",
];

function AnomalyPulseMarker({ anomaly }: { anomaly: NetworkAnomaly }) {
  const meta = ANOMALY_META[anomaly.type];

  return (
    <CircleMarker
      center={[anomaly.latitude, anomaly.longitude]}
      radius={18}
      pathOptions={{
        color: meta.color,
        fillColor: meta.color,
        fillOpacity: 0.12,
        weight: 2,
        className: "anomaly-map-pulse",
      }}
    />
  );
}

export function AnomalyRadarOverlay({
  anomalies,
  focusedAnomalyId,
  onFocusAnomaly,
  isLight = false,
}: AnomalyRadarOverlayProps) {
  const map = useMap();
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<AnomalyType | null>(null);
  const [beam, setBeam] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
  } | null>(null);

  const focusedAnomaly =
    anomalies.find((item) => item.id === focusedAnomalyId) ?? null;

  const grouped = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        meta: ANOMALY_META[type],
        items: anomalies.filter((item) => item.type === type),
      })).filter((group) => group.items.length > 0),
    [anomalies],
  );

  const criticalCount = anomalies.filter((item) => item.severity === "critical").length;

  useEffect(() => {
    function updateBeam() {
      if (!focusedAnomaly) {
        setBeam(null);
        return;
      }

      const container = map.getContainer();
      const containerRect = container.getBoundingClientRect();
      const itemEl = itemRefs.current.get(focusedAnomaly.id);

      let fromX = containerRect.width - 16;
      let fromY = 28;

      if (itemEl) {
        const itemRect = itemEl.getBoundingClientRect();
        fromX = itemRect.left - containerRect.left;
        fromY = itemRect.top - containerRect.top + itemRect.height / 2;
      } else if (panelRef.current) {
        const panelRect = panelRef.current.getBoundingClientRect();
        fromX = panelRect.left - containerRect.left + 12;
        fromY = panelRect.top - containerRect.top + 18;
      }

      const to = map.latLngToContainerPoint([
        focusedAnomaly.latitude,
        focusedAnomaly.longitude,
      ]);

      setBeam({
        from: { x: fromX, y: fromY },
        to: { x: to.x, y: to.y },
        color: ANOMALY_META[focusedAnomaly.type].color,
      });
    }

    updateBeam();
    map.on("move zoom resize viewreset", updateBeam);
    window.addEventListener("resize", updateBeam);

    return () => {
      map.off("move zoom resize viewreset", updateBeam);
      window.removeEventListener("resize", updateBeam);
    };
  }, [map, focusedAnomaly, panelOpen, expandedType]);

  if (anomalies.length === 0) {
    return null;
  }

  const portalTarget = map.getContainer();
  const shell = isLight
    ? "border-zinc-200/90 bg-white/95 text-zinc-800 shadow-xl shadow-zinc-300/25"
    : "border-white/10 bg-zinc-950/94 text-white shadow-xl shadow-black/50";

  function toggleType(type: AnomalyType) {
    setExpandedType((current) => (current === type ? null : type));
  }

  function handleSelectAnomaly(anomaly: NetworkAnomaly) {
    if (expandedType !== anomaly.type) {
      setExpandedType(anomaly.type);
    }
    onFocusAnomaly(anomaly);
  }

  return (
    <>
      {focusedAnomaly && <AnomalyPulseMarker anomaly={focusedAnomaly} />}

      {createPortal(
        <div className="anomaly-radar-layer pointer-events-none absolute inset-0 z-[500] overflow-hidden">
          {beam && (
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <line
                x1={beam.from.x}
                y1={beam.from.y}
                x2={beam.to.x}
                y2={beam.to.y}
                stroke={beam.color}
                strokeWidth={2}
                strokeOpacity={0.65}
                strokeDasharray="5 4"
                className="anomaly-beam-active"
              />
              <circle
                cx={beam.to.x}
                cy={beam.to.y}
                r={8}
                fill={beam.color}
                fillOpacity={0.25}
                className="anomaly-target-pulse"
              />
            </svg>
          )}

          <div
            ref={panelRef}
            className="pointer-events-auto absolute right-3 top-3"
          >
            {!panelOpen ? (
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className={`group flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold backdrop-blur-md transition-all ${shell}`}
              >
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15">
                  <Radar className="h-3.5 w-3.5 text-sky-500" />
                  {criticalCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                  )}
                </span>
                <span>Anomalies</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/10 text-neutral-300"
                  }`}
                >
                  {anomalies.length}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-y-0.5" />
              </button>
            ) : (
              <div
                className={`w-[min(240px,calc(100vw-2rem))] overflow-hidden rounded-2xl border backdrop-blur-xl ${shell}`}
              >
                <div
                  className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 ${
                    isLight ? "border-zinc-100" : "border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Radar className="h-4 w-4 text-sky-500" />
                    <div>
                      <p className="text-xs font-bold leading-none">Anomalies</p>
                      <p
                        className={`mt-0.5 text-[10px] ${
                          isLight ? "text-zinc-500" : "text-neutral-500"
                        }`}
                      >
                        {anomalies.length} alerte{anomalies.length > 1 ? "s" : ""} actives
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Fermer le panneau anomalies"
                    onClick={() => {
                      setPanelOpen(false);
                      setExpandedType(null);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      isLight ? "hover:bg-zinc-100" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4 rotate-180 opacity-60" />
                  </button>
                </div>

                <div className="max-h-[min(320px,50vh)] overflow-y-auto p-1.5">
                  {grouped.map(({ type, meta, items }) => {
                    const Icon = anomalyIcons[type];
                    const isExpanded = expandedType === type;

                    return (
                      <div key={type} className="mb-1 last:mb-0">
                        <button
                          type="button"
                          onClick={() => toggleType(type)}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors ${
                            isExpanded
                              ? isLight
                                ? "bg-zinc-50"
                                : "bg-white/[0.04]"
                              : isLight
                                ? "hover:bg-zinc-50"
                                : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `${meta.color}18`,
                              color: meta.color,
                            }}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-bold leading-tight">
                              {meta.label}
                            </span>
                            <span
                              className={`text-[10px] ${
                                isLight ? "text-zinc-500" : "text-neutral-500"
                              }`}
                            >
                              {items.length} signal{items.length > 1 ? "s" : ""}
                            </span>
                          </span>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{
                              backgroundColor: `${meta.color}18`,
                              color: meta.color,
                            }}
                          >
                            {items.length}
                          </span>
                          <ChevronRight
                            className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="space-y-0.5 px-1 pb-1 pt-0.5">
                              {items.map((anomaly) => {
                                const isFocused = focusedAnomalyId === anomaly.id;

                                return (
                                  <button
                                    key={anomaly.id}
                                    ref={(node) => {
                                      if (node) itemRefs.current.set(anomaly.id, node);
                                      else itemRefs.current.delete(anomaly.id);
                                    }}
                                    type="button"
                                    onClick={() => handleSelectAnomaly(anomaly)}
                                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                                      isFocused
                                        ? isLight
                                          ? "bg-sky-50 ring-1 ring-sky-200"
                                          : "bg-sky-500/10 ring-1 ring-sky-500/25"
                                        : isLight
                                          ? "hover:bg-zinc-50"
                                          : "hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <p className="truncate text-[11px] font-semibold leading-tight">
                                      {anomaly.title}
                                    </p>
                                    <p
                                      className={`mt-0.5 truncate text-[10px] leading-tight ${
                                        isLight ? "text-zinc-500" : "text-neutral-500"
                                      }`}
                                    >
                                      {anomaly.cityName} · {anomaly.distributorName}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}

export function getAnomalyFlyTarget(anomaly: NetworkAnomaly) {
  return {
    lat: anomaly.latitude,
    lng: anomaly.longitude,
    departmentCode: anomaly.departmentCode,
  };
}
