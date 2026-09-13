"use client";

import {
  formatDateTime,
  getBadgeLabel,
  getReservationBadge,
  getReservationPassUrl,
  maskCode,
  type ReservationRow,
} from "@/lib/admin-utils";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { ReservationActions } from "@/app/admin/_components/reservation-actions";
import { StatusBadge } from "@/app/admin/_components/status-badge";
import { heading, muted, tableHead, tableRow } from "@/lib/admin-theme";
import { Inbox } from "lucide-react";

type ReservationsTableProps = {
  reservations: ReservationRow[];
  isLight?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
  onDeleted?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ReservationsTable({
  reservations,
  isLight = false,
  showCopy = true,
  showDelete = true,
  onDeleted,
  emptyTitle = "Aucune réservation",
  emptyDescription = "Les réservations apparaîtront ici.",
}: ReservationsTableProps) {
  if (reservations.length === 0) {
    return (
      <ThemedPanel isLight={isLight} className="px-6 py-16 text-center">
        <Inbox className={`mx-auto h-10 w-10 ${muted(isLight)}`} />
        <p className={`mt-4 text-sm font-semibold ${heading(isLight)}`}>
          {emptyTitle}
        </p>
        <p className={`mt-1.5 text-sm ${muted(isLight)}`}>
          {emptyDescription}
        </p>
      </ThemedPanel>
    );
  }

  return (
    <ThemedPanel isLight={isLight} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={`border-b ${tableHead(isLight)}`}>
              {["Ville", "Distributeur", "Code", "Box", "Valide du", "Valide au", "Statut", "Badges", "Actions"].map(
                (label) => (
                  <th
                    key={label}
                    className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.18em]"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const badge = getReservationBadge(reservation);
              const badgeLabel = getBadgeLabel(badge);

              return (
                <tr
                  key={reservation.id}
                  className={`border-b last:border-0 transition-colors ${tableRow(isLight)}`}
                >
                  <td className={`px-5 py-3.5 text-sm font-medium ${isLight ? "text-zinc-800" : "text-neutral-200"}`}>
                    {reservation.cityName}
                  </td>
                  <td className={`px-5 py-3.5 text-sm ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                    {reservation.distributorName}
                  </td>
                  <td className={`px-5 py-3.5 font-mono text-sm font-medium ${isLight ? "text-zinc-800" : "text-neutral-200"}`}>
                    {maskCode(reservation.code)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${isLight ? "bg-zinc-100 text-zinc-900" : "bg-white/10 text-white"}`}>
                      {reservation.boxNumber}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm tabular-nums ${muted(isLight)}`}>
                    {formatDateTime(reservation.validFrom)}
                  </td>
                  <td className={`px-5 py-3.5 text-sm tabular-nums ${muted(isLight)}`}>
                    {formatDateTime(reservation.validTo)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge isUsed={reservation.isUsed} isLight={isLight} />
                  </td>
                  <td className="px-5 py-3.5">
                    {badgeLabel ? (
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/15 text-amber-400"}`}>
                        {badgeLabel}
                      </span>
                    ) : (
                      <span className={`text-xs ${muted(isLight)}`}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <ReservationActions
                      passUrl={getReservationPassUrl(reservation)}
                      reservationId={reservation.id}
                      showCopy={showCopy}
                      showDelete={showDelete}
                      onDeleted={onDeleted}
                      isLight={isLight}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ThemedPanel>
  );
}
