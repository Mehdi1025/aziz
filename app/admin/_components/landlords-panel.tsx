"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addKeyDeposit,
  createClientPassFromKey,
  createLandlordWithSubscription,
  depositKeyInLocker,
  updateSubscriptionStatus,
} from "@/app/admin/landlord-actions";
import { ThemedPanel } from "@/app/admin/_components/glass-panel";
import { SectionHeader } from "@/app/admin/_components/section-header";
import {
  btnPrimary,
  btnSecondary,
  heading,
  input as inputClass,
  muted,
  subheading,
} from "@/lib/admin-theme";
import { formatDistributorLabel, type DistributorRow } from "@/lib/network-types";
import type {
  KeyDepositRow,
  LandlordRow,
  SubscriptionPlanRow,
  SubscriptionStatus,
} from "@/lib/subscription-types";
import {
  formatPriceMonthly,
  KEY_STATUS_META,
  SUBSCRIPTION_STATUS_META,
} from "@/lib/subscription-types";
import {
  computeSubscriptionKpis,
  filterLandlords,
  getSubscriptionUsage,
} from "@/lib/subscription-utils";

type LandlordsPanelProps = {
  landlords: LandlordRow[];
  plans: SubscriptionPlanRow[];
  distributors: DistributorRow[];
  isLight?: boolean;
  onUpdated: () => void;
};

