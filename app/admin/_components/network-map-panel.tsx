"use client";

import dynamic from "next/dynamic";
import type { ActivityLogRow } from "@/lib/activity-log-shared";
import type { ReservationRow } from "@/lib/admin-utils";
import type { DistributorRow } from "@/lib/network-types";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { muted } from "@/lib/admin-theme";

const NetworkMapInner = dynamic(() => import("@/app/admin/_components/network-map-inner"), {
  ssr: false,
  loading: () => (
    <ThemedPanel className="flex h-[420px] items-center justify-center">
      <p className={`text-sm ${muted(false)}`}>Chargement de la carte…</p>
    </ThemedPanel>
  ),
});

type NetworkMapPanelProps = {
  distributors: DistributorRow[];
  reservations: ReservationRow[];
  activityLogs: ActivityLogRow[];
  isLight?: boolean;
  onSelectDistributor?: (distributorId: string) => void;
};

export function NetworkMapPanel(props: NetworkMapPanelProps) {
  return <NetworkMapInner {...props} />;
}
