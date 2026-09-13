export type AdminTheme = {
  isLight: boolean;
};

export function shell(isLight: boolean) {
  return isLight
    ? "bg-[#f4f4f5] text-zinc-900"
    : "bg-[#09090b] text-white";
}

export function panel(isLight: boolean, extra = "") {
  return isLight
    ? `border border-zinc-200/80 bg-white shadow-sm shadow-zinc-200/50 ${extra}`
    : `border border-white/[0.08] bg-white/[0.03] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] ${extra}`;
}

export function muted(isLight: boolean) {
  return isLight ? "text-zinc-500" : "text-neutral-500";
}

export function heading(isLight: boolean) {
  return isLight ? "text-zinc-900" : "text-white";
}

export function subheading(isLight: boolean) {
  return isLight ? "text-zinc-600" : "text-neutral-400";
}

export function input(isLight: boolean) {
  return isLight
    ? "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
    : "border-white/10 bg-white/[0.04] text-white placeholder:text-neutral-600 focus:border-sky-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-sky-500/20";
}

export function btnPrimary(isLight: boolean) {
  return isLight
    ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
    : "bg-white text-zinc-950 hover:bg-neutral-100 shadow-sm shadow-white/10";
}

export function btnSecondary(isLight: boolean) {
  return isLight
    ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
    : "border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10";
}

export function tableHead(isLight: boolean) {
  return isLight
    ? "border-zinc-200 bg-zinc-50/80 text-zinc-500"
    : "border-white/10 bg-white/[0.02] text-neutral-500";
}

export function tableRow(isLight: boolean) {
  return isLight
    ? "border-zinc-100 hover:bg-sky-50/40"
    : "border-white/[0.04] hover:bg-white/[0.03]";
}

export function sidebar(isLight: boolean) {
  return isLight
    ? "border-zinc-200/80 bg-white/90 backdrop-blur-xl"
    : "border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl";
}

export function sidebarItem(active: boolean, isLight: boolean) {
  if (active) {
    return isLight
      ? "bg-zinc-900 text-white shadow-sm"
      : "bg-white text-zinc-950 shadow-sm shadow-white/10";
  }
  return isLight
    ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    : "text-neutral-400 hover:bg-white/[0.06] hover:text-white";
}
