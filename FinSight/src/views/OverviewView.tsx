import { useEffect, useState } from 'react';
import { Card, Kpi, Badge, Donut, Sparkline, BarChart } from '../components/ui';
import {
  getAmlCases, getCreditReviews, getTreasuryActions, getDigitalInitiatives,
  type AmlCase, type CreditReview, type TreasuryAction, type DigitalInitiative,
} from '../services/finsight';
import { Loading } from './AmlView';
import { T, formatCompactUsd, formatCompact, timeAgo, levelColors, CURRENCY_COLORS } from '../theme';
import {
  getExecutiveSemanticSnapshot,
  semanticModelBinding,
  type ExecutiveSemanticSnapshot,
} from '../services/semanticModel';

type Nav = 'aml' | 'credit' | 'treasury' | 'digital';

const DOMAIN_COLORS: Record<string, { fg: string; bg: string }> = {
  AML: { fg: T.high, bg: T.highSoft },
  Credit: { fg: T.primary, bg: T.primarySoft },
  Treasury: { fg: T.usd, bg: '#f1e9f8' },
};

export function OverviewView({ onNavigate }: { onNavigate: (n: Nav) => void }) {
  const [aml, setAml] = useState<AmlCase[]>([]);
  const [credit, setCredit] = useState<CreditReview[]>([]);
  const [treasury, setTreasury] = useState<TreasuryAction[]>([]);
  const [digital, setDigital] = useState<DigitalInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanticSnapshot, setSemanticSnapshot] = useState<ExecutiveSemanticSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [a, c, t, d, semantic] = await Promise.all([
          getAmlCases(), getCreditReviews(), getTreasuryActions(), getDigitalInitiatives(),
          getExecutiveSemanticSnapshot(),
        ]);
        if (!cancelled) {
          setAml(a); setCredit(c); setTreasury(t); setDigital(d);
          setSemanticSnapshot(semantic);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;

  // ── Cross-domain rollups (Executive Command Center) ────────────────────────
  const avgScore = credit.length ? credit.reduce((s, r) => s + r.creditScore, 0) / credit.length : 0;
  const aml24 = aml.filter((r) => Date.now() - new Date(r.openedAt).getTime() < 86_400_000).length;
  const highSev = aml.filter((r) => r.riskScore >= 80).length;
  const dau = digital.find((r) => r.metric === 'DAU')?.currentValue ?? 4876;
  const fxExposure = treasury.filter((r) => r.currency !== 'USD').reduce((s, r) => s + Math.abs(r.amount), 0);
  const metricScore = semanticSnapshot?.creditScoreAvg ?? avgScore;
  const metricAml24 = semanticSnapshot?.amlAlertCount ?? aml24;
  const metricHighSev = semanticSnapshot?.highSeverityAlerts ?? highSev;
  const metricDau = semanticSnapshot?.dau ?? dau;
  const metricFxExposure = semanticSnapshot?.fxExposure ?? fxExposure;

  const totalExp = credit.reduce((s, r) => s + r.exposure, 0);
  const pdW = totalExp ? credit.reduce((s, r) => s + r.pd * r.exposure, 0) / totalExp : 0;

  // Credit & AML 30-day-ish trend (synthetic smooth series for the exec sparkline)
  const creditTrend = [572, 574, 573, 576, 575, 577, 574, 575, metricScore || 575];
  const amlTrend = [12, 9, 14, 11, 16, 13, 18, 15, metricAml24];
  const dauTrend = [4550, 4625, 4680, 4720, 4790, 4830, 4860, 4890, Math.round(metricDau)];
  const fxTrend = [
    metricFxExposure * 0.88,
    metricFxExposure * 0.91,
    metricFxExposure * 0.94,
    metricFxExposure * 0.92,
    metricFxExposure * 0.97,
    metricFxExposure * 0.95,
    metricFxExposure * 0.99,
    metricFxExposure * 1.02,
    metricFxExposure || 0,
  ];

  // Liquidity by bucket + currency mix
  const BUCKETS = ['0-7D', '8-30D', '31-90D', '90D+'];
  const byBucket = BUCKETS.map((b) => ({ label: b, value: treasury.filter((r) => r.liquidityBucket === b).reduce((s, r) => s + Math.abs(r.amount), 0) }));
  const currencyMix = ['GBP', 'JPY', 'EUR', 'CAD'].map((cur) => ({
    label: cur, value: treasury.filter((r) => r.currency === cur).reduce((s, r) => s + Math.abs(r.amount), 0), color: CURRENCY_COLORS[cur],
  })).filter((d) => d.value > 0);

  // Attention feed — the most pressing items across domains
  const attention = [
    ...aml.filter((r) => r.riskScore >= 80 && !['Cleared', 'SAR Filed'].includes(r.status))
      .map((r) => ({ id: r.id, domain: 'AML' as const, nav: 'aml' as Nav, title: r.subject, meta: `${r.caseNumber} · risk ${r.riskScore}`, when: r.openedAt, level: 'high' })),
    ...credit.filter((r) => r.riskTier === 'Critical' && r.status !== 'Closed')
      .map((r) => ({ id: r.id, domain: 'Credit' as const, nav: 'credit' as Nav, title: r.customerName, meta: `${r.signal}`, when: r.reviewedAt, level: 'high' })),
    ...treasury.filter((r) => r.status === 'Pending')
      .map((r) => ({ id: r.id, domain: 'Treasury' as const, nav: 'treasury' as Nav, title: `${r.actionType} · ${r.currency}`, meta: `${r.reference} · ${formatCompactUsd(r.amount)}`, when: r.requestedAt, level: 'med' })),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 7);

  const domainCards: { nav: Nav; label: string; color: string; primary: string; secondary: string }[] = [
    { nav: 'aml', label: 'AML Automation', color: T.high, primary: `${aml.filter((r) => !['Cleared', 'SAR Filed'].includes(r.status)).length} open`, secondary: `${metricHighSev} high severity` },
    { nav: 'credit', label: 'Risk Discipline', color: T.primary, primary: `${credit.filter((r) => r.status !== 'Closed').length} in review`, secondary: `PD ${pdW.toFixed(2)}%` },
    { nav: 'treasury', label: 'Treasury Modernization', color: T.usd, primary: `${treasury.filter((r) => r.status === 'Pending').length} pending`, secondary: `${formatCompactUsd(metricFxExposure)} FX` },
    { nav: 'digital', label: 'Digital Efficiency', color: T.eur, primary: `${digital.filter((r) => r.status === 'In Progress').length} in flight`, secondary: `${digital.filter((r) => ['Live', 'Complete'].includes(r.status)).length} shipped` },
  ];

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>Executive Command Center</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5, maxWidth: 680 }}>
          The operational rollup across the four Fabric demo domains — where the bank <em>acts</em> on the signals its dashboards surface.
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11.5, color: semanticSnapshot ? T.low : T.faint }}>
          {semanticSnapshot
            ? `Live semantic model source: ${semanticModelBinding.datasetName}`
            : `Semantic model fallback: using Rayfin operational store (${semanticModelBinding.datasetName} unavailable)`}
        </p>
      </div>

      {/* Executive KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Kpi label="Credit Score Avg" value={<span className="tnum">{metricScore.toFixed(0)}</span>} accent={T.primary} sub="portfolio mean" onClick={() => onNavigate('credit')} sparkValues={creditTrend} />
        <Kpi label="AML Alerts · 24h" value={metricAml24} accent={T.high} sub={`${metricHighSev} high severity`} onClick={() => onNavigate('aml')} sparkValues={amlTrend} />
        <Kpi label="DAU" value={formatCompact(metricDau)} accent={T.eur} sub="daily active users" onClick={() => onNavigate('digital')} sparkValues={dauTrend} />
        <Kpi label="FX Exposure" value={formatCompactUsd(metricFxExposure)} accent={T.usd} sub="non-USD absolute" onClick={() => onNavigate('treasury')} sparkValues={fxTrend} />
      </div>

      {/* Domain shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        {domainCards.map((d) => (
          <button
            key={d.nav}
            onClick={() => onNavigate(d.nav)}
            style={{ textAlign: 'left', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadowLg; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
          >
            <div style={{ position: 'absolute', insetInlineStart: 0, insetBlock: 0, width: 3, background: d.color }} />
            <div style={{ fontSize: 11.5, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 8 }}>{d.primary}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{d.secondary}</div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: d.color }}>Open workspace →</div>
          </button>
        ))}
      </div>

      {/* Trends + attention */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr)', gap: 18, alignItems: 'start' }} className="aml-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card title="Credit & AML Trend" subtitle="Last 30 days (indicative)" accent={T.primary}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="trend-grid">
              <div>
                <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 4 }}>Avg credit score</div>
                <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 6 }}>{metricScore.toFixed(0)}</div>
                <Sparkline values={creditTrend} width={280} height={54} color={T.primary} />
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: T.muted, marginBottom: 4 }}>AML alerts / day</div>
                <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: T.high, marginBottom: 6 }}>{metricAml24}</div>
                <Sparkline values={amlTrend} width={280} height={54} color={T.high} />
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="aml-grid">
            <Card title="Liquidity by Bucket" subtitle="Treasury coverage" accent={T.usd}>
              <BarChart data={byBucket} valueFormat={(v) => formatCompactUsd(v)} />
            </Card>
            <Card title="Currency Mix" subtitle="FX exposure" accent={T.eur}>
              <Donut data={currencyMix} centerValue={formatCompactUsd(metricFxExposure)} centerLabel="FX" size={148} thickness={26} />
            </Card>
          </div>
        </div>

        <Card title="Needs Attention" subtitle="Highest-priority items across domains" accent={T.high} pad={0}>
          {attention.length === 0 ? (
            <p style={{ padding: '40px 16px', textAlign: 'center', color: T.faint, fontSize: 13 }}>All clear — nothing pressing right now.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {attention.map((item) => {
                const lc = levelColors(item.level);
                return (
                  <li key={item.domain + item.id}>
                    <button
                      onClick={() => onNavigate(item.nav)}
                      style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fe')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: lc.fg, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meta}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <Badge fg={DOMAIN_COLORS[item.domain].fg} bg={DOMAIN_COLORS[item.domain].bg}>{item.domain}</Badge>
                        <span style={{ fontSize: 10.5, color: T.faint }}>{timeAgo(item.when)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
