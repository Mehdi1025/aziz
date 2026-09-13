"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Building2, ChevronRight, WifiOff } from "lucide-react";
import type { CityRow, DistributorRow } from "@/lib/network-types";
import {
  isAllCitiesFilter,
  isAllDistributorsFilter,
} from "@/lib/network-types";
import {
  ALL_CITIES_ID,
  ALL_DISTRIBUTORS_ID,
} from "@/lib/network-types";
import {
  computeDistributorStats,
  filterReservationsByNetwork,
  getBoxNumbersForDistributor,
  isBoxOccupied,
  type ReservationRow,
} from "@/lib/admin-utils";
import { BoxCard } from "@/app/admin/_components/box-card";
import { NetworkOverview } from "@/app/admin/_components/network-overview";
import { OverviewBreadcrumb } from "@/app/admin/_components/overview-breadcrumb";
import { OverviewHero } from "@/app/admin/_components/overview-hero";
import { SectionHeader } from "@/app/admin/_components/section-header";
import { ActivityLogPanel } from "@/app/admin/_components/activity-log-panel";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import { formatDistributorLabel } from "@/lib/network-types";
import { heading, muted } from "@/lib/admin-theme";
import { computeNetworkSnapshot, getOccupancyColors } from "@/lib/overview-utils";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";

