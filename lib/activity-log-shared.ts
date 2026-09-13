export type ActivityType =
  | "SCAN"
  | "SCAN_FAILED"
  | "REMOTE_OPEN"
  | "CREATE"
  | "DELETE"
  | "MANUAL_CREATE"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "KEY_REGISTERED"
  | "KEY_DEPOSITED"
  | "KEY_PASS_CREATED";

export type ActivityLogRow = {
  id: string;
  type: ActivityType;
  distributorId: string | null;
  distributorName: string | null;
  cityName: string | null;
  code: string | null;
  boxNumber: number | null;
  reservationId: string | null;
  details: string | null;
  createdAt: string;
};

export function getActivityLabel(type: ActivityType): string {
  switch (type) {
    case "SCAN":
      return "Scan QR";
    case "SCAN_FAILED":
      return "Scan refusé";
    case "REMOTE_OPEN":
      return "Ouverture à distance";
    case "CREATE":
      return "Pass créé";
    case "MANUAL_CREATE":
      return "Réservation manuelle";
    case "DELETE":
      return "Suppression";
    case "SUBSCRIPTION_CREATED":
      return "Abonnement créé";
    case "SUBSCRIPTION_UPDATED":
      return "Abonnement modifié";
    case "KEY_REGISTERED":
      return "Clé enregistrée";
    case "KEY_DEPOSITED":
      return "Clé déposée";
    case "KEY_PASS_CREATED":
      return "Pass client créé";
    default:
      return type;
  }
}
