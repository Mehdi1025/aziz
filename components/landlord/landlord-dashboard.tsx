"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddKeyModal } from "@/components/landlord/add-key-modal";
import { DepositKeySheet } from "@/components/landlord/deposit-key-sheet";
import type { HostKpis } from "@/components/landlord/kpi-cards";
import { KeyGrid } from "@/components/landlord/key-grid";
import { LandlordHeader } from "@/components/landlord/landlord-header";
import { LandlordHero } from "@/components/landlord/landlord-hero";
import { LandlordShell } from "@/components/landlord/landlord-shell";
import type { LandlordDashboardData } from "@/components/landlord/mock-landlord-data";
import {
  formatPassDateParam,
  generatePassCode,
  PassGenerator,
} from "@/components/landlord/pass-generator";
import {
  addKeyDeposit,
  createClientPassFromKey,
  depositKeyInLocker,
} from "@/app/hotes/actions";
import { canAddKey } from "@/lib/subscription-types";
import type { KeyDepositRow } from "@/lib/subscription-types";

type LandlordDashboardProps = {
  initialData: LandlordDashboardData;
  useMockActions?: boolean;
};

function computeHostKpis(keys: KeyDepositRow[]): HostKpis {
  return {
    keysInLocker: keys.filter((k) => k.status === "in_locker").length,
    pendingPasses: keys.filter((k) => k.activeReservationCode !== null).length,
    keysRecovered: keys.filter((k) => k.status === "checked_out").length,
  };
}

export function LandlordDashboard({
  initialData,
  useMockActions = true,
}: LandlordDashboardProps) {
  const [isLight, setIsLight] = useState(false);
  const [landlord, setLandlord] = useState(initialData.landlord);
  const [keys, setKeys] = useState<KeyDepositRow[]>(initialData.landlord.keys);
  const [showAddKey, setShowAddKey] = useState(false);
  const [depositKeyId, setDepositKeyId] = useState<string | null>(null);

  const subscription = landlord.subscription;
  const maxKeys = subscription?.maxKeys ?? 0;
  const keysUsed = keys.length;
  const quotaReached = keysUsed >= maxKeys;
  const canAdd = canAddKey(subscription, keysUsed);

  const depositKey = keys.find((k) => k.id === depositKeyId) ?? null;
  const kpis = useMemo(() => computeHostKpis(keys), [keys]);

  useEffect(() => {
    const stored = localStorage.getItem("landlord-theme");
    if (stored === "light") setIsLight(true);
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
      // TODO: refresh from server
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
      <LandlordHeader isLight={isLight} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <LandlordHero
          hostName={landlord.name}
          planName={subscription?.planName ?? "—"}
          planSlug={subscription?.planSlug ?? "pro"}
          keysUsed={keysUsed}
          maxKeys={maxKeys}
          kpis={kpis}
          isLight={isLight}
        />

        <KeyGrid
          keys={keys}
          isLight={isLight}
          canAddKey={canAdd}
          quotaReached={quotaReached}
          onAddKey={() => setShowAddKey(true)}
          onDeposit={setDepositKeyId}
        />

        <PassGenerator
          keys={keys}
          distributors={initialData.distributors}
          isLight={isLight}
          onGenerate={useMockActions ? undefined : handleGeneratePass}
        />
      </main>

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
