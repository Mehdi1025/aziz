"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, heading, input as inputClass, muted, subheading } from "@/lib/admin-theme";

type AddKeyModalProps = {
  open: boolean;
  isLight: boolean;
  canAddKey: boolean;
  onClose: () => void;
  onSubmit: (data: { propertyLabel: string; propertyAddress: string }) => void;
};

export function AddKeyModal({
  open,
  isLight,
  canAddKey,
  onClose,
  onSubmit,
}: AddKeyModalProps) {
  const [propertyLabel, setPropertyLabel] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setPropertyLabel("");
      setPropertyAddress("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isValid = propertyLabel.trim().length >= 2 && canAddKey;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      propertyLabel: propertyLabel.trim(),
      propertyAddress: propertyAddress.trim(),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-key-title"
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl sm:p-8 ${
                isLight
                  ? "border-zinc-200 bg-white"
                  : "border-white/10 bg-zinc-900/95 backdrop-blur-xl"
              }`}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
                    Nouveau logement
                  </p>
                  <h2 id="add-key-title" className={`mt-1 text-xl font-black ${heading(isLight)}`}>
                    Ajouter une clé
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-xl p-2 transition-colors ${btnSecondary(isLight)}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!canAddKey && (
                <div
                  className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                    isLight
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-orange-500/30 bg-orange-500/10 text-orange-300"
                  }`}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    Quota atteint — impossible d&apos;ajouter une nouvelle clé.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="property-label" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                    Nom du logement
                  </label>
                  <input
                    id="property-label"
                    type="text"
                    value={propertyLabel}
                    onChange={(e) => setPropertyLabel(e.target.value)}
                    placeholder="Ex. Appartement Marais"
                    disabled={!canAddKey}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)} disabled:opacity-50`}
                  />
                </div>

                <div>
                  <label htmlFor="property-address" className={`mb-1.5 block text-xs font-semibold ${subheading(isLight)}`}>
                    Adresse
                  </label>
                  <input
                    id="property-address"
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="Ex. 12 Rue des Rosiers, 75004 Paris"
                    disabled={!canAddKey}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${inputClass(isLight)} disabled:opacity-50`}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${btnSecondary(isLight)}`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${btnPrimary(isLight)}`}
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