export function LandlordsPanel({
  landlords,
  plans,
  distributors,
  isLight = false,
  onUpdated,
}: LandlordsPanelProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "past_due" | "trial" | "none"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(
    landlords[0]?.id ?? null,
  );
  const [showAddLandlord, setShowAddLandlord] = useState(false);
  const [isPending, startTransition] = useTransition();

  const kpis = useMemo(() => computeSubscriptionKpis(landlords), [landlords]);
  const visibleLandlords = useMemo(
    () => filterLandlords(landlords, query, statusFilter),
    [landlords, query, statusFilter],
  );

  const labelClass = `mb-1.5 block text-xs font-semibold ${subheading(isLight)}`;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border p-6 sm:p-8">
        <div
          className={`absolute inset-0 ${
            isLight
              ? "bg-linear-to-br from-emerald-50 via-white to-sky-50"
              : "bg-linear-to-br from-emerald-500/10 via-transparent to-sky-500/10"
          }`}
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]">
                <Sparkles className="h-3 w-3 text-emerald-500" />
                <span className={muted(isLight)}>Loueurs KeyNest</span>
              </div>
              <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${heading(isLight)}`}>
                Abonnements & clés
              </h2>
              <p className={`mt-2 max-w-2xl text-sm ${muted(isLight)}`}>
                Les loueurs souscrivent un abonnement, déposent les clés de leurs logements
                en casier, puis génèrent des passes pour leurs locataires.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddLandlord((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${btnPrimary(isLight)}`}
            >
              <UserPlus className="h-4 w-4" />
              Nouveau loueur
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              isLight={isLight}
              label="Abonnements actifs"
              value={String(kpis.activeSubscriptions + kpis.trialSubscriptions)}
              hint={`${kpis.pastDueSubscriptions} impayé${kpis.pastDueSubscriptions > 1 ? "s" : ""}`}
              color="#10b981"
            />
            <KpiCard
              isLight={isLight}
              label="Revenu mensuel"
              value={formatPriceMonthly(kpis.monthlyRevenueCents)}
              hint="MRR estimé"
              color="#38bdf8"
            />
            <KpiCard
              isLight={isLight}
              label="Clés utilisées"
              value={`${kpis.totalKeysUsed}/${kpis.totalKeysAllowed || "—"}`}
              hint={`${kpis.keysPendingDeposit} à déposer`}
              color="#f97316"
            />
            <KpiCard
              isLight={isLight}
              label="En casier"
              value={String(kpis.keysInLockers)}
              hint="prêtes pour retrait client"
              color="#a855f7"
            />
          </div>
        </div>
      </section>

      {showAddLandlord && (
        <AddLandlordForm
          isLight={isLight}
          plans={plans}
          isPending={isPending}
          onSubmit={(data) => {
            startTransition(async () => {
              const result = await createLandlordWithSubscription(data);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Loueur créé", { description: result.landlord.name });
              setShowAddLandlord(false);
              setExpandedId(result.landlord.id);
              onUpdated();
            });
          }}
        />
      )}

      <section>
        <SectionHeader
          title="Formules d'abonnement"
          description="Chaque formule définit le nombre de clés que le loueur peut gérer."
          isLight={isLight}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ThemedPanel isLight={isLight} className="relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 to-teal-400" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-lg font-black ${heading(isLight)}`}>{plan.name}</p>
                    <p className={`mt-1 text-sm ${muted(isLight)}`}>{plan.description}</p>
                  </div>
                  <CreditCard className={`h-5 w-5 shrink-0 ${muted(isLight)}`} />
                </div>
                <p className={`mt-4 text-3xl font-black tabular-nums ${heading(isLight)}`}>
                  {formatPriceMonthly(plan.priceMonthly)}
                  <span className={`ml-1 text-sm font-medium ${muted(isLight)}`}>/mois</span>
                </p>
                <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  isLight ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  <KeyRound className="h-3.5 w-3.5" />
                  Jusqu&apos;à {plan.maxKeys} clé{plan.maxKeys > 1 ? "s" : ""}
                </p>
              </ThemedPanel>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Loueurs"
          description={`${visibleLandlords.length} compte${visibleLandlords.length > 1 ? "s" : ""}`}
          isLight={isLight}
        />

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative md:col-span-1">
            <Search
              className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${muted(isLight)}`}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher loueur, e-mail, logement…"
              className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none ${inputClass(isLight)}`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className={`rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="trial">Essai</option>
            <option value="past_due">Impayés</option>
            <option value="none">Sans abonnement</option>
          </select>
        </div>

        {visibleLandlords.length === 0 ? (
          <ThemedPanel isLight={isLight} className="p-8 text-center">
            <p className={`text-sm ${muted(isLight)}`}>Aucun loueur trouvé.</p>
          </ThemedPanel>
        ) : (
          <div className="space-y-3">
            {visibleLandlords.map((landlord) => (
              <LandlordCard
                key={landlord.id}
                landlord={landlord}
                distributors={distributors}
                isLight={isLight}
                expanded={expandedId === landlord.id}
                isPending={isPending}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === landlord.id ? null : landlord.id,
                  )
                }
                onUpdated={onUpdated}
                labelClass={labelClass}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  isLight,
  label,
  value,
  hint,
  color,
}: {
  isLight: boolean;
  label: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <ThemedPanel isLight={isLight} className="relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: color }}
      />
      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted(isLight)}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black tabular-nums ${heading(isLight)}`}>{value}</p>
      <p className={`mt-1 text-xs ${muted(isLight)}`}>{hint}</p>
    </ThemedPanel>
  );
}

function AddLandlordForm({
  isLight,
  plans,
  isPending,
  onSubmit,
}: {
  isLight: boolean;
  plans: SubscriptionPlanRow[];
  isPending: boolean;
  onSubmit: (data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    planId: string;
    status?: SubscriptionStatus;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const labelClass = `mb-1.5 block text-xs font-semibold ${subheading(isLight)}`;

  return (
    <ThemedPanel isLight={isLight} className="p-5 sm:p-6">
      <h3 className={`mb-4 text-lg font-black ${heading(isLight)}`}>Créer un loueur</h3>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, email, phone, company, planId, status: "active" });
        }}
      >
        <div>
          <label className={labelClass}>Nom</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          />
        </div>
        <div>
          <label className={labelClass}>Téléphone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          />
        </div>
        <div>
          <label className={labelClass}>Société (optionnel)</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Formule</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${inputClass(isLight)}`}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {formatPriceMonthly(plan.priceMonthly)}/mois — {plan.maxKeys} clés
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending || !planId}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${btnPrimary(isLight)}`}
          >
            <UserPlus className="h-4 w-4" />
            {isPending ? "Création…" : "Créer le loueur et l'abonnement"}
          </button>
        </div>
      </form>
    </ThemedPanel>
  );
}

function LandlordCard({
  landlord,
  distributors,
  isLight,
  expanded,
  isPending,
  onToggle,
  onUpdated,
  labelClass,
}: {
  landlord: LandlordRow;
  distributors: DistributorRow[];
  isLight: boolean;
  expanded: boolean;
  isPending: boolean;
  onToggle: () => void;
  onUpdated: () => void;
  labelClass: string;
}) {
  const [isLocalPending, startTransition] = useTransition();
  const sub = landlord.subscription;
  const usage = sub ? getSubscriptionUsage(sub) : 0;
  const statusMeta = sub ? SUBSCRIPTION_STATUS_META[sub.status] : null;

  function updateStatus(status: SubscriptionStatus) {
    if (!sub) return;
    startTransition(async () => {
      const result = await updateSubscriptionStatus(sub.id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Abonnement mis à jour");
      onUpdated();
    });
  }

  return (
    <ThemedPanel isLight={isLight} className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 ${
          isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
        }`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isLight ? "bg-zinc-100 text-zinc-700" : "bg-white/10 text-white"
          }`}
        >
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`truncate text-base font-bold ${heading(isLight)}`}>{landlord.name}</p>
            {landlord.company && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/10 text-neutral-400"}`}>
                {landlord.company}
              </span>
            )}
            {statusMeta && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: statusMeta.color }}
              >
                {statusMeta.label}
              </span>
            )}
          </div>
          <div className={`mt-1 flex flex-wrap items-center gap-3 text-xs ${muted(isLight)}`}>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {landlord.email}
            </span>
            {landlord.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {landlord.phone}
              </span>
            )}
            {sub && (
              <span>
                {sub.planName} · {sub.keysUsed}/{sub.maxKeys} clés · {formatPriceMonthly(sub.priceMonthly)}/mois
              </span>
            )}
          </div>
          {sub && (
            <div className={`mt-2 h-1.5 max-w-xs overflow-hidden rounded-full ${isLight ? "bg-zinc-200" : "bg-white/10"}`}>
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400"
                style={{ width: `${usage}%` }}
              />
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""} ${muted(isLight)}`}
        />
      </button>

      {expanded && (
        <div className={`border-t px-4 py-4 sm:px-5 ${isLight ? "border-zinc-100 bg-zinc-50/50" : "border-white/[0.06] bg-white/[0.02]"}`}>
          {sub && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(["active", "trial", "past_due", "canceled"] as SubscriptionStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isPending || isLocalPending || sub.status === status}
                    onClick={() => updateStatus(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${btnSecondary(isLight)}`}
                  >
                    {SUBSCRIPTION_STATUS_META[status].label}
                  </button>
                ),
              )}
            </div>
          )}

          <KeyManagement
            landlord={landlord}
            distributors={distributors}
            isLight={isLight}
            isPending={isPending || isLocalPending}
            labelClass={labelClass}
            onUpdated={onUpdated}
          />
        </div>
      )}
    </ThemedPanel>
  );
}

