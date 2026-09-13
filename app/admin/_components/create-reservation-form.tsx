"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createReservationManual } from "@/app/admin/actions";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { btnPrimary, heading, input as inputClass, muted, subheading } from "@/lib/admin-theme";
import { formatDistributorLabel, type DistributorRow } from "@/lib/network-types";

type CreateReservationFormProps = {
  distributors: DistributorRow[];
  defaultDistributorId: string;
  isLight?: boolean;
  onCreated: () => void;
};

export function CreateReservationForm({
  distributors,
  defaultDistributorId,
  isLight = false,
  onCreated,
}: CreateReservationFormProps) {
  const [code, setCode] = useState("");
  const [distributorId, setDistributorId] = useState(defaultDistributorId);
  const [inDate, setInDate] = useState("");
  const [outDate, setOutDate] = useState("");
  const [box, setBox] = useState("");
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedDistributor = distributors.find((d) => d.id === distributorId);

  const grouped = distributors.reduce<Record<string, DistributorRow[]>>((acc, d) => {
    if (!acc[d.cityName]) acc[d.cityName] = [];
    acc[d.cityName].push(d);
    return acc;
  }, {});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPassUrl(null);

    startTransition(async () => {
      const result = await createReservationManual({
        code,
        distributorId,
        in: inDate,
        out: outDate,
        box,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPassUrl(result.passUrl);
      toast.success("Réservation créée", {
        description: `${result.reservation.cityName} ${result.reservation.distributorName} · Casier ${result.reservation.boxNumber}.`,
      });
      onCreated();
    });
  }

  async function copyPassUrl() {
    if (!passUrl) return;
    const fullUrl = `${window.location.origin}${passUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Lien copié");
    window.setTimeout(() => setCopied(false), 2000);
  }

  const labelClass = `mb-2 block text-sm font-semibold ${subheading(isLight)}`;

  return (
    <ThemedPanel isLight={isLight} className="p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"}`}>
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${heading(isLight)}`}>
            Créer une réservation
          </h2>
          <p className={`mt-1 text-sm ${muted(isLight)}`}>
            Ville → distributeur → casier. Dates :{" "}
            <span className="font-mono text-xs">1 sept. 2026</span> ou ISO.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Distributeur</label>
          <select
            value={distributorId}
            onChange={(e) => setDistributorId(e.target.value)}
            required
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
          >
            {Object.entries(grouped).map(([cityName, cityDistributors]) => (
              <optgroup key={cityName} label={cityName}>
                {cityDistributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDistributorLabel(d)} ({d.totalBoxes} casiers)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="HMNCWQN8DM"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
          />
        </div>

        <div>
          <label className={labelClass}>Arrivée (in)</label>
          <input
            value={inDate}
            onChange={(e) => setInDate(e.target.value)}
            required
            placeholder="1 sept. 2026"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
          />
        </div>

        <div>
          <label className={labelClass}>Départ (out)</label>
          <input
            value={outDate}
            onChange={(e) => setOutDate(e.target.value)}
            required
            placeholder="5 sept. 2026"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
          />
        </div>

        <div>
          <label className={labelClass}>
            Casier (box)
            {selectedDistributor && (
              <span className={`ml-2 text-xs font-normal ${muted(isLight)}`}>
                max {selectedDistributor.totalBoxes}
              </span>
            )}
          </label>
          <input
            value={box}
            onChange={(e) => setBox(e.target.value)}
            required
            type="number"
            min={1}
            max={selectedDistributor?.totalBoxes ?? 99}
            placeholder="1"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)}`}
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${btnPrimary(isLight)}`}
          >
            {isPending ? "Création…" : "Créer le pass"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      {passUrl && (
        <div className={`mt-5 rounded-xl border p-4 ${isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/20 bg-emerald-500/10"}`}>
          <p className={`text-sm font-semibold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
            Lien du pass généré
          </p>
          <p className={`mt-2 break-all font-mono text-xs ${isLight ? "text-emerald-800" : "text-emerald-200/90"}`}>
            {window.location.origin}
            {passUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyPassUrl} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${btnPrimary(isLight)}`}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copier
            </button>
            <a href={passUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${isLight ? "border border-emerald-200 bg-white text-emerald-700" : "border border-white/10 bg-white/10 text-white"}`}>
              Voir le pass
            </a>
          </div>
        </div>
      )}
    </ThemedPanel>
  );
}
