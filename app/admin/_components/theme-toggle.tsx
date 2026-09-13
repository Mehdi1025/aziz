"use client";

import { Moon, Sun } from "lucide-react";
import { btnSecondary } from "@/lib/admin-theme";

type ThemeToggleProps = {
  isLight: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ isLight, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${btnSecondary(isLight)}`}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden sm:inline">{isLight ? "Sombre" : "Clair"}</span>
    </button>
  );
}
