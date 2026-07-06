// AML Case Intelligence — the operational complement to the AML dashboards.
//
// The Fabric AML notebooks/dashboards SURFACE anomalies (Structuring, Unusual
// Velocity, High-Risk Geography…). This entity is where an investigator ACTS on
// them: triage, assign, disposition (escalate / file SAR / clear). Rayfin
// provisions a Fabric SQL Database + typed data APIs from this class.
//
// In OpenLove's PREVIEW this file is not compiled (the preview uses the mock in
// src/rayfin/). It ships so the app is deploy-ready.

import { entity, role, text, int, decimal, date, uuid } from '@microsoft/rayfin-core';

@entity()
// Shared team queue: any authenticated bank user can read/act on the case book.
// (Swap to a policy like `claims.sub.eq(item.assigneeId)` for a private queue.)
@role('authenticated', '*')
export class AmlCase {
  @uuid() id!: string;
  @text({ min: 1, max: 32 }) caseNumber!: string;
  @text({ min: 1, max: 120 }) subject!: string;
  // Structuring | Counterparty Concern | Unusual Velocity | High-Risk Geography
  @text({ min: 1, max: 40 }) reason!: string;
  @int() riskScore!: number; // 0–100 (>= 80 == high severity)
  @decimal() amount!: number; // USD value implicated
  @text({ min: 1, max: 12 }) priority!: string; // High | Medium | Low
  // New | In Review | Escalated | SAR Filed | Cleared
  @text({ min: 1, max: 20 }) status!: string;
  @text({ min: 0, max: 80 }) assignee!: string;
  @date() openedAt!: Date;
  @text({ min: 0, max: 600 }) notes!: string;
  @text() user_id!: string;
}
