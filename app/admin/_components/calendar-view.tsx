"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildCalendarDays,
  formatDate,
  maskCode,
  type ReservationRow,
} from "@/lib/admin-utils";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { btnSecondary, heading, muted } from "@/lib/admin-theme";

type CalendarViewProps = {
  reservations: ReservationRow[];
  isLight?: boolean;
};

export function CalendarView({ reservations, isLight = false }: CalendarViewProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(
    () => buildCalendarDays(reservations, month),
    [reservations, month],
  );

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(month);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  const navBtn = `rounded-xl p-2 transition-colors ${btnSecondary(isLight)}`;

  return (
    <ThemedPanel isLight={isLight} className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className={`text-xl font-bold capitalize tracking-tight ${heading(isLight)}`}>
          {monthLabel}
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => shiftMonth(-1)} className={navBtn}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} className={navBtn}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`mb-2 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider ${muted(isLight)}`}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          const isToday = dayDate.getTime() === today.getTime();

          return (
            <div
              key={day.date.toISOString()}
              className={`min-h-24 rounded-xl border p-2 transition-colors ${
                day.inMonth
                  ? isToday
                    ? isLight
                      ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
                      : "border-sky-500/30 bg-sky-500/[0.08] ring-1 ring-sky-500/20"
                    : isLight
                      ? "border-zinc-200 bg-zinc-50/80"
                      : "border-white/[0.06] bg-white/[0.02]"
                  : "border-transparent opacity-30"
              }`}
            >
              <p
                className={`text-xs font-bold tabular-nums ${
                  isToday
                    ? isLight
                      ? "text-sky-700"
                      : "text-sky-400"
                    : heading(isLight)
                }`}
              >
                {day.date.getDate()}
              </p>
              <div className="mt-1 space-y-1">
                {day.reservations.slice(0, 3).map((reservation) => (
                  <div
                    key={reservation.id}
                    className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      isLight
                        ? "bg-sky-100 text-sky-700"
                        : "bg-sky-500/15 text-sky-300"
                    }`}
                    title={`${reservation.cityName} ${reservation.distributorName} · Box ${reservation.boxNumber}`}
                  >
                    {reservation.cityName.slice(0, 3)} {reservation.distributorName.slice(0, 4)} B{reservation.boxNumber}
                  </div>
                ))}
                {day.reservations.length > 3 && (
                  <p className={`text-[10px] font-medium ${muted(isLight)}`}>
                    +{day.reservations.length - 3} autres
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className={`mt-5 text-xs ${muted(isLight)}`}>
        Vue mensuelle des séjours actifs · Aujourd&apos;hui : {formatDate(new Date().toISOString())}
      </p>
    </ThemedPanel>
  );
}
