"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddKeyModal } from "@/components/landlord/add-key-modal";
import { AirbnbMessageGenerator } from "@/components/landlord/airbnb-message-generator";
import { DepositKeySheet } from "@/components/landlord/deposit-key-sheet";
import { GuestReservationsTable } from "@/components/landlord/guest-reservations-table";
import type { HostKpis } from "@/components/landlord/kpi-cards";
import { KeyGrid } from "@/components/landlord/key-grid";
import { LandlordHero } from "@/components/landlord/landlord-hero";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import { LandlordSidebar } from "@/components/landlord/landlord-sidebar";
import type { LandlordTab } from "@/components/landlord/landlord-tabs";
import { LandlordTopbar } from "@/components/landlord/landlord-topbar";
import type { LandlordDashboardData } from "@/components/landlord/mock-landlord-data";
import { MOCK_DISTRIBUTOR_SLUGS } from "@/components/landlord/mock-landlord-data";
import type { LandlordGuestReservationRow } from "@/lib/landlord-guest-types";
import { OverviewShortcuts } from "@/components/landlord/overview-shortcuts";
import {
  formatPassDateParam,
  generatePassCode,
  PassGenerator,
} from "@/components/landlord/pass-generator";
import { SubscriptionPanel } from "@/components/landlord/subscription-panel";
import {
  addKeyDeposit,
  createClientPassFromKey,
  depositKeyInLocker,
} from "@/app/hotes/actions";
import { shell } from "@/lib/admin-theme";
import { canAddKey } from "@/lib/subscription-types";
import type { KeyDepositRow } from "@/lib/subscription-types";

type LandlordDashboardProps = {
  initialData: LandlordDashboardData;
  initialGuestReservations: LandlordGuestReservationRow[];
  useMockActions?: boolean;
};

function computeHostKpis(keys: KeyDepositRow[]): HostKpis {
  return {
    keysInLocker: keys.filter((k) => k.status === "in_locker").length,
    pendingPasses: keys.filter((k) => k.activeReservationCode !== null).length,
    keysRecovered: keys.filter((k) => k.status === "checked_out").length,
  };
}

const tabMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function LandlordDashboard({
  initialData,
  initialGuestReservations,
  useMockActions = true,
}: LandlordDashboardProps) {
  const [isLight, setIsLight] = useState(true);
  const [activeTab, setActiveTab] = useState<LandlordTab>("overview");
  const landlord = initialData.landlord;
  const [keys, setKeys] = useState<KeyDepositRow[]>(initialData.landlord.keys);
  const [showAddKey, setShowAddKey] = useState(false);
  const [depositKeyId, setDepositKeyId] = useState<string | null>(null);
  const [guestReservations] = useState(initialGuestReservations);

  const distributorSlugs = useMemo(
    () =>
      Object.fromEntries(
        initialData.distributors.map((d) => [d.id, d.slug]),
      ) as Record<string, string>,
    [initialData.distributors],
  );

  const subscription = landlord.subscription;
  const maxKeys = subscription?.maxKeys ?? 0;
  const keysUsed = keys.length;
  const quotaReached = keysUsed >= maxKeys;
  const canAdd = canAddKey(subscription, keysUsed);

  const depositKey = keys.find((k) => k.id === depositKeyId) ?? null;
  const kpis = useMemo(() => computeHostKpis(keys), [keys]);
  const pendingDepositCount = keys.filter((k) => k.status === "pending_deposit").length;

  useEffect(() => {
    const stored = localStorage.getItem("landlord-theme");
    if (stored === "dark") setIsLight(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsLight((prev) => {
      const next = !prev;
      localStorage.setItem("landlord-theme", next ? "light" : "dark");
      return next;
    });
  }, []);

  async function handleAddKey(data: {
    propertyLabel: string;
    propertyAddress: string;
  }) {
    if (!canAdd || !subscription) return;

    if (useMockActions) {
      const newKey: KeyDepositRow = {
        id: `key_${Date.now()}`,
        landlordId: landlord.id,
        subscriptionId: subscription.id,
        propertyLabel: data.propertyLabel,
        propertyAddress: data.propertyAddress || null,
        distributorId: null,
        distributorName: null,
        cityName: null,
        boxNumber: null,
        status: "pending_deposit",
        notes: null,
        depositedAt: null,
        createdAt: new Date().toISOString(),
        activeReservationCode: null,
      };
      setKeys((prev) => [newKey, ...prev]);
      toast.success("Clé ajoutée avec succès");
      return;
    }

    const result = await addKeyDeposit({
      landlordId: landlord.id,
      propertyLabel: data.propertyLabel,
      propertyAddress: data.propertyAddress,
    });
    if (result.ok) {
      toast.success("Clé ajoutée");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDeposit(data: {
    keyId: string;
    distributorId: string;
    distributorSlug: string;
    distributorName: string;
    cityName: string;
    boxNumber: number;
  }) {
    if (useMockActions) {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === data.keyId
            ? {
                ...k,
                status: "in_locker" as const,
                distributorId: data.distributorId,
                distributorName: data.distributorName,
                cityName: data.cityName,
                boxNumber: data.boxNumber,
                depositedAt: new Date().toISOString(),
              }
            : k,
        ),
      );
      toast.success("Clé déposée en casier");
      return;
    }

    const result = await depositKeyInLocker({
      keyId: data.keyId,
      distributorId: data.distributorId,
      boxNumber: data.boxNumber,
    });
    if (result.ok) {
      toast.success("Clé déposée");
    } else {
      toast.error(result.error);
    }
  }

  async function handleGeneratePass(data: {
    keyId: string;
    guestFirstName: string;
    validFrom: string;
    validTo: string;
  }) {
    if (useMockActions) {
      return null;
    }

    const code = generatePassCode();
    const result = await createClientPassFromKey({
      keyId: data.keyId,
      code,
      in: formatPassDateParam(new Date(data.validFrom)),
      out: formatPassDateParam(new Date(data.validTo)),
    });

    if (result.ok) {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === data.keyId
            ? { ...k, activeReservationCode: result.code }
            : k,
        ),
      );
      return { passUrl: result.passUrl, code: result.code };
    }

    toast.error(result.error);
    return null;
  }

  return (
    <LandlordShell isLight={isLight}>
      <div className={`flex min-h-screen ${shell(isLight)}`}>
        <LandlordSidebar
          active={activeTab}
          onChange={setActiveTab}
          isLight={isLight}
          hostName={landlord.name}
          hostEmail={landlord.email}
          planName={subscription?.planName ?? "—"}
          planSlug={subscription?.planSlug ?? "pro"}
          keysUsed={keysUsed}
          maxKeys={maxKeys}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <LandlordTopbar
            activeTab={activeTab}
            isLight={isLight}
            onToggleTheme={toggleTheme}
          />

          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <div className="mx-auto max-w-5xl">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div key="overview" {...tabMotion} className="space-y-8">
                    <LandlordHero
                      hostName={landlord.name}
                      planName={subscription?.planName ?? "—"}
                      planSlug={subscription?.planSlug ?? "pro"}
                      keysUsed={keysUsed}
                      maxKeys={maxKeys}
                      kpis={kpis}
                      isLight={isLight}
                    />
                    <OverviewShortcuts
                      isLight={isLight}
                      onNavigate={setActiveTab}
                      onAddKey={() => setShowAddKey(true)}
                      pendingDepositCount={pendingDepositCount}
                      keysInLockerCount={kpis.keysInLocker}
                    />
                  </motion.div>
                )}

                {activeTab === "properties" && (
                  <motion.div key="properties" {...tabMotion}>
                    <KeyGrid
                      keys={keys}
                      isLight={isLight}
                      canAddKey={canAdd}
                      quotaReached={quotaReached}
                      onAddKey={() => setShowAddKey(true)}
                      onDeposit={setDepositKeyId}
                    />
                  </motion.div>
                )}

                {activeTab === "passes" && (
                  <motion.div key="passes" {...tabMotion} className="space-y-0">
                    <AirbnbMessageGenerator
                      keys={keys}
                      distributorSlugs={
                        Object.keys(distributorSlugs).length > 0
                          ? distributorSlugs
                          : MOCK_DISTRIBUTOR_SLUGS
                      }
                      isLight={isLight}
                    />
                    <PassGenerator
                      keys={keys}
                      distributors={initialData.distributors}
                      isLight={isLight}
                      onGenerate={useMockActions ? undefined : handleGeneratePass}
                    />
                  </motion.div>
                )}

                {activeTab === "guests" && (
                  <motion.div key="guests" {...tabMotion}>
                    <GuestReservationsTable
                      reservations={guestReservations}
                      isLight={isLight}
                    />
                  </motion.div>
                )}

                {activeTab === "subscription" && subscription && (
                  <motion.div key="subscription" {...tabMotion}>
                    <SubscriptionPanel
                      subscription={subscription}
                      plans={initialData.plans}
                      keysUsed={keysUsed}
                      isLight={isLight}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <AddKeyModal
        open={showAddKey}
        isLight={isLight}
        canAddKey={canAdd}
        onClose={() => setShowAddKey(false)}
        onSubmit={handleAddKey}
      />

      <DepositKeySheet
        open={depositKeyId !== null}
        keyDeposit={depositKey}
        distributors={initialData.distributors}
        isLight={isLight}
        onClose={() => setDepositKeyId(null)}
        onConfirm={handleDeposit}
      />
    </LandlordShell>
  );
}
