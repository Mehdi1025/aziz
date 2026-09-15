"use client";

import { motion } from "framer-motion";
import {
  Box,
  CalendarRange,
  Clock,
  Hash,
  MapPin,
  Users,
} from "lucide-react";
import {
  GUEST_STATUS_META,
  getGuestReservationStatus,
  type LandlordGuestReservationRow,
} from "@/lib/landlord-guest-types";
import { heading, muted, panel, subheading } from "@/lib/admin-theme";

type GuestReservationsTableProps = {
  reservations: LandlordGuestReservationRow[];
  isLight: boolean;
};

function formatStayDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function countByStatus(reservations: LandlordGuestReservationRow[]) {
  const counts = { active: 0, upcoming: 0, used: 0, expired: 0 };
  for (const row of reservations) {
    counts[getGuestReservationStatus(row)] += 1;
  }
  return counts;
}

function GuestCard({
  reservation,
  isLight,
  index,
}: {
  reservation: LandlordGuestReservationRow;
  isLight: boolean;
  index: number;
}) {
  const status = getGuestReservationStatus(reservation);
  const meta = GUEST_STATUS_META[status];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`overflow-hidden rounded-2xl backdrop-blur-xl ${panel(isLight, "hover:shadow-lg")}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Casier — bloc visuel fort */}
        <div
          className={`flex shrink-0 flex-col items-center justify-center px-6 py-6 sm:w-36 sm:border-r ${
            isLight
              ? "border-zinc-100 bg-linear-to-br from-violet-50 to-zinc-50"
              : "border-white/[0.06] bg-linear-to-br from-violet-500/10 to-white/[0.02]"
          }`}
        >
          <Box
            className={`mb-2 h-5 w-5 ${isLight ? "text-violet-500" : "text-violet-400"}`}
          />
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
            Casier
          </p>
          <p
            className={`mt-1 text-5xl font-black tabular-nums tracking-tight ${heading(isLight)}`}
          >
            {reservation.boxNumber}
          </p>
          <p className={`mt-2 text-center text-xs leading-snug ${muted(isLight)}`}>
            {reservation.cityName}
            <br />
            <span className={`font-semibold ${subheading(isLight)}`}>
              {reservation.distributorName}
            </span>
          </p>
        </div>

        {/* Détails voyageur */}
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`truncate text-lg font-black tracking-tight ${heading(isLight)}`}>
                {reservation.guestName ?? "Voyageur"}
              </h3>
              <p className={`mt-0.5 flex items-center gap-1.5 font-mono text-[11px] ${muted(isLight)}`}>
                <Hash className="h-3 w-3 shrink-0 opacity-60" />
                {reservation.code}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{
                color: meta.color,
                backgroundColor: `${meta.color}18`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              {meta.label}
            </span>
          </div>

          {reservation.propertyLabel && (
            <div
              className={`mb-4 rounded-xl px-3.5 py-3 ${
                isLight ? "bg-zinc-50" : "bg-white/[0.04]"
              }`}
            >
              <p className={`text-sm font-semibold ${heading(isLight)}`}>
                {reservation.propertyLabel}
              </p>
              {reservation.propertyAddress && (
                <p className={`mt-1 flex items-start gap-1.5 text-xs leading-relaxed ${muted(isLight)}`}>
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
                  {reservation.propertyAddress}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={`rounded-xl px-3.5 py-3 ${
                isLight ? "bg-zinc-50" : "bg-white/[0.04]"
              }`}
            >
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                <CalendarRange className="h-3.5 w-3.5" />
                Séjour
              </p>
              <p className={`mt-1.5 text-sm font-medium ${subheading(isLight)}`}>
                {formatStayDate(reservation.checkIn)}
              </p>
              <p className={`text-xs ${muted(isLight)}`}>→ {formatStayDate(reservation.checkOut)}</p>
            </div>

            <div
              className={`rounded-xl px-3.5 py-3 ${
                isLight ? "bg-zinc-50" : "bg-white/[0.04]"
              }`}
            >
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                <Users className="h-3.5 w-3.5" />
                Invités
              </p>
              <p className={`mt-1.5 text-2xl font-black tabular-nums ${heading(isLight)}`}>
                {reservation.guestsCount ?? "—"}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-[11px] ${
              isLight ? "border-zinc-100" : "border-white/[0.06]"
            } ${muted(isLight)}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 opacity-60" />
              Capturé le {formatDateTime(reservation.createdAt)}
            </span>
            {reservation.scannedAt && (
              <span className="inline-flex items-center gap-1.5">
                QR scanné le {formatDateTime(reservation.scannedAt)}
              </span>
            )}
            <span className="font-mono opacity-70">{reservation.distributorSlug}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function GuestReservationsTable({
  reservations,
  isLight,
}: GuestReservationsTableProps) {
  const statusCounts = countByStatus(reservations);

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
        <h2 className={`mt-1 text-xl font-black tracking-tight sm:text-2xl ${heading(isLight)}`}>
          Réservations Airbnb
        </h2>
        <p className={`mt-1 text-sm ${muted(isLight)}`}>
          Casier, logement et détails du séjour pour chaque voyageur.
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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["active", "En cours"],
                ["upcoming", "À venir"],
                ["used", "Utilisés"],
                ["expired", "Expirés"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className={`rounded-xl px-4 py-3 text-center ${panel(isLight)}`}
              >
                <p
                  className="text-2xl font-black tabular-nums"
                  style={{ color: GUEST_STATUS_META[key].color }}
                >
                  {statusCounts[key]}
                </p>
                <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {reservations.map((reservation, index) => (
              <GuestCard
                key={reservation.id}
                reservation={reservation}
                isLight={isLight}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
