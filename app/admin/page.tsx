"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getActivityLogs,
  getCities,
  getDistributors,
  getReservations,
} from "@/app/admin/actions";
import { getLandlords, getSubscriptionPlans } from "@/app/admin/landlord-actions";
import { ActivityLogPanel } from "@/app/admin/_components/activity-log-panel";
import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";
import type { AdminTab } from "@/app/admin/_components/admin-tabs";
import { BentoBoxGrid } from "@/app/admin/_components/bento-box-grid";
import { CalendarView } from "@/app/admin/_components/calendar-view";
import { ControlTowerPanel } from "@/app/admin/_components/control-tower-panel";
import { CreateReservationForm } from "@/app/admin/_components/create-reservation-form";
import { LandlordsPanel } from "@/app/admin/_components/landlords-panel";
import {
  DashboardBackground,
  DashboardSkeleton,
} from "@/app/admin/_components/dashboard-shell";
import { DashboardHeader } from "@/app/admin/_components/dashboard-header";
import { HistoryPanel } from "@/app/admin/_components/history-panel";
import { KpiStrip } from "@/app/admin/_components/kpi-strip";
import { LiveGridPanel } from "@/app/admin/_components/live-grid-panel";
import { NetworkMapPanel } from "@/app/admin/_components/network-map-panel";
import { NetworkPicker } from "@/app/admin/_components/network-picker";
import { ReservationsPanel } from "@/app/admin/_components/reservations-panel";
import { SectionHeader } from "@/app/admin/_components/section-header";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import { ADMIN_POLL_INTERVAL_MS } from "@/lib/admin-config";
import { shell } from "@/lib/admin-theme";
import {
  computeKpis,
  filterReservationsByNetwork,
  maskCode,
  type ReservationRow,
} from "@/lib/admin-utils";
import {
  ALL_CITIES_ID,
  ALL_DISTRIBUTORS_ID,
  type CityRow,
  type DistributorRow,
} from "@/lib/network-types";
import type { LandlordRow, SubscriptionPlanRow } from "@/lib/subscription-types";

