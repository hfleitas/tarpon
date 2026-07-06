// Shared types for the FinSight Copilot — a grounded reasoning agent.
//
// The agent runs ENTIRELY over your live Rayfin data (the same four entities the
// console manages). In preview it reads the in-memory mock; after `rayfin up` it
// reads the Fabric SQL Database — the code is identical. Every figure it states
// is COMPUTED from real rows (weighted PD/LGD, 24h severity splits, FX
// concentration, DAU/MAU stickiness…), never invented — so it can explain and
// reason over the numbers the way the Fabric Copilot prompts do.

import type {
  AmlCase,
  CreditReview,
  TreasuryAction,
  DigitalInitiative,
} from '../rayfin/schema';

export type NavTarget = 'overview' | 'aml' | 'credit' | 'treasury' | 'digital';

/** A live read of every entity, taken fresh per question so answers reflect edits. */
export interface DataSnapshot {
  aml: AmlCase[];
  credit: CreditReview[];
  treasury: TreasuryAction[];
  digital: DigitalInitiative[];
}

/** One visible step in the agent's chain of reasoning (shown as it "thinks"). */
export interface ReasoningStep {
  label: string; // e.g. "Query AmlCase"
  detail: string; // e.g. "13 cases in scope"
  entity?: NavTarget; // colors the step dot + links it to a workspace
}

/** A metric chip in an answer (a computed KPI). */
export interface MetricChip {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}

/** A single bar in a mini bar chart. */
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  display?: string; // pre-formatted value label (overrides format)
}

/** A clickable citation that jumps to the workspace backing the claim. */
export interface Citation {
  label: string;
  sub?: string;
  nav: NavTarget;
}

/** The building blocks an answer is composed of (rendered in order). */
export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string } // supports **bold** inline
  | { kind: 'metrics'; items: MetricChip[] }
  | { kind: 'bars'; title?: string; data: BarDatum[]; format?: 'num' | 'usd' }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'callout'; tone: 'info' | 'warn' | 'good'; text: string }
  | { kind: 'citations'; items: Citation[] };

/** A complete grounded answer. */
export interface AgentAnswer {
  steps: ReasoningStep[];
  blocks: Block[];
  followups: string[];
}
