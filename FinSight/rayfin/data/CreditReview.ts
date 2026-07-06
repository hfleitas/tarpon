// Credit Risk & Early-Warning Reviews — the operational complement to the Risk
// Overview / Early-Warning dashboards (risk discipline).
//
// The Fabric notebooks compute deterioration signals and risk tiers; this entity
// is the analyst's review record: confirm the tier, log the signal, decide an
// action, track exposure. Rayfin provisions a Fabric SQL Database from it.

import { entity, role, text, int, decimal, date, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class CreditReview {
  @uuid() id!: string;
  @text({ min: 1, max: 120 }) customerName!: string;
  @text({ min: 1, max: 32 }) customerId!: string;
  @int() creditScore!: number; // 300–850
  @decimal() pd!: number; // Probability of Default, %
  @decimal() lgd!: number; // Loss Given Default, %
  @text({ min: 1, max: 12 }) riskTier!: string; // Low | Medium | High | Critical
  @text({ min: 1, max: 60 }) signal!: string; // early-warning signal
  @text({ min: 1, max: 8 }) severity!: string; // High | Medium | Low
  // Open | Monitoring | Action Taken | Closed
  @text({ min: 1, max: 16 }) status!: string;
  @decimal() exposure!: number; // USD balance at risk
  @date() reviewedAt!: Date;
  @text({ min: 0, max: 600 }) notes!: string;
  @text() user_id!: string;
}
