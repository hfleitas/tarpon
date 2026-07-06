import { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, Badge, BarChart } from '../components/ui';
import { DataTable, Toolbar, type Column } from '../components/Table';
import { Button, Drawer, Field, Row, Select, TextArea, TextInput } from '../components/form';
import { PageHead, Loading } from './AmlView';
import {
  getCreditReviews,
  createCreditReview,
  updateCreditReview,
  deleteCreditReview,
  type CreditReview,
} from '../services/finsight';
import { T, formatCompactUsd, timeAgo, levelColors, statusColors } from '../theme';

const TIERS = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Open', 'Monitoring', 'Action Taken', 'Closed'];

type Draft = Omit<CreditReview, 'id' | 'user_id' | 'reviewedAt'>;

const emptyDraft = (): Draft => ({
  customerName: '', customerId: '', creditScore: 575, pd: 3.3, lgd: 41.6,
  riskTier: 'Medium', signal: '', severity: 'Medium', status: 'Open', exposure: 500000, notes: '',
});

export function CreditView() {
  const [rows, setRows] = useState<CreditReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditReview | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setRows(await getCreditReviews());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (c: CreditReview) => {
    setEditing(c);
    setDraft({ customerName: c.customerName, customerId: c.customerId, creditScore: c.creditScore, pd: c.pd, lgd: c.lgd, riskTier: c.riskTier, signal: c.signal, severity: c.severity, status: c.status, exposure: c.exposure, notes: c.notes });
    setOpen(true);
  };
  const save = async () => {
    if (!draft.customerName.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateCreditReview(editing.id, draft);
      else await createCreditReview(draft);
      setOpen(false); await load();
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    try { await deleteCreditReview(editing.id); setOpen(false); await load(); }
    finally { setSaving(false); }
  };

  // Portfolio KPIs — balance-weighted PD/LGD like the semantic model, avg score
  const totalExposure = rows.reduce((s, r) => s + r.exposure, 0);
  const pdW = totalExposure ? rows.reduce((s, r) => s + r.pd * r.exposure, 0) / totalExposure : 0;
  const lgdW = totalExposure ? rows.reduce((s, r) => s + r.lgd * r.exposure, 0) / totalExposure : 0;
  const avgScore = rows.length ? rows.reduce((s, r) => s + r.creditScore, 0) / rows.length : 0;
  const bySeverity = SEVERITIES.slice().reverse().map((sev) => ({
    label: sev,
    value: rows.filter((r) => r.severity === sev).length,
    color: levelColors(sev).fg,
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tierFilter !== 'All' && r.riskTier !== tierFilter) return false;
      if (!q) return true;
      return [r.customerName, r.customerId, r.signal].some((f) => f.toLowerCase().includes(q));
    });
  }, [rows, search, tierFilter]);

  const columns: Column<CreditReview>[] = [
    { key: 'cust', header: 'Customer', render: (r) => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.customerName}</div>
        <div className="tnum" style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{r.customerId} · {r.signal}</div>
      </div>
    ) },
    { key: 'score', header: 'Score', align: 'center', width: '66px', render: (r) => {
      const c = r.creditScore < 540 ? levelColors('high') : r.creditScore < 600 ? levelColors('medium') : levelColors('low');
      return <span className="tnum" style={{ fontWeight: 800, color: c.fg }}>{r.creditScore}</span>;
    } },
    { key: 'pd', header: 'PD', align: 'right', width: '58px', render: (r) => <span className="tnum">{r.pd.toFixed(1)}%</span> },
    { key: 'lgd', header: 'LGD', align: 'right', width: '62px', render: (r) => <span className="tnum">{r.lgd.toFixed(1)}%</span> },
    { key: 'exp', header: 'Exposure', align: 'right', width: '96px', render: (r) => <span className="tnum" style={{ fontWeight: 600 }}>{formatCompactUsd(r.exposure)}</span> },
    { key: 'tier', header: 'Tier', width: '92px', render: (r) => { const c = levelColors(r.riskTier); return <Badge fg={c.fg} bg={c.bg} dot>{r.riskTier}</Badge>; } },
    { key: 'status', header: 'Status', width: '116px', render: (r) => { const c = statusColors(r.status); return <Badge fg={c.fg} bg={c.bg}>{r.status}</Badge>; } },
    { key: 'age', header: 'Reviewed', align: 'right', width: '84px', render: (r) => <span style={{ color: T.muted, fontSize: 12 }}>{timeAgo(r.reviewedAt)}</span> },
  ];

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Credit Risk & Early Warning"
        blurb="Review deterioration signals and risk tiers from the Fabric credit notebooks — confirm the tier, decide an action, and track balance at risk."
        onNew={openNew} newLabel="New review"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Kpi label="Avg Credit Score" value={<span className="tnum">{avgScore.toFixed(0)}</span>} accent={T.primary} sub="portfolio mean" />
        <Kpi label="PD Weighted" value={`${pdW.toFixed(2)}%`} accent={T.med} sub="balance-weighted" />
        <Kpi label="LGD Weighted" value={`${lgdW.toFixed(1)}%`} accent={T.high} sub="loss severity" />
        <Kpi label="Balance at Risk" value={formatCompactUsd(totalExposure)} accent={T.usd} sub={`${rows.length} reviews`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 2fr)', gap: 18, alignItems: 'start' }} className="aml-grid">
        <Card title="Early Warning by Severity" subtitle="Signal distribution" accent={T.high}>
          <BarChart data={bySeverity} valueFormat={(v) => String(v)} />
          <p style={{ margin: '16px 0 0', fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
            Broad-based signal spread rather than concentration in one band — consistent with the Fabric Early-Warning model.
          </p>
        </Card>

        <Card title="Watchlist" subtitle={`${filtered.length} of ${rows.length} customers`} accent={T.primary} pad={0}>
          <div style={{ padding: '16px 20px 4px' }}>
            <Toolbar search={search} onSearch={setSearch} placeholder="Search customer, ID, signal…">
              <Select value={tierFilter} onChange={setTierFilter} options={['All', ...TIERS]} style={{ width: 140 }} />
            </Toolbar>
          </div>
          {loading ? <Loading /> : <DataTable columns={columns} rows={filtered} onRowClick={openEdit} empty="No reviews match your filters." />}
        </Card>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.customerName : 'New credit review'}
        subtitle={editing ? editing.customerId : 'Log an early-warning review'}
        accent={T.primary}
        footer={
          <>
            {editing && <Button variant="danger" onClick={() => void remove()} style={{ marginRight: 'auto' }}>Delete</Button>}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving || !draft.customerName.trim()}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create review'}</Button>
          </>
        }
      >
        <Row>
          <Field label="Customer name"><TextInput value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} placeholder="Client legal name" /></Field>
          <Field label="Customer ID"><TextInput value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })} placeholder="CUST-000000" /></Field>
        </Row>
        <Row cols="1fr 1fr 1fr">
          <Field label="Credit score"><TextInput type="number" min={300} max={850} value={draft.creditScore} onChange={(e) => setDraft({ ...draft, creditScore: Number(e.target.value) })} /></Field>
          <Field label="PD %"><TextInput type="number" step="0.1" value={draft.pd} onChange={(e) => setDraft({ ...draft, pd: Number(e.target.value) })} /></Field>
          <Field label="LGD %"><TextInput type="number" step="0.1" value={draft.lgd} onChange={(e) => setDraft({ ...draft, lgd: Number(e.target.value) })} /></Field>
        </Row>
        <Field label="Early-warning signal"><TextInput value={draft.signal} onChange={(e) => setDraft({ ...draft, signal: e.target.value })} placeholder="e.g. Utilization spike + 30d delinquency" /></Field>
        <Row cols="1fr 1fr 1fr">
          <Field label="Risk tier"><Select value={draft.riskTier} onChange={(v) => setDraft({ ...draft, riskTier: v })} options={TIERS} /></Field>
          <Field label="Severity"><Select value={draft.severity} onChange={(v) => setDraft({ ...draft, severity: v })} options={SEVERITIES} /></Field>
          <Field label="Status"><Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES} /></Field>
        </Row>
        <Field label="Exposure (USD)"><TextInput type="number" min={0} value={draft.exposure} onChange={(e) => setDraft({ ...draft, exposure: Number(e.target.value) })} /></Field>
        <Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Decision rationale, RM actions…" /></Field>
      </Drawer>
    </div>
  );
}
