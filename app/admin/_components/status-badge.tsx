export function StatusBadge({ isUsed, isLight = false }: { isUsed: boolean; isLight?: boolean }) {
  if (isUsed) {
    return (
      <span
        className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          isLight
            ? "bg-zinc-100 text-zinc-600"
            : "border border-neutral-600/40 bg-neutral-800/80 text-neutral-300"
        }`}
      >
        Utilisé
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isLight
          ? "bg-sky-100 text-sky-700"
          : "border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_20px_-8px_rgba(56,189,248,0.8)]"
      }`}
    >
      En attente
    </span>
  );
}
