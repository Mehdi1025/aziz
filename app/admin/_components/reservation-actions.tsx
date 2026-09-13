"use client";

import { Copy, ExternalLink, Trash2, Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteReservation } from "@/app/admin/actions";
import { btnSecondary } from "@/lib/admin-theme";

type ReservationActionsProps = {
  passUrl: string;
  reservationId: string;
  showCopy?: boolean;
  showDelete?: boolean;
  onDeleted?: (id: string) => void;
  isLight?: boolean;
};

export function ReservationActions({
  passUrl,
  reservationId,
  showCopy = true,
  showDelete = true,
  onDeleted,
  isLight = false,
}: ReservationActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function copyLink() {
    const fullUrl = `${window.location.origin}${passUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Lien du pass copié");
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    if (!window.confirm("Supprimer cette réservation ?")) return;

    startTransition(async () => {
      try {
        await deleteReservation(reservationId);
        onDeleted?.(reservationId);
        toast.success("Réservation supprimée");
      } catch {
        toast.error("Échec de la suppression");
      }
    });
  }

  const btnClass = `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${btnSecondary(isLight)}`;

  return (
    <div className="flex flex-wrap gap-1.5">
      {showCopy && (
        <button type="button" onClick={copyLink} className={btnClass}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copier
        </button>
      )}
      <a href={passUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <ExternalLink className="h-3.5 w-3.5" />
        Pass
      </a>
      {showDelete && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Suppr.
        </button>
      )}
    </div>
  );
}
