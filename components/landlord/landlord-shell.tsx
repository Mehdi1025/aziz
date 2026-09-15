"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { shell } from "@/lib/admin-theme";

type LandlordShellProps = {
  children: ReactNode;
  isLight: boolean;
};

export function LandlordShell({ children, isLight }: LandlordShellProps) {
  return (
    <div className={`relative min-h-screen overflow-x-hidden ${shell(isLight)}`}>
      {!isLight && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-[120px]"
            animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-24 top-1/3 h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-[120px]"
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-sky-500/8 blur-[100px]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {isLight && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-20 top-0 h-[400px] w-[400px] rounded-full bg-emerald-200/40 blur-[100px]" />
          <div className="absolute -right-16 top-1/4 h-[360px] w-[360px] rounded-full bg-violet-200/30 blur-[100px]" />
        </div>
      )}

      <div className="relative">{children}</div>
    </div>
  );
}
