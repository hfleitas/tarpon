// Data-access layer for the FinSight Operations Console.
//
// Every call is written against the exact @microsoft/rayfin-client API. In
// preview these run against the in-memory mock; with Rayfin env configured the
// same code hits the Fabric-backed data API.

import { client, getCurrentUser } from '../rayfin/client';
import type {
  AmlCase,
  CreditReview,
  TreasuryAction,
  DigitalInitiative,
} from '../rayfin/schema';

export type { AmlCase, CreditReview, TreasuryAction, DigitalInitiative };

const uid = () => getCurrentUser()?.id ?? 'local-user';
const amlCaseFields: (keyof AmlCase)[] = ['id', 'caseNumber', 'subject', 'reason', 'riskScore', 'amount', 'priority', 'status', 'assignee', 'openedAt', 'notes', 'user_id'];
const creditReviewFields: (keyof CreditReview)[] = ['id', 'customerName', 'customerId', 'creditScore', 'pd', 'lgd', 'riskTier', 'signal', 'severity', 'status', 'exposure', 'reviewedAt', 'notes', 'user_id'];
const treasuryActionFields: (keyof TreasuryAction)[] = ['id', 'reference', 'actionType', 'currency', 'amount', 'liquidityBucket', 'status', 'approver', 'requestedAt', 'notes', 'user_id'];
const digitalInitiativeFields: (keyof DigitalInitiative)[] = ['id', 'name', 'channel', 'category', 'metric', 'targetValue', 'currentValue', 'status', 'owner', 'dueDate', 'notes', 'user_id'];

// ── AML Case Intelligence ────────────────────────────────────────────────────
export async function getAmlCases(): Promise<AmlCase[]> {
  return client.data.AmlCase.select(amlCaseFields).orderBy({ openedAt: 'desc' }).execute();
}
export async function createAmlCase(
  input: Omit<AmlCase, 'id' | 'user_id' | 'openedAt' | 'caseNumber'> &
    Partial<Pick<AmlCase, 'caseNumber' | 'openedAt'>>,
): Promise<AmlCase> {
  return client.data.AmlCase.create({
    caseNumber: input.caseNumber ?? 'AML-' + Math.floor(10000 + Math.random() * 89999),
    openedAt: input.openedAt ?? new Date(),
    ...input,
    user_id: uid(),
  });
}
export async function updateAmlCase(id: string, patch: Partial<AmlCase>): Promise<void> {
  await client.data.AmlCase.update({ id }, patch);
}
export async function deleteAmlCase(id: string): Promise<void> {
  await client.data.AmlCase.delete({ id });
}

// ── Credit Risk & Early Warning ──────────────────────────────────────────────
export async function getCreditReviews(): Promise<CreditReview[]> {
  return client.data.CreditReview.select(creditReviewFields).orderBy({ reviewedAt: 'desc' }).execute();
}
export async function createCreditReview(
  input: Omit<CreditReview, 'id' | 'user_id' | 'reviewedAt'> &
    Partial<Pick<CreditReview, 'reviewedAt'>>,
): Promise<CreditReview> {
  return client.data.CreditReview.create({
    reviewedAt: input.reviewedAt ?? new Date(),
    ...input,
    user_id: uid(),
  });
}
export async function updateCreditReview(id: string, patch: Partial<CreditReview>): Promise<void> {
  await client.data.CreditReview.update({ id }, patch);
}
export async function deleteCreditReview(id: string): Promise<void> {
  await client.data.CreditReview.delete({ id });
}

// ── Treasury & Liquidity ─────────────────────────────────────────────────────
export async function getTreasuryActions(): Promise<TreasuryAction[]> {
  return client.data.TreasuryAction.select(treasuryActionFields).orderBy({ requestedAt: 'desc' }).execute();
}
export async function createTreasuryAction(
  input: Omit<TreasuryAction, 'id' | 'user_id' | 'requestedAt' | 'reference'> &
    Partial<Pick<TreasuryAction, 'reference' | 'requestedAt'>>,
): Promise<TreasuryAction> {
  return client.data.TreasuryAction.create({
    reference: input.reference ?? 'TRS-' + Math.floor(1000 + Math.random() * 8999),
    requestedAt: input.requestedAt ?? new Date(),
    ...input,
    user_id: uid(),
  });
}
export async function updateTreasuryAction(id: string, patch: Partial<TreasuryAction>): Promise<void> {
  await client.data.TreasuryAction.update({ id }, patch);
}
export async function deleteTreasuryAction(id: string): Promise<void> {
  await client.data.TreasuryAction.delete({ id });
}

// ── Digital Efficiency ───────────────────────────────────────────────────────
export async function getDigitalInitiatives(): Promise<DigitalInitiative[]> {
  return client.data.DigitalInitiative.select(digitalInitiativeFields).orderBy({ dueDate: 'asc' }).execute();
}
export async function createDigitalInitiative(
  input: Omit<DigitalInitiative, 'id' | 'user_id'>,
): Promise<DigitalInitiative> {
  return client.data.DigitalInitiative.create({ ...input, user_id: uid() });
}
export async function updateDigitalInitiative(id: string, patch: Partial<DigitalInitiative>): Promise<void> {
  await client.data.DigitalInitiative.update({ id }, patch);
}
export async function deleteDigitalInitiative(id: string): Promise<void> {
  await client.data.DigitalInitiative.delete({ id });
}
