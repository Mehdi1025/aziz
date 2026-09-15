"use client";

import { useEffect, useRef } from "react";
import { registerGuestFromLink } from "@/app/actions/guest-actions";

export type PassCaptureParams = {
  code: string;
  in: string;
  out: string;
  box: string;
  site?: string;
  name?: string;
  guests?: string;
  keyId?: string;
};

type PassCaptureClientProps = {
  params: PassCaptureParams;
};

/** Capture silencieuse fire-and-forget au chargement du pass voyageur. */
export function PassCaptureClient({ params }: PassCaptureClientProps) {
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;

    void registerGuestFromLink(params).catch(() => {
      /* silent — ne pas perturber l'affichage du QR */
    });
  }, [params]);

  return null;
}
