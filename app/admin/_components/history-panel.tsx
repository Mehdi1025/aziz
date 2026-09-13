"use client";

import { useMemo } from "react";
import {
  getExpiredReservations,
  sortReservations,
  type ReservationRow,
} from "@/lib/admin-utils";
import { ReservationsTable } from "@/app/admin/_components/reservations-table";
import { SectionHeader } from "@/app/admin/_components/section-header";

type HistoryPanelProps = {
  reservations: ReservationRow[];
  isLight?: boolean;
};

export function HistoryPanel({ reservations, isLight = false }: HistoryPanelProps) {
  const expiredReservations = useMemo(
    () => sortReservations(getExpiredReservations(reservations), "departure").reverse(),
    [reservations],
  );

  return (
    <section>
      <SectionHeader
        title="Historique des séjours expirés"
        description={`${expiredReservations.length} réservation${expiredReservations.length > 1 ? "s" : ""} passée${expiredReservations.length > 1 ? "s" : ""} · lecture seule`}
        isLight={isLight}
      />

      <ReservationsTable
        reservations={expiredReservations}
        isLight={isLight}
        showCopy
        showDelete={false}
        emptyTitle="Aucun historique"
        emptyDescription="Les séjours expirés apparaîtront ici automatiquement."
      />
    </section>
  );
}
