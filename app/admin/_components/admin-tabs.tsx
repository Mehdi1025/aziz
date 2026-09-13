"use client";

export type AdminTab =
  | "overview"
  | "livegrid"
  | "map"
  | "reservations"
  | "history"
  | "calendar"
  | "create"
  | "journal"
  | "loueurs"
  | "controltower";

type AdminTabsProps = {
  active: AdminTab;
  onChange: (tab: AdminTab) => void;
  isLight?: boolean;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "reservations", label: "Réservations" },
  { id: "history", label: "Historique" },
  { id: "calendar", label: "Calendrier" },
  { id: "create", label: "Créer" },
  { id: "journal", label: "Journal" },
];

export function AdminTabs({ active, onChange, isLight = false }: AdminTabsProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? isLight
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-neutral-950"
                  : isLight
                    ? "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    : "border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
