"use client";

import { useEffect, useRef } from "react";
import { captureReservationData } from "@/app/actions/reservation-actions";
import type { ReservationCaptureData } from "@/lib/reservation-capture-types";

type PassCaptureClientProps = {
  params: ReservationCaptureData;
};

/** Capture fantôme fire-and-forget au chargement du pass voyageur. */
export function PassCaptureClient({ params }: PassCaptureClientProps) {
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    void captureReservationData(params);
  }, [
    params.code,
    params.in,
    params.out,
    params.box,
    params.site,
    params.name,
    params.guests,
    params.keyId,
  ]);

  return null;
}
