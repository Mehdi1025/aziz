"use client";

import { motion } from "framer-motion";
import { Calendar, Users } from "lucide-react";
import {
  GUEST_STATUS_META,
  getGuestReservationStatus,
  type LandlordGuestReservationRow,
} from "@/lib/landlord-guest-types";
import { heading, muted, panel, tableHead, tableRow } from "@/lib/admin-theme";

type GuestReservationsTableProps = {
  reservations: LandlordGuestReservationRow[];
  isLight: boolean;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function GuestReservationsTable({
  reservations,
  isLight,
}: GuestReservationsTableProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
          Voyageurs capturés
        </p>
        <h2 className={`mt-1 text-xl font-black tracking-tight ${heading(isLight)}`}>
          Réservations Airbnb
        </h2>
        <p className={`mt-1 text-sm ${muted(isLight)}`}>
          Données collectées automatiquement lors de la génération du pass QR.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed px-6 py-16 text-center ${panel(isLight)}`}
        >
          <Users className={`mx-auto h-10 w-10 ${muted(isLight)}`} />
          <p className={`mt-4 text-sm font-semibold ${heading(isLight)}`}>
            Aucun voyageur pour l&apos;instant
          </p>
          <p className={`mt-1 text-sm ${muted(isLight)}`}>
            Partagez votre lien d&apos;acquisition Airbnb pour capturer les réservations.
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-2xl backdrop-blur-xl ${panel(isLight)}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className={`border-b ${tableHead(isLight)}`}>
                  <th className="px-4 py-3 font-semibold">Voyageur</th>
                  <th className="px-4 py-3 font-semibold">Logement</th>
                  <th className="px-4 py-3 font-semibold">Arrivée</th>
                  <th className="px-4 py-3 font-semibold">Départ</th>
                  <th className="px-4 py-3 font-semibold">Invités</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => {
                  const status = getGuestReservationStatus(reservation);
                  const meta = GUEST_STATUS_META[status];
                  return (
                    <tr
                      key={reservation.id}
                      className={`border-b last:border-0 ${tableRow(isLight)}`}
                    >
                      <td className="px-4 py-3.5">
                        <p className={`font-semibold ${heading(isLight)}`}>
                          {reservation.guestName ?? "—"}
                        </p>
                        <p className={`mt-0.5 font-mono text-[10px] ${muted(isLight)}`}>
                          {reservation.code}
                        </p>
                      </td>
                      <td className={`px-4 py-3.5 ${muted(isLight)}`}>
                        {reservation.propertyLabel ?? "—"}
                      </td>
                      <td className={`px-4 py-3.5 ${muted(isLight)}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-50" />
                          {formatDate(reservation.checkIn)}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 ${muted(isLight)}`}>
                        {formatDate(reservation.checkOut)}
                      </td>
                      <td className={`px-4 py-3.5 tabular-nums ${muted(isLight)}`}>
                        {reservation.guestsCount ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            color: meta.color,
                            backgroundColor: `${meta.color}18`,
                            border: `1px solid ${meta.color}33`,
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.section>
  );
}
