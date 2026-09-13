"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Eye, MapPin } from "lucide-react";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import {
  computeDistributorStats,
  type ReservationRow,
} from "@/lib/admin-utils";
import {
  ANOMALY_META,
  countAnomaliesByType,
  detectNetworkAnomalies,
  type NetworkAnomaly,
} from "@/lib/anomaly-radar";
import {
  ALL_DEPARTMENTS_ID,
  formatDepartmentLabel,
  type DistributorRow,
} from "@/lib/network-types";
import {
  FRANCE_MAP_CENTER,
  FRANCE_MAP_ZOOM,
  getDepartmentBounds,
  getDistributorsInDepartment,
  getGoogleMapsUrl,
  groupDistributorsByDepartment,
} from "@/lib/map-utils";
import {
  createDepartmentMapIcon,
  createDistributorMapIcon,
} from "@/lib/map-icons";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { AnomalyRadarOverlay } from "@/app/admin/_components/anomaly-radar-overlay";
import { btnPrimary, btnSecondary, heading, muted, panel } from "@/lib/admin-theme";

type NetworkMapInnerProps = {
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  activityLogs: ActivityLogRow[];
  isLight?: boolean;
  onSelectDistributor?: (distributorId: string) => void;
};

function MapFlyController({
  bounds,
  zoom,
  flyToken,
  point,
}: {
  bounds: LatLngBoundsExpression | null;
  zoom: number;
  flyToken: number;
  point?: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();

      if (point) {
        map.flyTo([point.lat, point.lng], 15, { duration: 1.1 });
      } else if (bounds) {
        map.flyToBounds(bounds, {
          padding: [56, 56],
          maxZoom: 13,
          duration: 1.1,
        });
      } else {
        map.flyTo([FRANCE_MAP_CENTER.lat, FRANCE_MAP_CENTER.lng], zoom, {
          duration: 1.1,
        });
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [bounds, zoom, map, flyToken, point]);

  return null;
}

export default function NetworkMapInner({
  distributors,
  reservations,
  activityLogs,
  isLight = false,
  onSelectDistributor,
}: NetworkMapInnerProps) {
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_DEPARTMENTS_ID);
  const [mapFocusDepartment, setMapFocusDepartment] = useState(ALL_DEPARTMENTS_ID);
  const [flyToken, setFlyToken] = useState(0);
  const [flyPoint, setFlyPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [focusedAnomalyId, setFocusedAnomalyId] = useState<string | null>(null);

  const geoDistributors = useMemo(
    () =>
      distributors.filter(
        (d) =>
          d.isActive &&
          Number.isFinite(d.latitude) &&
          Number.isFinite(d.longitude),
      ),
    [distributors],
  );

  const anomalies = useMemo(
    () =>
      detectNetworkAnomalies({
        distributors,
        reservations,
        activityLogs,
      }),
    [distributors, reservations, activityLogs],
  );

  const anomalyCounts = useMemo(() => countAnomaliesByType(anomalies), [anomalies]);

  const departments = useMemo(
    () => groupDistributorsByDepartment(geoDistributors),
    [geoDistributors],
  );

  const focusedDistributors = useMemo(() => {
    if (mapFocusDepartment === ALL_DEPARTMENTS_ID) return geoDistributors;
    return getDistributorsInDepartment(geoDistributors, mapFocusDepartment);
  }, [geoDistributors, mapFocusDepartment]);

  const listDistributors = useMemo(() => {
    if (selectedDepartment === ALL_DEPARTMENTS_ID) return geoDistributors;
    return getDistributorsInDepartment(geoDistributors, selectedDepartment);
  }, [geoDistributors, selectedDepartment]);

  const flyBounds = useMemo(() => {
    if (mapFocusDepartment === ALL_DEPARTMENTS_ID) return null;
    return getDepartmentBounds(focusedDistributors);
  }, [mapFocusDepartment, focusedDistributors]);

  const flyZoom = mapFocusDepartment === ALL_DEPARTMENTS_ID ? FRANCE_MAP_ZOOM : 12;
  const isDepartmentZoomed = mapFocusDepartment !== ALL_DEPARTMENTS_ID;

  function handleViewDepartment(code: string) {
    setSelectedDepartment(code);
    setMapFocusDepartment(code);
    setFlyPoint(null);
    setFocusedAnomalyId(null);
    setFlyToken((t) => t + 1);
  }

  function handleViewFrance() {
    setSelectedDepartment(ALL_DEPARTMENTS_ID);
    setMapFocusDepartment(ALL_DEPARTMENTS_ID);
    setFlyPoint(null);
    setFocusedAnomalyId(null);
    setFlyToken((t) => t + 1);
  }

  function handleFocusAnomaly(anomaly: NetworkAnomaly) {
    setFocusedAnomalyId(anomaly.id);
    setSelectedDepartment(anomaly.departmentCode);
    setMapFocusDepartment(anomaly.departmentCode);
    setFlyPoint({ lat: anomaly.latitude, lng: anomaly.longitude });
    setFlyToken((t) => t + 1);
  }

  const voirBtn = (onClick: () => void, active: boolean) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        active
          ? btnPrimary(isLight)
          : btnSecondary(isLight)
      }`}
    >
      <Eye className="h-3 w-3" />
      Voir
    </button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Panneau départements */}
      <ThemedPanel isLight={isLight} className="flex max-h-[640px] flex-col overflow-hidden">
        <div className={`border-b px-4 py-3 ${isLight ? "border-zinc-200" : "border-white/[0.06]"}`}>
          <h3 className={`text-sm font-bold ${heading(isLight)}`}>Départements</h3>
          <p className={`mt-0.5 text-xs ${muted(isLight)}`}>
            Sélectionnez un département, puis cliquez <strong>Voir</strong> pour zoomer
          </p>
        </div>

        <div className="overflow-y-auto p-2">
          <div
            className={`mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors ${
              selectedDepartment === ALL_DEPARTMENTS_ID
                ? isLight
                  ? "bg-zinc-100 ring-1 ring-zinc-300"
                  : "bg-white/[0.06] ring-1 ring-white/15"
                : isLight
                  ? "hover:bg-zinc-50"
                  : "hover:bg-white/[0.04]"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedDepartment(ALL_DEPARTMENTS_ID)}
              className="min-w-0 flex-1 text-left text-sm"
            >
              <span className={`font-semibold ${heading(isLight)}`}>France entière</span>
              <span className={`mt-0.5 block text-xs ${muted(isLight)}`}>
                {geoDistributors.length} distributeurs
              </span>
            </button>
            {voirBtn(handleViewFrance, mapFocusDepartment === ALL_DEPARTMENTS_ID)}
          </div>

          {departments.map((department) => {
            const isSelected = selectedDepartment === department.code;
            const isMapFocused = mapFocusDepartment === department.code;

            return (
              <div
                key={department.code}
                className={`mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                  isSelected
                    ? isLight
                      ? "bg-zinc-100 ring-1 ring-zinc-300"
                      : "bg-white/[0.06] ring-1 ring-white/15"
                    : isLight
                      ? "hover:bg-zinc-50"
                      : "hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDepartment(department.code)}
                  className="min-w-0 flex-1 text-left text-sm"
                >
                  <span className={`font-semibold ${heading(isLight)}`}>
                    {formatDepartmentLabel(department)}
                  </span>
                  <span className={`mt-0.5 block text-xs ${muted(isLight)}`}>
                    {department.distributorCount} distributeur
                    {department.distributorCount > 1 ? "s" : ""} · {department.totalBoxes} casiers
                  </span>
                </button>
                {voirBtn(() => handleViewDepartment(department.code), isMapFocused)}
              </div>
            );
          })}
        </div>

        <div className={`border-t p-3 ${isLight ? "border-zinc-200" : "border-white/[0.06]"}`}>
          <div className="mb-2 flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-[0.15em] ${muted(isLight)}`}>
              Radar anomalies
            </h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                anomalies.length > 0
                  ? isLight
                    ? "bg-red-100 text-red-700"
                    : "bg-red-500/15 text-red-400"
                  : isLight
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-emerald-500/15 text-emerald-400"
              }`}
            >
              {anomalies.length}
            </span>
          </div>

          <div className="mb-2 flex flex-wrap gap-1">
            {(Object.keys(ANOMALY_META) as Array<keyof typeof ANOMALY_META>).map((type) => (
              <span
                key={type}
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                  isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/[0.06] text-neutral-400"
                }`}
                style={
                  anomalyCounts[type] > 0
                    ? { color: ANOMALY_META[type].color }
                    : undefined
                }
              >
                {ANOMALY_META[type].shortLabel} {anomalyCounts[type]}
              </span>
            ))}
          </div>

          <div className="max-h-36 space-y-1 overflow-y-auto">
            {anomalies.length === 0 ? (
              <p className={`py-2 text-center text-xs ${muted(isLight)}`}>
                Aucune anomalie détectée
              </p>
            ) : (
              anomalies.slice(0, 12).map((anomaly) => {
                const meta = ANOMALY_META[anomaly.type];
                const isFocused = focusedAnomalyId === anomaly.id;

                return (
                  <button
                    key={anomaly.id}
                    type="button"
                    onClick={() => handleFocusAnomaly(anomaly)}
                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      isFocused
                        ? isLight
                          ? "bg-sky-50 ring-1 ring-sky-200"
                          : "bg-sky-500/10 ring-1 ring-sky-500/30"
                        : isLight
                          ? "hover:bg-zinc-50"
                          : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: meta.color }}
                    >
                      {anomaly.title}
                    </p>
                    <p className={`mt-0.5 truncate text-[10px] ${muted(isLight)}`}>
                      {anomaly.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </ThemedPanel>

      {/* Carte + liste */}
      <div className="space-y-4">
        {/* Bandeau contexte */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${panel(isLight)}`}
        >
          <div>
            <p className={`text-sm font-semibold ${heading(isLight)}`}>
              {isDepartmentZoomed
                ? departments.find((d) => d.code === mapFocusDepartment)?.name ?? "Département"
                : "Vue France"}
            </p>
            <p className={`text-xs ${muted(isLight)}`}>
              {isDepartmentZoomed
                ? `${focusedDistributors.length} distributeur${focusedDistributors.length > 1 ? "s" : ""} sur la carte`
                : "Cliquez Voir sur un département pour zoomer"}
            </p>
          </div>
          {isDepartmentZoomed && (
            <button
              type="button"
              onClick={handleViewFrance}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${btnSecondary(isLight)}`}
            >
              ← Retour France
            </button>
          )}
        </div>

        <div
          className={`overflow-hidden rounded-2xl border ${panel(isLight)}`}
          style={{ height: 460 }}
        >
          <MapContainer
            center={[FRANCE_MAP_CENTER.lat, FRANCE_MAP_CENTER.lng]}
            zoom={FRANCE_MAP_ZOOM}
            className="h-full w-full z-0"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFlyController
              bounds={flyBounds}
              zoom={flyZoom}
              flyToken={flyToken}
              point={flyPoint}
            />
            <AnomalyRadarOverlay
              anomalies={anomalies}
              focusedAnomalyId={focusedAnomalyId}
              onFocusAnomaly={handleFocusAnomaly}
              isLight={isLight}
            />

            {/* Marqueurs départements (vue France uniquement) */}
            {!isDepartmentZoomed &&
              departments.map((department) => (
                <Marker
                  key={`dept-${department.code}`}
                  position={[department.centerLat, department.centerLng]}
                  icon={createDepartmentMapIcon(
                    department.code,
                    department.distributorCount,
                    isLight,
                  )}
                  eventHandlers={{
                    click: () => handleViewDepartment(department.code),
                  }}
                >
                  <Popup>
                    <div className="space-y-2 text-sm text-zinc-900">
                      <p className="font-bold">{formatDepartmentLabel(department)}</p>
                      <p className="text-xs">
                        {department.distributorCount} distributeur
                        {department.distributorCount > 1 ? "s" : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleViewDepartment(department.code)}
                        className="rounded-md bg-zinc-900 px-2 py-1 text-xs text-white"
                      >
                        Voir sur la carte
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Marqueurs distributeurs (vue zoomée département) */}
            {isDepartmentZoomed &&
              focusedDistributors.map((distributor) => {
                const stats = computeDistributorStats(distributor, reservations);
                const fillColor =
                  stats.occupiedBoxes > 0
                    ? stats.occupiedBoxes === stats.totalBoxes
                      ? "#ef4444"
                      : "#f97316"
                    : "#10b981";

                return (
                  <Marker
                    key={distributor.id}
                    position={[distributor.latitude, distributor.longitude]}
                    icon={createDistributorMapIcon(fillColor)}
                  >
                    <Popup minWidth={260}>
                      <div className="space-y-2 text-sm text-zinc-900">
                        <p className="font-bold">
                          {distributor.cityName} — {distributor.name}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {distributor.departmentCode} {distributor.departmentName}
                        </p>
                        <p className="flex items-start gap-1.5 text-xs">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {distributor.address}
                        </p>
                        <p className="text-xs font-medium">
                          Casier · {stats.occupiedBoxes}/{stats.totalBoxes} occupés
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href={getGoogleMapsUrl(distributor)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-xs text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Google Maps
                          </a>
                          {onSelectDistributor && (
                            <button
                              type="button"
                              onClick={() => onSelectDistributor(distributor.id)}
                              className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                            >
                              Voir les casiers
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>

        {/* Liste adresses */}
        <ThemedPanel isLight={isLight} className="overflow-hidden">
          <div className={`border-b px-4 py-3 ${isLight ? "border-zinc-200" : "border-white/[0.06]"}`}>
            <h3 className={`text-sm font-bold ${heading(isLight)}`}>
              Emplacements
              {selectedDepartment !== ALL_DEPARTMENTS_ID && (
                <span className={`ml-2 font-normal ${muted(isLight)}`}>
                  — {departments.find((d) => d.code === selectedDepartment)?.name}
                </span>
              )}
            </h3>
          </div>
          <div className="max-h-52 divide-y overflow-y-auto">
            {listDistributors.length === 0 ? (
              <p className={`px-4 py-8 text-center text-sm ${muted(isLight)}`}>
                Aucun distributeur géolocalisé
              </p>
            ) : (
              listDistributors.map((distributor) => {
                const stats = computeDistributorStats(distributor, reservations);
                const onMap = mapFocusDepartment === distributor.departmentCode;

                return (
                  <div
                    key={distributor.id}
                    className={`flex items-start justify-between gap-3 px-4 py-3 ${
                      onMap && isDepartmentZoomed
                        ? isLight
                          ? "bg-sky-50/80"
                          : "bg-sky-500/[0.08]"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${heading(isLight)}`}>
                        {distributor.cityName} — {distributor.name}
                      </p>
                      <p className={`mt-0.5 text-xs ${muted(isLight)}`}>{distributor.address}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          stats.occupiedBoxes > 0
                            ? isLight
                              ? "bg-orange-100 text-orange-700"
                              : "bg-orange-500/15 text-orange-400"
                            : isLight
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {stats.occupiedBoxes}/{stats.totalBoxes}
                      </span>
                      {mapFocusDepartment !== distributor.departmentCode && (
                        <button
                          type="button"
                          onClick={() => handleViewDepartment(distributor.departmentCode)}
                          className={`text-[10px] font-semibold underline ${muted(isLight)}`}
                        >
                          Voir sur carte
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ThemedPanel>
      </div>
    </div>
  );
}
