"use client";

import type { ReactNode } from "react";
import { heading, muted } from "@/lib/admin-theme";

type SectionHeaderProps = {
  title: string;
  description?: string;
  isLight?: boolean;
  action?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  isLight = false,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className={`text-xl font-semibold tracking-tight ${heading(isLight)}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-1.5 text-sm leading-relaxed ${muted(isLight)}`}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
