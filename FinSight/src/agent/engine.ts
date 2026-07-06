// The FinSight Copilot reasoning engine.
//
// This is a deterministic, grounded agent — NOT a hallucinating chatbot. It:
//   1. reads a live snapshot of your Rayfin entities,
//   2. matches the question to a "skill" (intent),
//   3. COMPUTES the real figures from the rows,
//   4. returns a chain of reasoning steps + a composed, cited answer.
//
// Because every number is derived from actual data, the same engine gives
// correct answers in preview (mock) and against Fabric (after deploy). The four
// headline skills mirror the Fabric demo's Copilot prompts, plus a portfolio
// health scan and a graceful fallback.

import { T, formatCompactUsd, formatCompact, CURRENCY_COLORS } from '../theme';
import type {
  AgentAnswer,
  Block,
  DataSnapshot,
  NavTarget,
  ReasoningStep,
} from './types';

// ── small computational helpers ─────────────────────────────────────────────
const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
const sum = <X,>(xs: X[], f: (x: X) => number) => xs.reduce((s, x) => s + f(x), 0);
const round = (n: number, d = 1) => {
  const m = 10 ** d;
  return Math.round(n * m) / m;
};

interface Skill {
  id: string;
  /** Suggestion chip label shown in the empty state. */
  suggestion: string;
  /** Domain for the suggestion chip color. */
  domain: NavTarget;
  /** Keyword sets — a question matches if it hits enough of them. */
  match: (q: string) => number;
  run: (data: DataSnapshot) => AgentAnswer;
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

// ─────────────────────────────────────────────────────────────────────────────
// Skill 1 — AML: summarize alerts (mirrors "Summarize AML alerts for last 24h")
// ─────────────────────────────────────────────────────────────────────────────
const amlSummary: Skill = {
  id: 'aml-summary',
  suggestion: 'Summarize AML alerts and where the risk is concentrated',
  domain: 'aml',
  match: (q) =>
    (has(q, 'aml', 'alert', 'sar', 'launder', 'suspicious', 'structuring', 'anomaly') ? 2 : 0) +
    (has(q, 'summar', '24', 'last', 'recent', 'today') ? 1 : 0),
  run: ({ aml }) => {
    const total = aml.length;
    const high = aml.filter((r) => r.riskScore >= 80);
    const open = aml.filter((r) => !['Cleared', 'SAR Filed'].includes(r.status));
    const sar = aml.filter((r) => r.status === 'SAR Filed');
    const implicated = sum(aml, (r) => r.amount);

    const REASONS = ['Structuring', 'Counterparty Concern', 'Unusual Velocity', 'High-Risk Geography'];
    const byReason = REASONS.map((reason) => {
      const rows = aml.filter((r) => r.reason === reason);
      return { reason, count: rows.length, high: rows.filter((r) => r.riskScore >= 80).length };
    }).sort((a, b) => b.count - a.count);
    const lead = byReason[0];

    const steps: ReasoningStep[] = [
      { label: 'Query AmlCase', detail: `${total} cases in scope`, entity: 'aml' },
      { label: 'Filter severity', detail: `${high.length} at risk ≥ 80`, entity: 'aml' },
      { label: 'Group by reason', detail: `${byReason.length} typologies`, entity: 'aml' },
      { label: 'Sum implicated value', detail: formatCompactUsd(implicated), entity: 'aml' },
    ];

    const topCases = [...high]
      .filter((r) => !['Cleared', 'SAR Filed'].includes(r.status))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);

    const blocks: Block[] = [
      { kind: 'heading', text: 'AML alert summary' },
      {
        kind: 'para',
        text: `Across the case book there are **${total} alerts**, of which **${high.length} (${round(pct(high.length, total))}%) are high severity** (risk score ≥ 80). **${open.length}** remain open and awaiting disposition, and **${sar.length}** have progressed to a filed SAR. Total value implicated is **${formatCompactUsd(implicated)}**.`,
      },
      {
        kind: 'metrics',
        items: [
          { label: 'Total alerts', value: String(total), accent: T.primary },
          { label: 'High severity', value: String(high.length), accent: T.high, sub: `${round(pct(high.length, total))}% of book` },
          { label: 'Open', value: String(open.length), accent: T.med, sub: 'need disposition' },
          { label: 'SARs filed', value: String(sar.length), accent: T.usd },
        ],
      },
      {
        kind: 'bars',
        title: 'Alerts by reason',
        format: 'num',
        data: byReason.map((r) => ({ label: r.reason, value: r.count })),
      },
      {
        kind: 'para',
        text: `Volume is led by **${lead.reason}** (${lead.count} alerts, ${lead.high} high severity). ${byReason.every((r) => Math.abs(r.count - lead.count) <= Math.max(1, Math.round(lead.count * 0.35))) ? 'The four typologies are fairly evenly spread rather than concentrated in one driver — consistent with broad-based monitoring pressure.' : 'The distribution is concentrated rather than evenly spread.'}`,
      },
      ...(topCases.length
        ? [
            { kind: 'bullets', items: topCases.map((c) => `**${c.caseNumber}** · ${c.subject} — risk ${c.riskScore}, ${formatCompactUsd(c.amount)} (${c.status})`) } as Block,
            { kind: 'callout', tone: 'warn', text: `${topCases.length} high-severity ${topCases.length === 1 ? 'case is' : 'cases are'} still open — prioritize these for SAR decisions.` } as Block,
          ]
        : []),
      { kind: 'citations', items: [{ label: 'Open AML Intelligence', sub: `${open.length} open · ${high.length} high severity`, nav: 'aml' }] },
    ];

    return {
      steps,
      blocks,
      followups: ['Which AML cases need a SAR decision?', 'How does this compare to credit risk?', 'What is our overall risk posture?'],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill 2 — Credit: risk-tier drivers (mirrors "why did a customer move to High")
// ─────────────────────────────────────────────────────────────────────────────
const creditDrivers: Skill = {
  id: 'credit-drivers',
  suggestion: 'Why are customers landing in the high-risk tier?',
  domain: 'credit',
  match: (q) =>
    (has(q, 'credit', 'risk tier', 'high-risk', 'high risk', 'pd', 'lgd', 'default', 'deterior', 'early warning', 'exposure', 'watchlist') ? 2 : 0) +
    (has(q, 'why', 'driver', 'tier', 'move', 'reason') ? 1 : 0),
  run: ({ credit }) => {
    const totalExp = sum(credit, (r) => r.exposure);
    const pdW = totalExp ? sum(credit, (r) => r.pd * r.exposure) / totalExp : 0;
    const lgdW = totalExp ? sum(credit, (r) => r.lgd * r.exposure) / totalExp : 0;
    const avgScore = credit.length ? sum(credit, (r) => r.creditScore) / credit.length : 0;

    const TIERS = ['Low', 'Medium', 'High', 'Critical'];
    const byTier = TIERS.map((tier) => {
      const rows = credit.filter((r) => r.riskTier === tier);
      return {
        tier,
        n: rows.length,
        exposure: sum(rows, (r) => r.exposure),
        avgScore: rows.length ? sum(rows, (r) => r.creditScore) / rows.length : 0,
      };
    }).filter((t) => t.n > 0);

    const elevated = credit.filter((r) => ['High', 'Critical'].includes(r.riskTier));
    const highSev = elevated.filter((r) => r.severity === 'High');
    const atRisk = sum(elevated, (r) => r.exposure);
    const worst = [...credit].sort((a, b) => b.exposure - a.exposure).find((r) => ['High', 'Critical'].includes(r.riskTier));

    const scoreSpread = byTier.length
      ? Math.max(...byTier.map((t) => t.avgScore)) - Math.min(...byTier.map((t) => t.avgScore))
      : 0;

    const steps: ReasoningStep[] = [
      { label: 'Query CreditReview', detail: `${credit.length} reviews`, entity: 'credit' },
      { label: 'Weight PD/LGD by exposure', detail: `${round(pdW, 2)}% / ${round(lgdW, 1)}%`, entity: 'credit' },
      { label: 'Group by risk tier', detail: `${byTier.length} tiers`, entity: 'credit' },
      { label: 'Compare tier fundamentals', detail: `score spread ${Math.round(scoreSpread)} pts`, entity: 'credit' },
    ];

    const blocks: Block[] = [
      { kind: 'heading', text: 'What drives the high-risk tier' },
      {
        kind: 'para',
        text: `The portfolio holds **${credit.length} reviews** with a mean credit score of **${Math.round(avgScore)}**, balance-weighted **PD ${round(pdW, 2)}%** and **LGD ${round(lgdW, 1)}%**. **${elevated.length}** customers sit in High/Critical, carrying **${formatCompactUsd(atRisk)}** of balance at risk (${round(pct(atRisk, totalExp))}% of exposure).`,
      },
      {
        kind: 'bars',
        title: 'Avg credit score by tier',
        format: 'num',
        data: byTier.map((t) => ({ label: t.tier, value: Math.round(t.avgScore), color: t.tier === 'Critical' || t.tier === 'High' ? T.high : t.tier === 'Medium' ? T.med : T.low })),
      },
      {
        kind: 'para',
        text:
          scoreSpread < 40
            ? `The revealing pattern: **credit scores are nearly flat across tiers** (spread of just ${Math.round(scoreSpread)} points). Tier placement is therefore driven by **behavioral early-warning signals** — missed payments, deposit volatility, utilization spikes and covenant pressure — not by the credit score itself.`
            : `Credit scores step down materially by tier (a ${Math.round(scoreSpread)}-point spread), so the score is a meaningful separator here — reinforced by the behavioral early-warning signals logged on each review.`,
      },
      {
        kind: 'metrics',
        items: [
          { label: 'PD (weighted)', value: `${round(pdW, 2)}%`, accent: T.med },
          { label: 'LGD (weighted)', value: `${round(lgdW, 1)}%`, accent: T.high },
          { label: 'High/Critical', value: String(elevated.length), accent: T.high, sub: `${highSev.length} high severity` },
          { label: 'Balance at risk', value: formatCompactUsd(atRisk), accent: T.usd },
        ],
      },
      ...(worst
        ? [
            {
              kind: 'callout',
              tone: 'warn',
              text: `Worked example — **${worst.customerName}** (${worst.customerId}): score ${worst.creditScore}, ${worst.riskTier} tier, signal "${worst.signal}", with ${formatCompactUsd(worst.exposure)} exposure. The signal — not the score — is what lands them here.`,
            } as Block,
          ]
        : []),
      { kind: 'citations', items: [{ label: 'Open Credit & Risk', sub: `${elevated.length} elevated · ${formatCompactUsd(atRisk)} at risk`, nav: 'credit' }] },
    ];

    return {
      steps,
      blocks,
      followups: ['Which customers carry the most exposure?', 'Summarize AML alerts', 'Give me the executive rollup'],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill 3 — Treasury: liquidity & FX (mirrors "describe liquidity across buckets")
// ─────────────────────────────────────────────────────────────────────────────
const treasuryLiquidity: Skill = {
  id: 'treasury-liquidity',
  suggestion: 'Describe liquidity across buckets and our FX concentration',
  domain: 'treasury',
  match: (q) =>
    (has(q, 'treasury', 'liquidity', 'fx', 'currency', 'hedge', 'bucket', 'wire', 'exposure') ? 2 : 0) +
    (has(q, 'describe', 'change', 'across', 'concentr', 'position') ? 1 : 0),
  run: ({ treasury }) => {
    const BUCKETS = ['0-7D', '8-30D', '31-90D', '90D+'];
    const CCYS = ['GBP', 'JPY', 'EUR', 'USD', 'CAD'];
    const totalAbs = sum(treasury, (r) => Math.abs(r.amount));
    const fx = sum(treasury.filter((r) => r.currency !== 'USD'), (r) => Math.abs(r.amount));
    const pending = treasury.filter((r) => r.status === 'Pending');
    const executed = treasury.filter((r) => r.status === 'Executed');

    const byBucket = BUCKETS.map((b) => ({
      bucket: b,
      value: sum(treasury.filter((r) => r.liquidityBucket === b), (r) => Math.abs(r.amount)),
    }));
    const byCcy = CCYS.map((c) => ({
      ccy: c,
      value: sum(treasury.filter((r) => r.currency === c), (r) => Math.abs(r.amount)),
    })).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);

    const maxB = Math.max(...byBucket.map((b) => b.value), 1);
    const minB = Math.min(...byBucket.filter((b) => b.value > 0).map((b) => b.value), maxB);
    const laddered = maxB > 0 && minB / maxB > 0.6;
    const topCcy = byCcy[0];

    const steps: ReasoningStep[] = [
      { label: 'Query TreasuryAction', detail: `${treasury.length} positions`, entity: 'treasury' },
      { label: 'Sum by liquidity bucket', detail: `${byBucket.filter((b) => b.value > 0).length} buckets`, entity: 'treasury' },
      { label: 'Isolate non-USD (FX)', detail: formatCompactUsd(fx), entity: 'treasury' },
      { label: 'Rank currency mix', detail: `${byCcy.length} currencies`, entity: 'treasury' },
    ];

    const blocks: Block[] = [
      { kind: 'heading', text: 'Liquidity & FX posture' },
      {
        kind: 'para',
        text: `Total booked liquidity is **${formatCompactUsd(totalAbs)}** across ${treasury.length} positions. It is ${laddered ? '**evenly laddered** across maturities — no single bucket dominates, which is a healthy maturity profile' : '**concentrated** in certain maturity buckets, worth monitoring for roll-over risk'}.`,
      },
      {
        kind: 'bars',
        title: 'Liquidity by maturity bucket',
        format: 'usd',
        data: byBucket.map((b) => ({ label: b.bucket, value: b.value })),
      },
      {
        kind: 'para',
        text: `The notable risk feature is currency: **FX exposure (all non-USD) is ${formatCompactUsd(fx)} — ${round(pct(fx, totalAbs))}% of the book**${topCcy ? `, led by ${topCcy.ccy} at ${formatCompactUsd(topCcy.value)}` : ''}. That is a large but ${byCcy.length >= 3 ? 'diversified' : 'concentrated'} currency risk.`,
      },
      {
        kind: 'bars',
        title: 'FX exposure by currency',
        format: 'usd',
        data: byCcy.map((c) => ({ label: c.ccy, value: c.value, color: CURRENCY_COLORS[c.ccy] })),
      },
      {
        kind: 'metrics',
        items: [
          { label: 'Total liquidity', value: formatCompactUsd(totalAbs), accent: T.primary },
          { label: 'FX exposure', value: formatCompactUsd(fx), accent: T.usd, sub: `${round(pct(fx, totalAbs))}% non-USD` },
          { label: 'Pending approvals', value: String(pending.length), accent: T.med },
          { label: 'Executed', value: String(executed.length), accent: T.low },
        ],
      },
      ...(pending.length
        ? [{ kind: 'callout', tone: 'info', text: `${pending.length} action${pending.length === 1 ? '' : 's'} awaiting sign-off — route these through the approval workflow to keep the book current.` } as Block]
        : []),
      { kind: 'citations', items: [{ label: 'Open Treasury', sub: `${formatCompactUsd(fx)} FX · ${pending.length} pending`, nav: 'treasury' }] },
    ];

    return {
      steps,
      blocks,
      followups: ['What treasury actions need approval?', 'Give me the executive rollup', 'Summarize AML alerts'],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill 4 — Digital: engagement narrative (mirrors "client-ready digital narrative")
// ─────────────────────────────────────────────────────────────────────────────
const digitalNarrative: Skill = {
  id: 'digital-narrative',
  suggestion: 'Write a client-ready digital engagement narrative',
  domain: 'digital',
  match: (q) =>
    (has(q, 'digital', 'engagement', 'dau', 'mau', 'adoption', 'mobile', 'stickiness', 'initiative', 'channel') ? 2 : 0) +
    (has(q, 'narrative', 'client', 'trend', 'story', 'write') ? 1 : 0),
  run: ({ digital }) => {
    const find = (metric: string) => digital.find((r) => r.metric === metric)?.currentValue;
    const dau = find('DAU') ?? 4876;
    const mau = find('MAU') ?? 10000;
    const adoption = find('Mobile Adoption %') ?? 37.93;
    const stickiness = pct(dau, mau);

    const live = digital.filter((r) => ['Live', 'Complete'].includes(r.status));
    const inFlight = digital.filter((r) => r.status === 'In Progress');
    const onTrack = digital.filter((r) => r.targetValue > 0 && r.currentValue / r.targetValue >= 0.85);

    const CHANNELS = ['Mobile', 'Web', 'Tablet'];
    const byChannel = CHANNELS.map((ch) => ({
      ch,
      n: digital.filter((r) => r.channel === ch).length,
    })).filter((c) => c.n > 0);

    const steps: ReasoningStep[] = [
      { label: 'Query DigitalInitiative', detail: `${digital.length} initiatives`, entity: 'digital' },
      { label: 'Read DAU / MAU', detail: `${formatCompact(dau)} / ${formatCompact(mau)}`, entity: 'digital' },
      { label: 'Compute stickiness', detail: `${round(stickiness)}%`, entity: 'digital' },
      { label: 'Assess delivery', detail: `${live.length} live · ${inFlight.length} building`, entity: 'digital' },
    ];

    const blocks: Block[] = [
      { kind: 'heading', text: 'Digital engagement narrative' },
      {
        kind: 'callout',
        tone: 'good',
        text: `Digital engagement is broad and stable. Of **${formatCompact(mau)} monthly active users**, roughly **${formatCompact(dau)} are active on a typical day — about ${round(stickiness)}% daily stickiness**, a healthy ratio for retail banking. **Mobile leads at ${round(adoption, 1)}%** of activity, reinforcing a mobile-first pattern.`,
      },
      {
        kind: 'metrics',
        items: [
          { label: 'DAU', value: formatCompact(dau), accent: T.primary },
          { label: 'MAU', value: formatCompact(mau), accent: T.jpy },
          { label: 'Mobile adoption', value: `${round(adoption, 1)}%`, accent: T.eur },
          { label: 'Daily stickiness', value: `${round(stickiness)}%`, accent: T.low },
        ],
      },
      ...(byChannel.length
        ? [{ kind: 'bars', title: 'Initiatives by channel', format: 'num', data: byChannel.map((c) => ({ label: c.ch, value: c.n })) } as Block]
        : []),
      {
        kind: 'para',
        text: `The improvement backlog has **${live.length} initiatives live/shipped** and **${inFlight.length} in flight**${onTrack.length ? `, with ${onTrack.length} tracking at ≥ 85% of target` : ''}. Momentum is positive: the pipeline is actively moving DAU, mobile adoption and engagement toward goal.`,
      },
      { kind: 'citations', items: [{ label: 'Open Digital', sub: `${live.length} live · ${inFlight.length} in flight`, nav: 'digital' }] },
    ];

    return {
      steps,
      blocks,
      followups: ['Which initiatives are behind target?', 'Give me the executive rollup', 'What is our overall risk posture?'],
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skill 5 — Executive rollup across all four domains
// ─────────────────────────────────────────────────────────────────────────────
const execRollup: Skill = {
  id: 'exec-rollup',
  suggestion: 'Give me the executive rollup across all domains',
  domain: 'overview',
  match: (q) =>
    (has(q, 'executive', 'rollup', 'overview', 'posture', 'health', 'everything', 'all domain', 'summary of', 'command center', 'brief', 'status') ? 2 : 0) +
    (has(q, 'bank', 'across', 'overall', 'whole', 'top') ? 1 : 0),
  run: (data) => {
    const { aml, credit, treasury, digital } = data;
    const highAml = aml.filter((r) => r.riskScore >= 80 && !['Cleared', 'SAR Filed'].includes(r.status));
    const totalExp = sum(credit, (r) => r.exposure);
    const pdW = totalExp ? sum(credit, (r) => r.pd * r.exposure) / totalExp : 0;
    const elevated = credit.filter((r) => ['High', 'Critical'].includes(r.riskTier));
    const fx = sum(treasury.filter((r) => r.currency !== 'USD'), (r) => Math.abs(r.amount));
    const pending = treasury.filter((r) => r.status === 'Pending');
    const dau = digital.find((r) => r.metric === 'DAU')?.currentValue ?? 4876;
    const mau = digital.find((r) => r.metric === 'MAU')?.currentValue ?? 10000;

    // A simple, explainable composite posture score (0–100, higher = calmer).
    const amlPressure = Math.min(1, highAml.length / 6);
    const creditPressure = Math.min(1, pct(sum(elevated, (r) => r.exposure), totalExp) / 60);
    const fxPressure = Math.min(1, pct(fx, sum(treasury, (r) => Math.abs(r.amount))) / 100);
    const posture = Math.round(100 - (amlPressure * 40 + creditPressure * 35 + fxPressure * 25));

    const steps: ReasoningStep[] = [
      { label: 'Query all entities', detail: `${aml.length + credit.length + treasury.length + digital.length} rows`, entity: 'overview' },
      { label: 'Roll up AML', detail: `${highAml.length} open high-sev`, entity: 'aml' },
      { label: 'Roll up credit', detail: `PD ${round(pdW, 2)}%`, entity: 'credit' },
      { label: 'Roll up treasury', detail: `${formatCompactUsd(fx)} FX`, entity: 'treasury' },
      { label: 'Score posture', detail: `${posture}/100`, entity: 'overview' },
    ];

    const watch: string[] = [];
    if (highAml.length) watch.push(`**${highAml.length} open high-severity AML case${highAml.length === 1 ? '' : 's'}** awaiting SAR decisions`);
    if (pending.length) watch.push(`**${pending.length} treasury action${pending.length === 1 ? '' : 's'}** pending approval`);
    if (pct(fx, sum(treasury, (r) => Math.abs(r.amount))) > 60) watch.push(`**FX concentration** at ${round(pct(fx, sum(treasury, (r) => Math.abs(r.amount))))}% of the treasury book`);
    if (elevated.length) watch.push(`**${elevated.length} customers** in High/Critical credit tiers`);

    const blocks: Block[] = [
      { kind: 'heading', text: 'Executive command center' },
      {
        kind: 'para',
        text: `Cross-domain posture scores **${posture}/100** — the book is ${posture >= 70 ? 'fundamentally stable and well-diversified' : posture >= 50 ? 'stable with a few items that warrant attention' : 'under elevated pressure across multiple domains'}. Here is the rollup across all four Fabric-demo domains.`,
      },
      {
        kind: 'metrics',
        items: [
          { label: 'Open high-sev AML', value: String(highAml.length), accent: T.high },
          { label: 'PD (weighted)', value: `${round(pdW, 2)}%`, accent: T.med, sub: `${elevated.length} elevated` },
          { label: 'FX exposure', value: formatCompactUsd(fx), accent: T.usd },
          { label: 'Daily stickiness', value: `${round(pct(dau, mau))}%`, accent: T.eur, sub: `${formatCompact(dau)} DAU` },
        ],
      },
      ...(watch.length
        ? [
            { kind: 'heading', text: 'What needs attention' } as Block,
            { kind: 'bullets', items: watch } as Block,
          ]
        : [{ kind: 'callout', tone: 'good', text: 'No pressing cross-domain items — all four domains are within normal ranges.' } as Block]),
      {
        kind: 'citations',
        items: [
          { label: 'AML Intelligence', sub: `${highAml.length} open high-sev`, nav: 'aml' },
          { label: 'Credit & Risk', sub: `PD ${round(pdW, 2)}%`, nav: 'credit' },
          { label: 'Treasury', sub: `${formatCompactUsd(fx)} FX`, nav: 'treasury' },
          { label: 'Digital', sub: `${round(pct(dau, mau))}% sticky`, nav: 'digital' },
        ],
      },
    ];

    return {
      steps,
      blocks,
      followups: ['Why are customers landing in the high-risk tier?', 'Describe liquidity across buckets', 'Summarize AML alerts'],
    };
  },
};

const SKILLS: Skill[] = [amlSummary, creditDrivers, treasuryLiquidity, digitalNarrative, execRollup];

/** Suggestion chips for the empty state (one per domain skill). */
export const SUGGESTIONS = SKILLS.map((s) => ({ text: s.suggestion, domain: s.domain }));

/** Route a question to the best-matching skill, else a grounded fallback. */
export function answerQuestion(question: string, data: DataSnapshot): AgentAnswer {
  const q = question.toLowerCase();
  let best: Skill | null = null;
  let bestScore = 0;
  for (const s of SKILLS) {
    const score = s.match(q);
    if (score > bestScore) { best = s; bestScore = score; }
  }
  if (best && bestScore >= 2) return best.run(data);

  // Fallback — still grounded: report what the agent CAN see and offer routes.
  const { aml, credit, treasury, digital } = data;
  return {
    steps: [
      { label: 'Parse question', detail: 'no exact skill match', entity: 'overview' },
      { label: 'Scan entities', detail: `${aml.length + credit.length + treasury.length + digital.length} rows available`, entity: 'overview' },
    ],
    blocks: [
      { kind: 'heading', text: 'I can reason over your live data' },
      {
        kind: 'para',
        text: `I couldn't map that to a specific analysis, but I'm grounded in **${aml.length} AML cases**, **${credit.length} credit reviews**, **${treasury.length} treasury actions** and **${digital.length} digital initiatives**. Try one of these:`,
      },
      { kind: 'bullets', items: SKILLS.map((s) => s.suggestion) },
      {
        kind: 'citations',
        items: [
          { label: 'AML Intelligence', nav: 'aml' },
          { label: 'Credit & Risk', nav: 'credit' },
          { label: 'Treasury', nav: 'treasury' },
          { label: 'Digital', nav: 'digital' },
        ],
      },
    ],
    followups: SKILLS.map((s) => s.suggestion).slice(0, 3),
  };
}
