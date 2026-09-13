"use client";

import {
  CreditCard,
  KeyRound,
  LockOpen,
  Plus,
  Radio,
  ScanLine,
  Ticket,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { formatDateTime, maskCode } from "@/lib/admin-utils";
import {
  getActivityLabel,
  type ActivityLogRow,
  type ActivityType,
} from "@/lib/activity-log-shared";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { heading, muted, tableHead, tableRow } from "@/lib/admin-theme";

type ActivityLogPanelProps = {
  logs: ActivityLogRow[];
  isLight?: boolean;
  compact?: boolean;
};

const activityIcons: Record<ActivityType, typeof ScanLine> = {
  SCAN: ScanLine,
  SCAN_FAILED: XCircle,
  REMOTE_OPEN: Radio,
  CREATE: Plus,
  DELETE: Trash2,
  MANUAL_CREATE: KeyRound,
  SUBSCRIPTION_CREATED: UserPlus,
  SUBSCRIPTION_UPDATED: CreditCard,
  KEY_REGISTERED: KeyRound,
  KEY_DEPOSITED: LockOpen,
  KEY_PASS_CREATED: Ticket,
};

const activityColors: Record<ActivityType, string> = {
  SCAN: "bg-sky-500/15 text-sky-500",
  SCAN_FAILED: "bg-red-500/15 text-red-500",
  REMOTE_OPEN: "bg-violet-500/15 text-violet-500",
  CREATE: "bg-emerald-500/15 text-emerald-500",
  DELETE: "bg-red-500/15 text-red-500",
  MANUAL_CREATE: "bg-amber-500/15 text-amber-500",
  SUBSCRIPTION_CREATED: "bg-emerald-500/15 text-emerald-500",
  SUBSCRIPTION_UPDATED: "bg-orange-500/15 text-orange-500",
  KEY_REGISTERED: "bg-amber-500/15 text-amber-500",
  KEY_DEPOSITED: "bg-teal-500/15 text-teal-500",
  KEY_PASS_CREATED: "bg-indigo-500/15 text-indigo-500",
};

export function ActivityLogPanel({
  logs,
  isLight = false,
  compact = false,
}: ActivityLogPanelProps) {
  if (logs.length === 0) {
    return (
      <ThemedPanel isLight={isLight} className="px-6 py-12 text-center">
        <LockOpen className={`mx-auto h-8 w-8 ${muted(isLight)}`} />
        <p className={`mt-3 text-sm font-medium ${isLight ? "text-zinc-600" : "text-neutral-400"}`}>
          Aucune activité enregistrée
        </p>
        <p className={`mt-1 text-xs ${muted(isLight)}`}>
          Les scans et ouvertures apparaîtront ici.
        </p>
      </ThemedPanel>
    );
  }

  if (compact) {
    return (
      <ThemedPanel isLight={isLight} className="divide-y overflow-hidden">
        {logs.map((log) => {
          const Icon = activityIcons[log.type] ?? ScanLine;
          const color = activityColors[log.type] ?? "bg-neutral-500/15 text-neutral-500";

          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 px-4 py-3 ${isLight ? "divide-zinc-100" : "divide-white/[0.04]"}`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${heading(isLight)}`}>
                  {getActivityLabel(log.type)}
                </p>
                <p className={`mt-0.5 truncate text-xs ${muted(isLight)}`}>
                  {log.cityName ? `${log.cityName} ${log.distributorName ?? ""} · ` : ""}
                  {log.code ? maskCode(log.code) : "—"}
                  {log.boxNumber ? ` · Casier ${log.boxNumber}` : ""}
                </p>
                <p className={`mt-1 text-[10px] tabular-nums ${muted(isLight)}`}>
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </ThemedPanel>
    );
  }

  return (
    <ThemedPanel isLight={isLight} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={`border-b ${tableHead(isLight)}`}>
              {["Date", "Action", "Ville", "Distributeur", "Code", "Box", "Détails"].map((label) => (
                <th
                  key={label}
                  className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.18em]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const Icon = activityIcons[log.type] ?? ScanLine;
              const color = activityColors[log.type] ?? "bg-neutral-500/15 text-neutral-500";

              return (
                <tr
                  key={log.id}
                  className={`border-b last:border-0 transition-colors ${tableRow(isLight)}`}
                >
                  <td className={`px-5 py-3.5 text-sm tabular-nums ${muted(isLight)}`}>
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className={`text-sm font-medium ${heading(isLight)}`}>
                        {getActivityLabel(log.type)}
                      </span>
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                    {log.cityName ?? "—"}
                  </td>
                  <td className={`px-5 py-3.5 text-sm ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                    {log.distributorName ?? "—"}
                  </td>
                  <td className={`px-5 py-3.5 font-mono text-sm ${isLight ? "text-zinc-700" : "text-neutral-300"}`}>
                    {log.code ? maskCode(log.code) : "—"}
                  </td>
                  <td className={`px-5 py-3.5 text-sm font-semibold tabular-nums ${heading(isLight)}`}>
                    {log.boxNumber ?? "—"}
                  </td>
                  <td className={`px-5 py-3.5 text-sm ${muted(isLight)}`}>
                    {log.details ?? "—"}
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
