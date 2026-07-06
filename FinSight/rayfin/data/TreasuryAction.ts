// Treasury & Liquidity Actions — the operational complement to the Treasury
// Liquidity dashboards (treasury modernization).
//
// The dashboards show FX exposure, liquidity-by-bucket and currency mix; this
// entity is the actionable workflow: raise an FX hedge / liquidity transfer /
// wire approval, route it for approval, and mark it executed. Rayfin provisions
// a Fabric SQL Database from it.

import { entity, role, text, decimal, date, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')
export class TreasuryAction {
  @uuid() id!: string;
  @text({ min: 1, max: 32 }) reference!: string;
  // FX Hedge | Liquidity Transfer | Position Review | Wire Approval
  @text({ min: 1, max: 32 }) actionType!: string;
  @text({ min: 1, max: 8 }) currency!: string; // GBP | JPY | EUR | USD | CAD
  @decimal() amount!: number; // USD-equivalent
  @text({ min: 1, max: 8 }) liquidityBucket!: string; // 0-7D | 8-30D | 31-90D | 90D+
  // Pending | Approved | Rejected | Executed
  @text({ min: 1, max: 12 }) status!: string;
  @text({ min: 0, max: 80 }) approver!: string;
  @date() requestedAt!: Date;
  @text({ min: 0, max: 600 }) notes!: string;
  @text() user_id!: string;
}
