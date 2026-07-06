// Digital Efficiency Initiatives — the operational complement to the Digital
// Engagement dashboards (digital efficiency).
//
// The dashboards report DAU/MAU, mobile adoption and engagement score; this
// entity is the improvement backlog: initiatives that move those KPIs, each with
// a target vs current value, owner and due date. Rayfin provisions a Fabric SQL
// Database from it.

import { entity, role, text, decimal, date, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class DigitalInitiative {
  @uuid() id!: string;
  @text({ min: 1, max: 120 }) name!: string;
  @text({ min: 1, max: 8 }) channel!: string; // Mobile | Web | Tablet
  // Adoption | Onboarding | BillPay | CardControls | Retention | Engagement
  @text({ min: 1, max: 20 }) category!: string;
  // DAU | MAU | Mobile Adoption % | Engagement Score
  @text({ min: 1, max: 24 }) metric!: string;
  @decimal() targetValue!: number;
  @decimal() currentValue!: number;
  // Planned | In Progress | Live | Complete
  @text({ min: 1, max: 12 }) status!: string;
  @text({ min: 0, max: 80 }) owner!: string;
  @date() dueDate!: Date;
  @text({ min: 0, max: 600 }) notes!: string;
  @text() user_id!: string;
}