function KeyManagement({
  landlord,
  distributors,
  isLight,
  isPending,
  labelClass,
  onUpdated,
}: {
  landlord: LandlordRow;
  distributors: DistributorRow[];
  isLight: boolean;
  isPending: boolean;
  labelClass: string;
  onUpdated: () => void;
}) {
  const [showAddKey, setShowAddKey] = useState(false);
  const [propertyLabel, setPropertyLabel] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [isLocalPending, startTransition] = useTransition();
  const sub = landlord.subscription;
  const canAdd =
    sub &&
    (sub.status === "active" || sub.status === "trial") &&
    sub.keysUsed < sub.maxKeys;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className={`text-sm font-black ${heading(isLight)}`}>
          Clés ({landlord.keys.filter((k) => k.status !== "inactive").length}
          {sub ? ` / ${sub.maxKeys}` : ""})
        </h4>
        <button
          type="button"
          disabled={!canAdd || isPending || isLocalPending}
          onClick={() => setShowAddKey((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${btnSecondary(isLight)}`}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter une clé
        </button>
      </div>

      {showAddKey && (
        <form
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await addKeyDeposit({
                landlordId: landlord.id,
                propertyLabel,
                propertyAddress,
              });
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Clé enregistrée");
              setPropertyLabel("");
              setPropertyAddress("");
              setShowAddKey(false);
              onUpdated();
            });
          }}
        >
          <div>
            <label className={labelClass}>Logement</label>
            <input
              required
              value={propertyLabel}
              onChange={(e) => setPropertyLabel(e.target.value)}
              placeholder="T2 Rue de la Paix"
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
            />
          </div>
          <div>
            <label className={labelClass}>Adresse</label>
            <input
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="12 rue…"
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isPending || isLocalPending}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${btnPrimary(isLight)}`}
            >
              Enregistrer la clé
            </button>
          </div>
        </form>
      )}

      {landlord.keys.length === 0 ? (
        <p className={`text-sm ${muted(isLight)}`}>Aucune clé enregistrée.</p>
      ) : (
        <div className="space-y-3">
          {landlord.keys.map((key) => (
            <KeyRow
              key={key.id}
              keyDeposit={key}
              distributors={distributors}
              isLight={isLight}
              isPending={isPending || isLocalPending}
              labelClass={labelClass}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KeyRow({
  keyDeposit,
  distributors,
  isLight,
  isPending,
  labelClass,
  onUpdated,
}: {
  keyDeposit: KeyDepositRow;
  distributors: DistributorRow[];
  isLight: boolean;
  isPending: boolean;
  labelClass: string;
  onUpdated: () => void;
}) {
  const [distributorId, setDistributorId] = useState(
    keyDeposit.distributorId ?? distributors[0]?.id ?? "",
  );
  const [boxNumber, setBoxNumber] = useState(
    keyDeposit.boxNumber ? String(keyDeposit.boxNumber) : "1",
  );
  const [passCode, setPassCode] = useState("");
  const [passIn, setPassIn] = useState("");
  const [passOut, setPassOut] = useState("");
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLocalPending, startTransition] = useTransition();
  const statusMeta = KEY_STATUS_META[keyDeposit.status];
  const selectedDistributor = distributors.find((d) => d.id === distributorId);

  const grouped = distributors.reduce<Record<string, DistributorRow[]>>((acc, d) => {
    if (!acc[d.cityName]) acc[d.cityName] = [];
    acc[d.cityName].push(d);
    return acc;
  }, {});

  function deposit() {
    startTransition(async () => {
      const result = await depositKeyInLocker({
        keyId: keyDeposit.id,
        distributorId,
        boxNumber: Number.parseInt(boxNumber, 10),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Clé déposée en casier");
      onUpdated();
    });
  }

  function createPass() {
    startTransition(async () => {
      const result = await createClientPassFromKey({
        keyId: keyDeposit.id,
        code: passCode,
        in: passIn,
        out: passOut,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPassUrl(result.passUrl);
      toast.success("Pass client créé");
      onUpdated();
    });
  }

  async function copyPass() {
    if (!passUrl) return;
    const full = `${window.location.origin}${passUrl}`;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    toast.success("Lien copié");
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        isLight ? "border-zinc-200 bg-white" : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            <p className={`font-bold ${heading(isLight)}`}>{keyDeposit.propertyLabel}</p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
          </div>
          {keyDeposit.propertyAddress && (
            <p className={`mt-1 flex items-center gap-1 text-xs ${muted(isLight)}`}>
              <MapPin className="h-3 w-3" />
              {keyDeposit.propertyAddress}
            </p>
          )}
          {keyDeposit.distributorName && keyDeposit.boxNumber && (
            <p className={`mt-1 text-xs ${muted(isLight)}`}>
              {keyDeposit.cityName} · {keyDeposit.distributorName} · Casier {keyDeposit.boxNumber}
            </p>
          )}
          {keyDeposit.activeReservationCode && (
            <p className={`mt-1 text-xs font-semibold text-emerald-500`}>
              Pass actif : {keyDeposit.activeReservationCode}
            </p>
          )}
        </div>
      </div>

      {(keyDeposit.status === "pending_deposit" || keyDeposit.status === "checked_out") && (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Distributeur</label>
            <select
              value={distributorId}
              onChange={(e) => setDistributorId(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
            >
              {Object.entries(grouped).map(([cityName, items]) => (
                <optgroup key={cityName} label={cityName}>
                  {items.map((d) => (
                    <option key={d.id} value={d.id}>
                      {formatDistributorLabel(d)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Casier</label>
            <input
              type="number"
              min={1}
              max={selectedDistributor?.totalBoxes ?? 99}
              value={boxNumber}
              onChange={(e) => setBoxNumber(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="button"
              disabled={isPending || isLocalPending || !distributorId}
              onClick={deposit}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50 ${btnPrimary(isLight)}`}
            >
              Déposer en casier
            </button>
          </div>
        </div>
      )}

      {keyDeposit.status === "in_locker" && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className={`text-xs font-bold uppercase tracking-[0.12em] ${muted(isLight)}`}>
            Pass client (locataire / visiteur)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Code</label>
              <input
                value={passCode}
                onChange={(e) => setPassCode(e.target.value)}
                placeholder="PASS-123"
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
              />
            </div>
            <div>
              <label className={labelClass}>Entrée (JJ/MM/AAAA HH:mm)</label>
              <input
                value={passIn}
                onChange={(e) => setPassIn(e.target.value)}
                placeholder="12/09/2026 14:00"
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
              />
            </div>
            <div>
              <label className={labelClass}>Sortie</label>
              <input
                value={passOut}
                onChange={(e) => setPassOut(e.target.value)}
                placeholder="15/09/2026 11:00"
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass(isLight)}`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                disabled={isPending || isLocalPending}
                onClick={createPass}
                className={`w-full rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50 ${btnPrimary(isLight)}`}
              >
                Générer le pass
              </button>
            </div>
          </div>
          {passUrl && (
            <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/20 bg-emerald-500/10"}`}>
              <span className="truncate font-mono text-emerald-600 dark:text-emerald-400">{passUrl}</span>
              <button
                type="button"
                onClick={copyPass}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold ${btnSecondary(isLight)}`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copier
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