type BentoBoxGridProps = {
  cities: CityRow[];
  distributors: DistributorRow[];
  selectedCityId: string;
  selectedDistributorId: string;
  onSelectCity: (cityId: string) => void;
  onSelectDistributor: (distributorId: string) => void;
  reservations: ReservationRow[];
  activityLogs?: ActivityLogRow[];
  isLight?: boolean;
  onUpdated?: () => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

function ActivitySidebar({
  logs,
  title,
  description,
  isLight,
}: {
  logs: ActivityLogRow[];
  title: string;
  description: string;
  isLight: boolean;
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <SectionHeader title={title} description={description} isLight={isLight} />
      <ActivityLogPanel logs={logs.slice(0, 10)} isLight={isLight} compact />
    </aside>
  );
}

export function BentoBoxGrid({
  cities,
  distributors,
  selectedCityId,
  selectedDistributorId,
  onSelectCity,
  onSelectDistributor,
  reservations,
  activityLogs = [],
  isLight = false,
  onUpdated,
}: BentoBoxGridProps) {
  const showAll =
    isAllCitiesFilter(selectedCityId) && isAllDistributorsFilter(selectedDistributorId);

  const scopedReservations = filterReservationsByNetwork(
    reservations,
    showAll ? null : selectedCityId,
    showAll ? null : selectedDistributorId,
  );

  let activeDistributors = distributors;
  if (!isAllCitiesFilter(selectedCityId)) {
    activeDistributors = activeDistributors.filter((d) => d.cityId === selectedCityId);
  }
  if (!isAllDistributorsFilter(selectedDistributorId)) {
    activeDistributors = activeDistributors.filter((d) => d.id === selectedDistributorId);
  }

  const snapshot = computeNetworkSnapshot(activeDistributors, scopedReservations);

  function resetToNational() {
    onSelectCity(ALL_CITIES_ID);
  }

  function resetToCity(cityId: string) {
    onSelectCity(cityId);
    onSelectDistributor(ALL_DISTRIBUTORS_ID);
  }

  if (showAll) {
    return (
      <section className="space-y-6">
        <OverviewHero
          isLight={isLight}
          title="Réseau national"
          subtitle={`${cities.length} villes · ${distributors.length} distributeurs · ${snapshot.totalBoxes} casiers`}
          cityCount={cities.length}
          distributorCount={distributors.length}
          activeDistributorCount={snapshot.activeDistributorCount}
          occupiedBoxes={snapshot.occupiedBoxes}
          totalBoxes={snapshot.totalBoxes}
          percent={snapshot.percent}
          offlineCount={snapshot.offlineCount}
          saturatedSites={snapshot.saturatedSites}
        />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <SectionHeader
              title="Par région"
              description="Regroupement par zone · cliquez pour zoomer sur une ville ou un site"
              isLight={isLight}
            />
            <NetworkOverview
              cities={cities}
              distributors={distributors}
              reservations={reservations}
              isLight={isLight}
              onSelectCity={onSelectCity}
              onSelectDistributor={onSelectDistributor}
            />
          </div>

          <ActivitySidebar
            logs={activityLogs}
            title="Activité récente"
            description="Tous les sites"
            isLight={isLight}
          />
        </div>
      </section>
    );
  }

  if (activeDistributors.length > 1 && isAllDistributorsFilter(selectedDistributorId)) {
    const city = cities.find((c) => c.id === selectedCityId);
    const cityDistributors = activeDistributors;
    const offlineInCity = cityDistributors.filter((d) => !d.isActive).length;

    return (
      <section className="space-y-6">
        <OverviewBreadcrumb
          isLight={isLight}
          crumbs={[
            { label: "Réseau national", onClick: resetToNational },
            { label: city?.name ?? "Ville" },
          ]}
        />

        <OverviewHero
          isLight={isLight}
          title={city?.name ?? "Ville"}
          subtitle={`${city?.region ?? ""} · ${cityDistributors.length} distributeurs`}
          cityCount={1}
          distributorCount={cityDistributors.length}
          activeDistributorCount={cityDistributors.filter((d) => d.isActive).length}
          occupiedBoxes={snapshot.occupiedBoxes}
          totalBoxes={snapshot.totalBoxes}
          percent={snapshot.percent}
          offlineCount={offlineInCity}
          saturatedSites={snapshot.saturatedSites}
        />

        <SectionHeader
          title="Choisir un distributeur"
          description="Sélectionnez un site pour voir la grille des casiers"
          isLight={isLight}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cityDistributors.map((distributor, index) => {
            const stats = computeDistributorStats(distributor, scopedReservations);
            const distPercent =
              stats.totalBoxes > 0
                ? Math.round((stats.occupiedBoxes / stats.totalBoxes) * 100)
                : 0;
            const colors = getOccupancyColors(distPercent, isLight);

            return (
              <motion.button
                key={distributor.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => onSelectDistributor(distributor.id)}
                className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 ${
                  isLight
                    ? "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                } ${!distributor.isActive ? "opacity-75" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`font-bold ${heading(isLight)}`}>{distributor.name}</p>
                    <p className={`mt-1 line-clamp-2 text-xs ${muted(isLight)}`}>
                      {distributor.address ?? distributor.departmentName}
                    </p>
                  </div>
                  {!distributor.isActive ? (
                    <WifiOff className={`h-4 w-4 shrink-0 ${muted(isLight)}`} />
                  ) : (
                    <Building2 className={`h-4 w-4 shrink-0 ${muted(isLight)}`} />
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className={`text-2xl font-black tabular-nums ${colors.text}`}>{distPercent}%</p>
                    <p className={`text-xs ${muted(isLight)}`}>
                      {stats.occupiedBoxes}/{stats.totalBoxes} casiers
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${muted(isLight)}`} />
                </div>

                <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${colors.bar}`}
                    style={{ width: `${distPercent}%` }}
                  />
                </div>

                {distPercent >= 85 && distributor.isActive && (
                  <p className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold ${colors.text}`}>
                    <AlertTriangle className="h-3 w-3" />
                    Saturation
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>
    );
  }

  const distributor = activeDistributors[0];
  if (!distributor) return null;

  const city = cities.find((c) => c.id === distributor.cityId);
  const distributorReservations = scopedReservations.filter(
    (r) => r.distributorId === distributor.id,
  );
  const boxNumbers = getBoxNumbersForDistributor(distributor);
  const distributorOccupied = boxNumbers.filter((boxNumber) =>
    isBoxOccupied(boxNumber, distributor.id, distributorReservations),
  ).length;
  const distPercent =
    boxNumbers.length > 0
      ? Math.round((distributorOccupied / boxNumbers.length) * 100)
      : 0;

  return (
    <section className="space-y-6">
      <OverviewBreadcrumb
        isLight={isLight}
        crumbs={[
          { label: "Réseau national", onClick: resetToNational },
          { label: city?.name ?? "Ville", onClick: city ? () => resetToCity(city.id) : undefined },
          { label: distributor.name },
        ]}
      />

      <ThemedPanel isLight={isLight} className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted(isLight)}`}>
              {formatDistributorLabel(distributor)}
            </p>
            <h3 className={`mt-1 text-xl font-black ${heading(isLight)}`}>{distributor.name}</h3>
            <p className={`mt-1 text-sm ${muted(isLight)}`}>
              {distributor.address ?? distributor.region}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black tabular-nums ${getOccupancyColors(distPercent, isLight).text}`}>
              {distPercent}%
            </p>
            <p className={`text-xs ${muted(isLight)}`}>
              {distributorOccupied} occupé{distributorOccupied > 1 ? "s" : ""} ·{" "}
              {boxNumbers.length - distributorOccupied} libre
              {boxNumbers.length - distributorOccupied > 1 ? "s" : ""}
            </p>
            {!distributor.isActive && (
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isLight ? "bg-zinc-200 text-zinc-700" : "bg-white/10 text-neutral-400"
              }`}>
                <WifiOff className="h-3 w-3" />
                Hors ligne
              </span>
            )}
          </div>
        </div>

        <div className={`px-5 py-3 sm:px-6 ${isLight ? "bg-zinc-50/80" : "bg-white/[0.02]"}`}>
          <div className={`h-2 overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
            <div
              className={`h-full rounded-full bg-linear-to-r ${getOccupancyColors(distPercent, isLight).bar}`}
              style={{ width: `${distPercent}%` }}
            />
          </div>
        </div>
      </ThemedPanel>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <SectionHeader
            title="Grille des casiers"
            description={`${boxNumbers.length} emplacements · clic pour ouvrir à distance`}
            isLight={isLight}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {boxNumbers.map((boxNumber) => (
              <BoxCard
                key={`${distributor.id}-${boxNumber}`}
                boxNumber={boxNumber}
                distributorId={distributor.id}
                reservations={distributorReservations}
                isLight={isLight}
                onUpdated={onUpdated}
                compact={boxNumbers.length > 8}
              />
            ))}
          </motion.div>
        </div>

        <ActivitySidebar
          logs={activityLogs.filter((log) => log.distributorId === distributor.id)}
          title="Activité récente"
          description={distributor.name}
          isLight={isLight}
        />
      </div>
    </section>
  );
}
