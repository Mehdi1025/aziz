/** Les 8 paramètres du lien pass hôte → voyageur. */
export type ReservationCaptureData = {
  code: string;
  in: string;
  out: string;
  box: string;
  site?: string;
  name?: string;
  guests?: string;
  keyId?: string;
};

export type ParsedPassParams =
  | {
      ok: true;
      data: ReservationCaptureData;
      boxNumber: number;
    }
  | { ok: false; error: string };
