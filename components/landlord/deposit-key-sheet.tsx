"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { HostDistributorOption } from "@/components/landlord/mock-landlord-data";
import { btnPrimary, btnSecondary, heading, muted, subheading } from "@/lib/admin-theme";
import type { KeyDepositRow } from "@/lib/subscription-types";

type DepositKeySheetProps = {
  open: boolean;
  keyDeposit: KeyDepositRow | null;
  distributors: HostDistributorOption[];
  isLight: boolean;
  onClose: () => void;
  onConfirm: (data: {
    keyId: string;
    distributorId: string;
    distributorSlug: string;
    distributorName: string;
    cityName: string;
    boxNumber: number;
  }) => void;
};

export function DepositKeySheet({
  open,
  keyDeposit,
  distributors,
  isLight,
  onClose,
  onConfirm,
}: DepositKeySheetProps) {
  const [distributorId, setDistributorId] = useState("");
  const [boxNumber, setBoxNumber] = useState<number | null>(null);

  const selectedDistributor = useMemo(
    () => distributors.find((d) => d.id === distributorId) ?? null,
    [distributors, distributorId],
  );

  useEffect(() => {
    if (!open) {
      setDistributorId("");
      setBoxNumber(null);
    }
  }, [open]);

  useEffect(() => {
    setBoxNumber(null);
  }, [distributorId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canConfirm =
    keyDeposit && selectedDistributor && boxNumber !== null;

  function handleConfirm() {
    if (!canConfirm || !keyDeposit || !selectedDistributor || boxNumber === null) return;
    onConfirm({
      keyId: keyDeposit.id,
      distributorId: selectedDistributor.id,
      distributorSlug: selectedDistributor.slug,
      distributorName: selectedDistributor.name,
      cityName: selectedDistributor.cityName,
      boxNumber,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && keyDeposit && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-2xl ${
              isLight
                ? "border-zinc-200 bg-white"
                : "border-white/10 bg-zinc-950/95 backdrop-blur-xl"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: isLight ? "rgba(228,228,231,0.8)" : "rgba(255,255,255,0.06)" }}
            >
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${muted(isLight)}`}>
                  Dépôt en casier
                </p>
                <h2 className={`mt-1 text-lg font-black ${heading(isLight)}`}>
                  {keyDeposit.propertyLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl p-2 ${btnSecondary(isLight)}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div>
                <p className={`mb-3 text-xs font-semibold ${subheading(isLight)}`}>
                  Choisir un distributeur
                </p>
                <div className="space-y-2">
                  {distributors.map((distributor) => {
                    const selected = distributorId === distributor.id;
                    return (
                      <button
                        key={distributor.id}
                        type="button"
                        onClick={() => setDistributorId(distributor.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? isLight
                              ? "border-violet-300 bg-violet-50 ring-2 ring-violet-200"
                              : "border-violet-500/40 bg-violet-500/10 ring-2 ring-violet-500/20"
                            : isLight
                              ? "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                              : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <p className={`text-sm font-bold ${heading(isLight)}`}>
                          {distributor.cityName} · {distributor.name}
                        </p>
                        <p className={`mt-1 flex items-start gap-1.5 text-xs ${muted(isLight)}`}>
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                          {distributor.address}
                        </p>
                        <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wider ${muted(isLight)}`}>
                          {distributor.availableBoxes.length} casier{distributor.availableBoxes.length > 1 ? "s" : ""} libre{distributor.availableBoxes.length > 1 ? "s" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDistributor && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className={`mb-3 text-xs font-semibold ${subheading(isLight)}`}>
                    Numéro de casier
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDistributor.availableBoxes.map((box) => {
                      const selected = boxNumber === box;
                      return (
                        <button
                          key={box}
                          type="button"
                          onClick={() => setBoxNumber(box)}
                          className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-all ${
                            selected
                              ? isLight
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                              : isLight
                                ? "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <Box className="mb-1 h-4 w-4 opacity-60" />
                          <span className="text-sm font-bold tabular-nums">{box}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            <div
              className="border-t px-6 py-5"
              style={{ borderColor: isLight ? "rgba(228,228,231,0.8)" : "rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${btnPrimary(isLight)}`}
              >
                Confirmer le dépôt
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
