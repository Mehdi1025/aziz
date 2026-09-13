"use client";

import { motion } from "framer-motion";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";

type DashboardShellProps = {
  isLight?: boolean;
};

export function DashboardSkeleton({ isLight = false }: DashboardShellProps) {
  const bone = isLight ? "bg-zinc-200/80" : "bg-white/[0.06]";

  return (
    <div className="flex h-full min-h-0">
      <div className={`hidden h-screen w-64 shrink-0 overflow-hidden border-r lg:block ${isLight ? "border-zinc-200 bg-white" : "border-white/[0.06] bg-zinc-950"}`}>
        <div className="space-y-3 p-6">
          <div className={`h-10 w-10 animate-pulse rounded-xl ${bone}`} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-10 animate-pulse rounded-xl ${bone}`} />
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
        <div className={`mb-8 h-24 animate-pulse rounded-2xl ${bone}`} />
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ThemedPanel key={i} isLight={isLight} className={`h-28 animate-pulse ${bone}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ThemedPanel key={i} isLight={isLight} className={`h-48 animate-pulse ${bone}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardBackground({ isLight = false }: DashboardShellProps) {
  if (isLight) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 bg-[#f4f4f5]" />
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[32px_32px]" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_50%)]" />
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-[#09090b]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[32px_32px]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.06),transparent_50%)]" />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="pointer-events-none fixed -left-32 top-0 h-96 w-96 rounded-full bg-sky-500/[0.07] blur-3xl"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="pointer-events-none fixed -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-500/[0.06] blur-3xl"
      />
    </>
  );
}
