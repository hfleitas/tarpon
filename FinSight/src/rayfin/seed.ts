// Demo seed data for the PREVIEW mock only.
//
// These rows mirror the real numbers in the Truist Fabric demo README so the
// operational console feels connected to the analytical dashboards:
//   • AML reasons Structuring / Counterparty Concern / Unusual Velocity /
//     High-Risk Geography, high-severity at riskScore >= 80.
//   • Credit scores around ~575 with PD ~3.3% / LGD ~41.6% and evenly spread
//     early-warning severities.
//   • Treasury FX across GBP/JPY/EUR/USD/CAD and liquidity buckets 0-7D…90D+.
//   • Digital initiatives targeting DAU/MAU/Mobile Adoption/Engagement Score.
//
// Against a real Fabric backend this file is never used — data comes from the
// Lakehouse-derived tables and anything users create in the app.

import type { MockRayfinClient } from './mockClient';
import type { FinSightAppSchema } from './schema';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000);
const daysAgo = (d: number) => new Date(now - d * 86_400_000);

type Client = MockRayfinClient<FinSightAppSchema>;

const amlCases: Array<Omit<FinSightAppSchema['AmlCase'], 'id'>> = [
  { caseNumber: 'AML-24118', subject: 'Rapid structuring across 6 accounts', reason: 'Structuring', riskScore: 92, amount: 486300, priority: 'High', status: 'Escalated', assignee: 'D. Okafor', openedAt: hoursAgo(3), notes: 'Sub-$10k deposits across linked accounts within 48h. Recommend SAR.', user_id: 'seed' },
  { caseNumber: 'AML-24117', subject: 'Counterparty on internal watchlist', reason: 'Counterparty Concern', riskScore: 88, amount: 1250000, priority: 'High', status: 'In Review', assignee: 'M. Alvarez', openedAt: hoursAgo(5), notes: 'Wire to entity matching sanctions-adjacent counterparty.', user_id: 'seed' },
  { caseNumber: 'AML-24116', subject: 'Velocity spike vs 90-day baseline', reason: 'Unusual Velocity', riskScore: 84, amount: 342750, priority: 'High', status: 'New', assignee: '', openedAt: hoursAgo(7), notes: '', user_id: 'seed' },
  { caseNumber: 'AML-24115', subject: 'Funds routed via high-risk geography', reason: 'High-Risk Geography', riskScore: 81, amount: 675000, priority: 'High', status: 'New', assignee: '', openedAt: hoursAgo(9), notes: '', user_id: 'seed' },
  { caseNumber: 'AML-24114', subject: 'Layering pattern, commercial client', reason: 'Structuring', riskScore: 76, amount: 219400, priority: 'Medium', status: 'In Review', assignee: 'D. Okafor', openedAt: hoursAgo(12), notes: 'Awaiting relationship-manager context.', user_id: 'seed' },
  { caseNumber: 'AML-24113', subject: 'Cross-border velocity anomaly', reason: 'Unusual Velocity', riskScore: 72, amount: 158900, priority: 'Medium', status: 'In Review', assignee: 'S. Chen', openedAt: hoursAgo(16), notes: '', user_id: 'seed' },
  { caseNumber: 'AML-24112', subject: 'Repeated near-threshold cash', reason: 'Structuring', riskScore: 69, amount: 94200, priority: 'Medium', status: 'New', assignee: '', openedAt: hoursAgo(20), notes: '', user_id: 'seed' },
  { caseNumber: 'AML-24111', subject: 'New counterparty, rapid onboarding', reason: 'Counterparty Concern', riskScore: 64, amount: 512000, priority: 'Medium', status: 'Monitoring', assignee: 'M. Alvarez', openedAt: hoursAgo(23), notes: 'Monitoring for follow-on activity.', user_id: 'seed' },
  { caseNumber: 'AML-24109', subject: 'Geography flag, retail card', reason: 'High-Risk Geography', riskScore: 58, amount: 8600, priority: 'Low', status: 'Cleared', assignee: 'S. Chen', openedAt: daysAgo(2), notes: 'Travel confirmed by customer. False positive.', user_id: 'seed' },
  { caseNumber: 'AML-24108', subject: 'Velocity flag on payroll account', reason: 'Unusual Velocity', riskScore: 46, amount: 33100, priority: 'Low', status: 'Cleared', assignee: 'D. Okafor', openedAt: daysAgo(2), notes: 'Explained by quarterly bonus run.', user_id: 'seed' },
  { caseNumber: 'AML-24104', subject: 'Structuring — filed SAR', reason: 'Structuring', riskScore: 90, amount: 731500, priority: 'High', status: 'SAR Filed', assignee: 'M. Alvarez', openedAt: daysAgo(3), notes: 'SAR reference FIN-2026-0091 submitted.', user_id: 'seed' },
  { caseNumber: 'AML-24098', subject: 'Counterparty concern — SAR filed', reason: 'Counterparty Concern', riskScore: 86, amount: 1490000, priority: 'High', status: 'SAR Filed', assignee: 'D. Okafor', openedAt: daysAgo(4), notes: 'SAR reference FIN-2026-0088.', user_id: 'seed' },
];

