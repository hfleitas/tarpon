// The app's data model, as TypeScript types.
//
// In a real Rayfin app these types are the OUTPUT of your `@entity()` classes in
// `rayfin/data/` (AmlCase, CreditReview, TreasuryAction, DigitalInitiative).
// Here we also declare them plainly so the preview mock is fully typed without
// pulling in @microsoft/rayfin-core.

/** AML Case Intelligence — investigator worklist (AML automation). */
export interface AmlCase {
  id: string;
  caseNumber: string;
  subject: string;
  reason: string; // Structuring | Counterparty Concern | Unusual Velocity | High-Risk Geography
  riskScore: number; // 0–100 (>= 80 == high severity)
  amount: number; // USD implicated
  priority: string; // High | Medium | Low
  status: string; // New | In Review | Escalated | SAR Filed | Cleared
  assignee: string;
  openedAt: Date;
  notes: string;
  user_id: string;
}

/** Credit Risk & Early-Warning reviews (risk discipline). */
export interface CreditReview {
  id: string;
  customerName: string;
  customerId: string;
  creditScore: number; // 300–850
  pd: number; // Probability of Default, %
  lgd: number; // Loss Given Default, %
  riskTier: string; // Low | Medium | High | Critical
  signal: string; // early-warning signal
  severity: string; // High | Medium | Low
  status: string; // Open | Monitoring | Action Taken | Closed
  exposure: number; // USD balance at risk
  reviewedAt: Date;
  notes: string;
  user_id: string;
}

/** Treasury & Liquidity actions (treasury modernization). */
export interface TreasuryAction {
  id: string;
  reference: string;
  actionType: string; // FX Hedge | Liquidity Transfer | Position Review | Wire Approval
  currency: string; // GBP | JPY | EUR | USD | CAD
  amount: number; // USD-equivalent
  liquidityBucket: string; // 0-7D | 8-30D | 31-90D | 90D+
  status: string; // Pending | Approved | Rejected | Executed
  approver: string;
  requestedAt: Date;
  notes: string;
  user_id: string;
}

/** Digital Efficiency initiatives (digital efficiency). */
export interface DigitalInitiative {
  id: string;
  name: string;
  channel: string; // Mobile | Web | Tablet
  category: string; // Adoption | Onboarding | BillPay | CardControls | Retention | Engagement
  metric: string; // DAU | MAU | Mobile Adoption % | Engagement Score
  targetValue: number;
  currentValue: number;
  status: string; // Planned | In Progress | Live | Complete
  owner: string;
  dueDate: Date;
  notes: string;
  user_id: string;
}

/** Maps entity name → row type, exactly like the real `FinSightAppSchema`. */
export type FinSightAppSchema = {
  AmlCase: AmlCase;
  CreditReview: CreditReview;
  TreasuryAction: TreasuryAction;
  DigitalInitiative: DigitalInitiative;
};
