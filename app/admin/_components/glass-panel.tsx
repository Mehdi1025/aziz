import type { ReactNode } from "react";
import { panel } from "@/lib/admin-theme";

type GlassPanelProps = {
  children?: ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassPanel({
  children,
  className = "",
  hover = false,
}: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-xl transition-all duration-300 ${panel(false)} ${hover ? "hover:border-white/15 hover:shadow-lg" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function ThemedPanel({
  children,
  isLight = false,
  className = "",
  hover = false,
}: GlassPanelProps & { isLight?: boolean }) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-xl transition-all duration-300 ${panel(isLight, hover ? "hover:shadow-md" : "")} ${className}`}
    >
      {children}
    </div>
  );
}