const tabLabels: Record<AdminTab, string> = {
  overview: "Vue d'ensemble",
  livegrid: "Casiers Live Grid",
  map: "Carte du réseau",
  reservations: "Réservations",
  history: "Historique",
  calendar: "Calendrier",
  create: "Créer une réservation",
  journal: "Journal d'activité",
  loueurs: "Loueurs & abonnements",
  controltower: "Control Tower",
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [distributors, setDistributors] = useState<DistributorRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRow[]>([]);
  const [landlords, setLandlords] = useState<LandlordRow[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedCityId, setSelectedCityId] = useState(ALL_CITIES_ID);
  const [selectedDistributorId, setSelectedDistributorId] = useState(ALL_DISTRIBUTORS_ID);
  const [isLight, setIsLight] = useState(false);
  const previousReservationsRef = useRef<ReservationRow[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-theme");
    if (stored === "light") setIsLight(true);
  }, []);

  const refreshData = useCallback(async (showScanToasts = false) => {
    const [
      reservationsResult,
      logsResult,
      citiesResult,
      distributorsResult,
      landlordsResult,
      plansResult,
    ] = await Promise.allSettled([
      getReservations(),
      getActivityLogs(),
      getCities(),
      getDistributors(),
      getLandlords(),
      getSubscriptionPlans(),
    ]);

    if (reservationsResult.status === "rejected") {
      toast.error("Impossible de charger les réservations");
      setIsLoading(false);
      return;
    }

    const reservationData = reservationsResult.value;
    if (citiesResult.status === "fulfilled") setCities(citiesResult.value);
    if (distributorsResult.status === "fulfilled") setDistributors(distributorsResult.value);
    if (landlordsResult.status === "fulfilled") {
      setLandlords(landlordsResult.value);
    } else {
      toast.error("Loueurs indisponibles — rechargez la page");
      setLandlords([]);
    }
    if (plansResult.status === "fulfilled") {
      setSubscriptionPlans(plansResult.value);
    } else {
      setSubscriptionPlans([]);
    }

    if (logsResult.status === "rejected") {
      toast.error("Journal d'activité indisponible");
      setActivityLogs([]);
    } else {
      setActivityLogs(logsResult.value);
    }

    if (showScanToasts) {
      for (const reservation of reservationData) {
        const previous = previousReservationsRef.current.find((item) => item.id === reservation.id);
        if (previous && !previous.isUsed && reservation.isUsed && reservation.scannedAt) {
          toast.success(`Casier ${reservation.boxNumber} ouvert`, {
            description: `${reservation.cityName} ${reservation.distributorName} · ${maskCode(reservation.code)}`,
          });
        }
      }
    }

    previousReservationsRef.current = reservationData;
    setReservations(reservationData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData(false);
    const interval = window.setInterval(() => refreshData(true), ADMIN_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refreshData]);

  function handleDeleted(id: string) {
    setReservations((current) => current.filter((item) => item.id !== id));
    refreshData(false);
  }

  function toggleTheme() {
    setIsLight((current) => {
      const next = !current;
      window.localStorage.setItem("admin-theme", next ? "light" : "dark");
      return next;
    });
  }

  function handleSelectCity(cityId: string) {
    setSelectedCityId(cityId);
    setSelectedDistributorId(ALL_DISTRIBUTORS_ID);
  }

  function handleSelectDistributor(distributorId: string) {
    const distributor = distributors.find((d) => d.id === distributorId);
    if (distributor) setSelectedCityId(distributor.cityId);
    setSelectedDistributorId(distributorId);
  }

  const scopedReservations = useMemo(
    () =>
      filterReservationsByNetwork(
        reservations,
        selectedCityId === ALL_CITIES_ID ? null : selectedCityId,
        selectedDistributorId === ALL_DISTRIBUTORS_ID ? null : selectedDistributorId,
      ),
    [reservations, selectedCityId, selectedDistributorId],
  );

  const scopedLogs = useMemo(() => {
    let logs = activityLogs;
    if (selectedCityId !== ALL_CITIES_ID) {
      logs = logs.filter((log) => {
        const d = distributors.find((dist) => dist.id === log.distributorId);
        return d?.cityId === selectedCityId;
      });
    }
    if (selectedDistributorId !== ALL_DISTRIBUTORS_ID) {
      logs = logs.filter((log) => log.distributorId === selectedDistributorId);
    }
    return logs;
  }, [activityLogs, selectedCityId, selectedDistributorId, distributors]);

  const kpis = computeKpis(
    reservations,
    distributors,
    selectedCityId === ALL_CITIES_ID ? null : selectedCityId,
    selectedDistributorId === ALL_DISTRIBUTORS_ID ? null : selectedDistributorId,
  );

  function handleMapSelectDistributor(distributorId: string) {
    const distributor = distributors.find((d) => d.id === distributorId);
    if (distributor) {
      setSelectedCityId(distributor.cityId);
      setSelectedDistributorId(distributorId);
    }
    setActiveTab("overview");
  }

  const defaultDistributorId =
    selectedDistributorId !== ALL_DISTRIBUTORS_ID
      ? selectedDistributorId
      : selectedCityId !== ALL_CITIES_ID
        ? distributors.find((d) => d.cityId === selectedCityId)?.id ?? distributors[0]?.id ?? ""
        : distributors[0]?.id ?? "";

  if (isLoading) {
    return (
      <div className={`relative h-screen overflow-hidden ${shell(isLight)}`}>
        <DashboardBackground isLight={isLight} />
        <DashboardSkeleton isLight={isLight} />
      </div>
    );
  }

  return (
    <div className={`relative h-screen overflow-hidden ${shell(isLight)}`}>
      <DashboardBackground isLight={isLight} />

      <div className="relative flex h-full min-h-0">
        <AdminSidebar
          active={activeTab}
          onChange={setActiveTab}
          isLight={isLight}
          occupiedCount={kpis.occupiedBoxes}
          totalBoxes={kpis.totalBoxes}
          cityCount={kpis.cityCount}
          distributorCount={kpis.distributorCount}
        />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 lg:pb-8"
        >
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <DashboardHeader
              isLight={isLight}
              onToggleTheme={toggleTheme}
              activeTabLabel={tabLabels[activeTab]}
              locationPicker={
                <NetworkPicker
                  cities={cities}
                  distributors={distributors}
                  selectedCityId={selectedCityId}
                  selectedDistributorId={selectedDistributorId}
                  onCityChange={setSelectedCityId}
                  onDistributorChange={handleSelectDistributor}
                  isLight={isLight}
                />
              }
            />

            {(activeTab === "overview" ||
              activeTab === "map" ||
              activeTab === "reservations" ||
              activeTab === "history" ||
              activeTab === "calendar") && (
              <div className="mb-8">
                <KpiStrip kpis={kpis} isLight={isLight} />
              </div>
            )}

            <div className="space-y-8">
              {activeTab === "overview" && (
                <BentoBoxGrid
                  cities={cities}
                  distributors={distributors}
                  selectedCityId={selectedCityId}
                  selectedDistributorId={selectedDistributorId}
                  onSelectCity={handleSelectCity}
                  onSelectDistributor={handleSelectDistributor}
                  reservations={reservations}
                  activityLogs={activityLogs}
                  isLight={isLight}
                  onUpdated={() => refreshData(false)}
                />
              )}

              {activeTab === "livegrid" && (
                <LiveGridPanel
                  distributors={distributors}
                  reservations={reservations}
                  activityLogs={activityLogs}
                  selectedCityId={selectedCityId}
                  selectedDistributorId={selectedDistributorId}
                  isLight={isLight}
                  onUpdated={() => refreshData(false)}
                />
              )}

              {activeTab === "map" && (
                <section>
                  <SectionHeader
                    title="Carte du réseau"
                    description="Radar des anomalies en direct · cliquez sur un département ou une alerte pour zoomer."
                    isLight={isLight}
                  />
                  <NetworkMapPanel
                    distributors={distributors}
                    reservations={reservations}
                    activityLogs={activityLogs}
                    isLight={isLight}
                    onSelectDistributor={handleMapSelectDistributor}
                  />
                </section>
              )}

              {activeTab === "reservations" && (
                <ReservationsPanel
                  reservations={scopedReservations}
                  isLight={isLight}
                  onDeleted={handleDeleted}
                />
              )}

              {activeTab === "history" && (
                <HistoryPanel reservations={scopedReservations} isLight={isLight} />
              )}

              {activeTab === "calendar" && (
                <CalendarView reservations={scopedReservations} isLight={isLight} />
              )}

              {activeTab === "create" && (
                <CreateReservationForm
                  distributors={distributors}
                  defaultDistributorId={defaultDistributorId}
                  isLight={isLight}
                  onCreated={() => refreshData(false)}
                />
              )}

              {activeTab === "journal" && (
                <section>
                  <SectionHeader
                    title="Journal d'activité"
                    description="Scans, ouvertures à distance, créations et suppressions."
                    isLight={isLight}
                  />
                  <ActivityLogPanel logs={scopedLogs} isLight={isLight} />
                </section>
              )}

              {activeTab === "loueurs" && (
                <LandlordsPanel
                  landlords={landlords}
                  plans={subscriptionPlans}
                  distributors={distributors}
                  isLight={isLight}
                  onUpdated={() => refreshData(false)}
                />
              )}

              {activeTab === "controltower" && (
                <ControlTowerPanel
                  cities={cities}
                  distributors={distributors}
                  reservations={reservations}
                  activityLogs={activityLogs}
                  isLight={isLight}
                />
              )}
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
