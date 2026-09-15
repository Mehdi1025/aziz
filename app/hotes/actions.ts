"use server";

/**
 * Server Actions pour l'espace hôte (/hotes).
 * Prêtes à être branchées sur la BDD — réutilisent la logique admin existante.
 */

import {
  addKeyDeposit as adminAddKeyDeposit,
  createClientPassFromKey as adminCreateClientPassFromKey,
  depositKeyInLocker as adminDepositKeyInLocker,
} from "@/app/admin/landlord-actions";

export async function addKeyDeposit(input: {
  landlordId: string;
  propertyLabel: string;
  propertyAddress?: string;
  notes?: string;
}) {
  return adminAddKeyDeposit(input);
}

export async function depositKeyInLocker(input: {
  keyId: string;
  distributorId: string;
  boxNumber: number;
}) {
  return adminDepositKeyInLocker(input);
}

export async function createClientPassFromKey(input: {
  keyId: string;
  code: string;
  in: string;
  out: string;
}) {
  return adminCreateClientPassFromKey(input);
}
