"use client";

import { ChevronRight } from "lucide-react";
import { muted } from "@/lib/admin-theme";

type Crumb = {
  label: string;
  onClick?: () => void;
};

type OverviewBreadcrumbProps = {
  crumbs: Crumb[];
  isLight?: boolean;
};

export function OverviewBreadcrumb({ crumbs, isLight = false }: OverviewBreadcrumbProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
            {crumb.onClick && !isLast ? (
              <button
                type="button"
                onClick={crumb.onClick}
                className={`font-semibold transition-colors hover:underline ${
                  isLight ? "text-zinc-600 hover:text-zinc-900" : "text-neutral-400 hover:text-white"
                }`}
              >
                {crumb.label}
              </button>
            ) : (
              <span className={`font-bold ${isLast ? (isLight ? "text-zinc-900" : "text-white") : muted(isLight)}`}>
                {crumb.label}
              </span>
            )}
            {!isLast && <ChevronRight className={`h-3.5 w-3.5 ${muted(isLight)}`} />}
          </span>
        );
      })}
    </nav>
  );
}
