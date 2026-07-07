import { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, Badge, BarChart } from '../components/ui';
import { DataTable, Toolbar, type Column } from '../components/Table';
import { Button, Drawer, Field, Row, Select, TextArea, TextInput } from '../components/form';
import {
  getAmlCases,
  createAmlCase,
  updateAmlCase,
  deleteAmlCase,
  type AmlCase,
} from '../services/finsight';
import { T, formatCompactUsd, timeAgo, levelColors, statusColors } from '../theme';

const REASONS = ['Structuring', 'Counterparty Concern', 'Unusual Velocity', 'High-Risk Geography'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const STATUSES = ['New', 'In Review', 'Escalated', 'SAR Filed', 'Cleared'];

type Draft = Omit<AmlCase, 'id' | 'user_id' | 'openedAt' | 'caseNumber'>;

const emptyDraft = (): Draft => ({
  subject: '',
  reason: 'Structuring',
  riskScore: 75,
  amount: 100000,
  priority: 'Medium',
  status: 'New',
  assignee: '',
  notes: '',
});

export function AmlView() {
  const [rows, setRows] = useState<AmlCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AmlCase | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setRows(await getAmlCases());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (c: AmlCase) => {
    setEditing(c);
    setDraft({ subject: c.subject, reason: c.reason, riskScore: c.riskScore, amount: c.amount, priority: c.priority, status: c.status, assignee: c.assignee, notes: c.notes });
    setOpen(true);
  };
  const save = async () => {
    if (!draft.subject.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateAmlCase(editing.id, draft);
      else await createAmlCase(draft);
      setOpen(false);
      await load();
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    try { await deleteAmlCase(editing.id); setOpen(false); await load(); }
    finally { setSaving(false); }
  };

  // KPIs (mirror the AML dashboard: 24h alerts, high severity, suspicious ratio, reasons)
  const last24 = rows.filter((r) => Date.now() - new Date(r.openedAt).getTime() < 86_400_000);
  const highSev = rows.filter((r) => r.riskScore >= 80);
  const openCases = rows.filter((r) => !['Cleared', 'SAR Filed'].includes(r.status));
  const sarFiled = rows.filter((r) => r.status === 'SAR Filed');
  const alertsTrend = [7, 8, 10, 9, 11, 12, 10, 11, last24.length];
  const highSeverityTrend = [3, 4, 4, 5, 5, 6, 5, 6, highSev.length];
  const openTrend = [11, 13, 12, 14, 15, 14, 16, 15, openCases.length];
  const sarTrend = [0, 1, 1, 2, 2, 2, 3, 3, sarFiled.length];
  const byReason = REASONS.map((reason) => ({ label: reason, value: rows.filter((r) => r.reason === reason).length })).sort((a, b) => b.value - a.value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.caseNumber, r.subject, r.reason, r.assignee].some((f) => f.toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const columns: Column<AmlCase>[] = [
    { key: 'case', header: 'Case', width: '92px', render: (r) => <span className="tnum" style={{ fontWeight: 700, color: T.ink }}>{r.caseNumber}</span> },
    { key: 'subject', header: 'Subject', render: (r) => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.subject}</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{r.reason}{r.assignee ? ` · ${r.assignee}` : ' · unassigned'}</div>
      </div>
    ) },
    { key: 'risk', header: 'Risk', align: 'center', width: '70px', render: (r) => {
      const c = r.riskScore >= 80 ? levelColors('high') : r.riskScore >= 60 ? levelColors('medium') : levelColors('low');
      return <span className="tnum" style={{ fontWeight: 800, color: c.fg }}>{r.riskScore}</span>;
    } },
    { key: 'amount', header: 'Amount', align: 'right', width: '96px', render: (r) => <span className="tnum" style={{ fontWeight: 600 }}>{formatCompactUsd(r.amount)}</span> },
    { key: 'priority', header: 'Priority', width: '86px', render: (r) => { const c = levelColors(r.priority); return <Badge fg={c.fg} bg={c.bg} dot>{r.priority}</Badge>; } },
    { key: 'status', header: 'Status', width: '104px', render: (r) => { const c = statusColors(r.status); return <Badge fg={c.fg} bg={c.bg}>{r.status}</Badge>; } },
    { key: 'age', header: 'Opened', align: 'right', width: '84px', render: (r) => <span style={{ color: T.muted, fontSize: 12 }}>{timeAgo(r.openedAt)}</span> },
  ];

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="AML Case Intelligence"
        blurb="Investigate and disposition anomaly alerts surfaced by the Fabric AML notebooks — triage, assign, escalate or file a SAR."
        onNew={openNew} newLabel="New case"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Kpi label="Alerts · Last 24h" value={last24.length} accent={T.primary} sub="anomaly cases opened" sparkValues={alertsTrend} />
        <Kpi label="High Severity" value={highSev.length} accent={T.high} sub="risk score ≥ 80" trend={{ dir: 'up', text: 'watch', good: false }} sparkValues={highSeverityTrend} />
        <Kpi label="Open Investigations" value={openCases.length} accent={T.med} sub="awaiting disposition" sparkValues={openTrend} />
        <Kpi label="SARs Filed" value={sarFiled.length} accent={T.usd} sub="reported this period" sparkValues={sarTrend} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 2fr)', gap: 18, alignItems: 'start' }} className="aml-grid">
        <Card title="AML Alerts by Reason" subtitle="Leading anomaly drivers" accent={T.primary}>
          <BarChart data={byReason} valueFormat={(v) => String(v)} />
        </Card>

        <Card title="Case Queue" subtitle={`${filtered.length} of ${rows.length} cases`} accent={T.high} pad={0}>
          <div style={{ padding: '16px 20px 4px' }}>
            <Toolbar search={search} onSearch={setSearch} placeholder="Search case, subject, analyst…">
              <Select value={statusFilter} onChange={setStatusFilter} options={['All', ...STATUSES]} style={{ width: 150 }} />
            </Toolbar>
          </div>
          {loading ? <Loading /> : <DataTable columns={columns} rows={filtered} onRowClick={openEdit} empty="No cases match your filters." />}
        </Card>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.caseNumber : 'New AML case'}
        subtitle={editing ? 'Update disposition and notes' : 'Log a new anomaly for investigation'}
        accent={T.high}
        footer={
          <>
            {editing && <Button variant="danger" onClick={() => void remove()} style={{ marginRight: 'auto' }}>Delete</Button>}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving || !draft.subject.trim()}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create case'}</Button>
          </>
        }
      >
        <Field label="Subject"><TextInput value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="e.g. Rapid structuring across linked accounts" /></Field>
        <Row>
          <Field label="Reason"><Select value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} options={REASONS} /></Field>
          <Field label="Priority"><Select value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: v })} options={PRIORITIES} /></Field>
        </Row>
        <Row>
          <Field label="Risk score (0–100)"><TextInput type="number" min={0} max={100} value={draft.riskScore} onChange={(e) => setDraft({ ...draft, riskScore: Number(e.target.value) })} /></Field>
          <Field label="Amount (USD)"><TextInput type="number" min={0} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></Field>
        </Row>
        <Row>
          <Field label="Status"><Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES} /></Field>
          <Field label="Assignee"><TextInput value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })} placeholder="Analyst name" /></Field>
        </Row>
        <Field label="Investigation notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Findings, rationale, SAR reference…" /></Field>
      </Drawer>
    </div>
  );
}

// Shared small helpers reused across views
export function PageHead({ title, blurb, onNew, newLabel }: { title: string; blurb: string; onNew?: () => void; newLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 620 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>{blurb}</p>
      </div>
      {onNew && (
        <Button onClick={onNew}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> {newLabel ?? 'New'}
        </Button>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ height: 22, width: 22, borderRadius: '50%', border: '2px solid #d7dbea', borderTopColor: T.primary, animation: 'spin 0.6s linear infinite' }} />
    </div>
  );
}
