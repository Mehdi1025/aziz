"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  exportReservationsCsv,
  filterReservations,
  getFutureReservations,
  sortReservations,
  type ReservationFilter,
  type ReservationRow,
  type ReservationSort,
} from "@/lib/admin-utils";
import { ReservationsTable } from "@/app/admin/_components/reservations-table";
import { SectionHeader } from "@/app/admin/_components/section-header";
import { btnSecondary, input as inputClass } from "@/lib/admin-theme";

type ReservationsPanelProps = {
  reservations: ReservationRow[];
  isLight?: boolean;
  onDeleted: (id: string) => void;
};

export function ReservationsPanel({
  reservations,
  isLight = false,
  onDeleted,
}: ReservationsPanelProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReservationFilter>("all");
  const [sort, setSort] = useState<ReservationSort>("arrival");

  const futureReservations = getFutureReservations(reservations);

  const visibleReservations = useMemo(() => {
    const filtered = filterReservations(futureReservations, filter, query);
    return sortReservations(filtered, sort);
  }, [futureReservations, filter, query, sort]);

  function exportCsv() {
    const csv = exportReservationsCsv(visibleReservations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  }

  return (
    <section className="space-y-5">
      <SectionHeader
        title="Réservations actives & futures"
        description={`${visibleReservations.length} entrée${visibleReservations.length > 1 ? "s" : ""} affichée${visibleReservations.length > 1 ? "s" : ""}`}
        isLight={isLight}
        action={
          <button
            type="button"
            onClick={exportCsv}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${btnSecondary(isLight)}`}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-2">
          <Search className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-zinc-400" : "text-neutral-500"}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher code ou box…"
            className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all ${inputClass(isLight)}`}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ReservationFilter)}
          className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputClass(isLight)}`}
        >
          <option value="all">Tous</option>
          <option value="today">Aujourd&apos;hui</option>
          <option value="week">Cette semaine</option>
          <option value="used">Utilisés</option>
          <option value="pending">En attente</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ReservationSort)}
          className={`rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${inputClass(isLight)}`}
        >
          <option value="arrival">Tri par arrivée</option>
          <option value="departure">Tri par départ</option>
        </select>
      </div>

      <ReservationsTable
        reservations={visibleReservations}
        isLight={isLight}
        onDeleted={onDeleted}
        emptyTitle="Aucune réservation future"
        emptyDescription="Créez un pass via /pass ou l'onglet Créer."
      />
    </section>
  );
}
