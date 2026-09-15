import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Home,
  KeyRound,
  LayoutDashboard,
  Link2,
} from "lucide-react";

export type LandlordTab = "overview" | "properties" | "passes" | "subscription";

export type LandlordTabMeta = {
  id: LandlordTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const LANDLORD_TABS: LandlordTabMeta[] = [
  {
    id: "overview",
    label: "Accueil",
    shortLabel: "Accueil",
    description: "Vue d'ensemble et indicateurs clés",
    icon: LayoutDashboard,
  },
  {
    id: "properties",
    label: "Logements & Clés",
    shortLabel: "Logements",
    description: "Gérez vos biens et déposez vos clés",
    icon: Home,
  },
  {
    id: "passes",
    label: "Pass voyageur",
    shortLabel: "Pass",
    description: "Générez des accès pour vos locataires",
    icon: Link2,
  },
  {
    id: "subscription",
    label: "Abonnement",
    shortLabel: "Formule",
    description: "Votre formule et quota de clés",
    icon: CreditCard,
  },
];

export const LANDLORD_TAB_LABELS: Record<LandlordTab, string> = Object.fromEntries(
  LANDLORD_TABS.map((t) => [t.id, t.label]),
) as Record<LandlordTab, string>;