const creditReviews: Array<Omit<FinSightAppSchema['CreditReview'], 'id'>> = [
  { customerName: 'Harbor Freight Logistics LLC', customerId: 'CUST-000123', creditScore: 512, pd: 6.8, lgd: 47.5, riskTier: 'Critical', signal: 'Utilization spike + 30d delinquency', severity: 'High', status: 'Open', exposure: 2450000, reviewedAt: hoursAgo(4), notes: 'Moved from Medium → Critical this cycle.', user_id: 'seed' },
  { customerName: 'Delta Ridge Manufacturing', customerId: 'CUST-004871', creditScore: 528, pd: 5.9, lgd: 44.0, riskTier: 'High', signal: 'Declining deposit balance trend', severity: 'High', status: 'Monitoring', exposure: 1780000, reviewedAt: hoursAgo(8), notes: '', user_id: 'seed' },
  { customerName: 'Piedmont Retail Group', customerId: 'CUST-002045', creditScore: 549, pd: 4.7, lgd: 42.1, riskTier: 'High', signal: 'Covenant headroom < 10%', severity: 'High', status: 'Open', exposure: 3120000, reviewedAt: hoursAgo(11), notes: 'RM engaged; requesting updated financials.', user_id: 'seed' },
  { customerName: 'Coastal Union Wholesale', customerId: 'CUST-006612', creditScore: 566, pd: 3.9, lgd: 41.0, riskTier: 'Medium', signal: 'Rising DSO', severity: 'Medium', status: 'Monitoring', exposure: 940000, reviewedAt: hoursAgo(18), notes: '', user_id: 'seed' },
  { customerName: 'Sunbelt Auto Holdings', customerId: 'CUST-003390', creditScore: 574, pd: 3.3, lgd: 41.6, riskTier: 'Medium', signal: 'Score drift −18 pts (90d)', severity: 'Medium', status: 'Action Taken', exposure: 1210000, reviewedAt: daysAgo(1), notes: 'Reduced limit by 15%.', user_id: 'seed' },
  { customerName: 'Granite Peak Services', customerId: 'CUST-005218', creditScore: 588, pd: 2.9, lgd: 39.8, riskTier: 'Medium', signal: 'Sector downgrade', severity: 'Medium', status: 'Monitoring', exposure: 660000, reviewedAt: daysAgo(1), notes: '', user_id: 'seed' },
  { customerName: 'Riverbend Health Partners', customerId: 'CUST-007744', creditScore: 612, pd: 2.1, lgd: 38.2, riskTier: 'Low', signal: 'Late-payment single event', severity: 'Low', status: 'Closed', exposure: 415000, reviewedAt: daysAgo(2), notes: 'One-off; resolved same week.', user_id: 'seed' },
  { customerName: 'Magnolia Capital Advisors', customerId: 'CUST-001902', creditScore: 634, pd: 1.7, lgd: 36.9, riskTier: 'Low', signal: 'Routine annual review', severity: 'Low', status: 'Closed', exposure: 285000, reviewedAt: daysAgo(3), notes: '', user_id: 'seed' },
  { customerName: 'Ironwood Construction Co', customerId: 'CUST-008110', creditScore: 505, pd: 7.4, lgd: 48.9, riskTier: 'Critical', signal: 'Missed 2 consecutive payments', severity: 'High', status: 'Open', exposure: 3980000, reviewedAt: hoursAgo(6), notes: 'Escalated to workout team.', user_id: 'seed' },
  { customerName: 'Beacon Street Hospitality', customerId: 'CUST-009457', creditScore: 559, pd: 4.2, lgd: 41.9, riskTier: 'Medium', signal: 'Seasonal cash-flow gap', severity: 'Medium', status: 'Monitoring', exposure: 720000, reviewedAt: daysAgo(2), notes: '', user_id: 'seed' },
];

const treasuryActions: Array<Omit<FinSightAppSchema['TreasuryAction'], 'id'>> = [
  { reference: 'TRS-8841', actionType: 'FX Hedge', currency: 'GBP', amount: 22940000000, liquidityBucket: '31-90D', status: 'Pending', approver: '', requestedAt: hoursAgo(2), notes: 'Hedge GBP exposure ahead of BoE decision.', user_id: 'seed' },
  { reference: 'TRS-8840', actionType: 'FX Hedge', currency: 'JPY', amount: 22920000000, liquidityBucket: '8-30D', status: 'Approved', approver: 'T. Whitfield', requestedAt: hoursAgo(6), notes: 'Rolling forward existing JPY hedge.', user_id: 'seed' },
  { reference: 'TRS-8839', actionType: 'Liquidity Transfer', currency: 'USD', amount: 28900000000, liquidityBucket: '0-7D', status: 'Executed', approver: 'T. Whitfield', requestedAt: hoursAgo(10), notes: 'Top-up 0-7D bucket to target coverage.', user_id: 'seed' },
  { reference: 'TRS-8838', actionType: 'Position Review', currency: 'EUR', amount: 22770000000, liquidityBucket: '90D+', status: 'Pending', approver: '', requestedAt: hoursAgo(14), notes: 'Review EUR concentration vs policy limit.', user_id: 'seed' },
  { reference: 'TRS-8837', actionType: 'FX Hedge', currency: 'CAD', amount: 22180000000, liquidityBucket: '31-90D', status: 'Approved', approver: 'L. Nakamura', requestedAt: daysAgo(1), notes: '', user_id: 'seed' },
  { reference: 'TRS-8836', actionType: 'Wire Approval', currency: 'USD', amount: 145000000, liquidityBucket: '0-7D', status: 'Pending', approver: '', requestedAt: hoursAgo(1), notes: 'Large commercial wire — dual approval required.', user_id: 'seed' },
  { reference: 'TRS-8834', actionType: 'Liquidity Transfer', currency: 'USD', amount: 28300000000, liquidityBucket: '8-30D', status: 'Executed', approver: 'L. Nakamura', requestedAt: daysAgo(1), notes: '', user_id: 'seed' },
  { reference: 'TRS-8829', actionType: 'FX Hedge', currency: 'GBP', amount: 380000000, liquidityBucket: '8-30D', status: 'Rejected', approver: 'T. Whitfield', requestedAt: daysAgo(2), notes: 'Duplicate of TRS-8841; consolidated.', user_id: 'seed' },
];

const digitalInitiatives: Array<Omit<FinSightAppSchema['DigitalInitiative'], 'id'>> = [
  { name: 'Mobile onboarding redesign', channel: 'Mobile', category: 'Onboarding', metric: 'Mobile Adoption %', targetValue: 45, currentValue: 37.93, status: 'In Progress', owner: 'A. Rivera', dueDate: daysAgo(-21), notes: 'Cut steps 7→4; A/B live to 20%.', user_id: 'seed' },
  { name: 'Push-notification re-engagement', channel: 'Mobile', category: 'Retention', metric: 'DAU', targetValue: 6000, currentValue: 4876, status: 'In Progress', owner: 'J. Park', dueDate: daysAgo(-14), notes: 'Lifecycle nudges for dormant users.', user_id: 'seed' },
  { name: 'BillPay one-tap re-pay', channel: 'Mobile', category: 'BillPay', metric: 'Engagement Score', targetValue: 4.0, currentValue: 3.0, status: 'Live', owner: 'A. Rivera', dueDate: daysAgo(3), notes: 'Shipped to 100%.', user_id: 'seed' },
  { name: 'Card controls discovery banner', channel: 'Web', category: 'CardControls', metric: 'MAU', targetValue: 11000, currentValue: 10000, status: 'Planned', owner: 'K. Osei', dueDate: daysAgo(-30), notes: '', user_id: 'seed' },
  { name: 'Web → app handoff for transfers', channel: 'Web', category: 'Adoption', metric: 'Mobile Adoption %', targetValue: 42, currentValue: 37.93, status: 'In Progress', owner: 'J. Park', dueDate: daysAgo(-10), notes: 'Deep-link transfers to app.', user_id: 'seed' },
  { name: 'Tablet dashboard for advisors', channel: 'Tablet', category: 'Engagement', metric: 'Engagement Score', targetValue: 3.8, currentValue: 2.33, status: 'Planned', owner: 'K. Osei', dueDate: daysAgo(-45), notes: '', user_id: 'seed' },
  { name: 'Biometric quick-login', channel: 'Mobile', category: 'Retention', metric: 'DAU', targetValue: 5500, currentValue: 4876, status: 'Complete', owner: 'A. Rivera', dueDate: daysAgo(9), notes: 'Login friction down 22%.', user_id: 'seed' },
  { name: 'Treasury approval mobile flow', channel: 'Mobile', category: 'Adoption', metric: 'Engagement Score', targetValue: 3.5, currentValue: 3.0, status: 'In Progress', owner: 'K. Osei', dueDate: daysAgo(-18), notes: 'Approvers can action wires on mobile.', user_id: 'seed' },
];

let seeded = false;

/** Idempotently load the demo dataset into the in-memory mock. */
export function seedMock(client: Client): void {
  if (seeded) return;
  seeded = true;
  for (const r of amlCases) void client.data.AmlCase.create(r);
  for (const r of creditReviews) void client.data.CreditReview.create(r);
  for (const r of treasuryActions) void client.data.TreasuryAction.create(r);
  for (const r of digitalInitiatives) void client.data.DigitalInitiative.create(r);
}
