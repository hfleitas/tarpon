import { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, Badge, BarChart, Donut } from '../components/ui';
import { DataTable, Toolbar, type Column } from '../components/Table';
import { Button, Drawer, Field, Row, Select, TextArea, TextInput } from '../components/form';
import { PageHead, Loading } from './AmlView';
import {
  getTreasuryActions,
  createTreasuryAction,
  updateTreasuryAction,
  deleteTreasuryAction,
  type TreasuryAction,
} from '../services/finsight';
import { T, formatCompactUsd, timeAgo, statusColors, CURRENCY_COLORS } from '../theme';

const TYPES = ['FX Hedge', 'Liquidity Transfer', 'Position Review', 'Wire Approval'];
const CURRENCIES = ['GBP', 'JPY', 'EUR', 'USD', 'CAD'];
const BUCKETS = ['0-7D', '8-30D', '31-90D', '90D+'];
const STATUSES = ['Pending', 'Approved', 'Rejected', 'Executed'];

type Draft = Omit<TreasuryAction, 'id' | 'user_id' | 'requestedAt' | 'reference'>;

const emptyDraft = (): Draft => ({
  actionType: 'FX Hedge', currency: 'GBP', amount: 1000000, liquidityBucket: '0-7D',
  status: 'Pending', approver: '', notes: '',
});

export function TreasuryView() {
  const [rows, setRows] = useState<TreasuryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TreasuryAction | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = async () => { setRows(await getTreasuryActions()); setLoading(false); };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (a: TreasuryAction) => {
    setEditing(a);
    setDraft({ actionType: a.actionType, currency: a.currency, amount: a.amount, liquidityBucket: a.liquidityBucket, status: a.status, approver: a.approver, notes: a.notes });
    setOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updateTreasuryAction(editing.id, draft);
      else await createTreasuryAction(draft);
      setOpen(false); await load();
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    try { await deleteTreasuryAction(editing.id); setOpen(false); await load(); }
    finally { setSaving(false); }
  };

  const setStatus = async (a: TreasuryAction, status: string) => {
    await updateTreasuryAction(a.id, { status });
    await load();
  };

  // FX exposure = non-USD absolute amounts (matches semantic model definition)
  const fxExposure = rows.filter((r) => r.currency !== 'USD').reduce((s, r) => s + Math.abs(r.amount), 0);
  const pending = rows.filter((r) => r.status === 'Pending');
  const executed = rows.filter((r) => r.status === 'Executed');

  // Currency mix (non-USD FX) for the donut
  const currencyMix = CURRENCIES.filter((c) => c !== 'USD').map((cur) => ({
    label: cur,
    value: rows.filter((r) => r.currency === cur).reduce((s, r) => s + Math.abs(r.amount), 0),
    color: CURRENCY_COLORS[cur],
  })).filter((d) => d.value > 0);

  // Liquidity by bucket (sum of amounts) for the bar chart
  const byBucket = BUCKETS.map((b) => ({
    label: b,
    value: rows.filter((r) => r.liquidityBucket === b).reduce((s, r) => s + Math.abs(r.amount), 0),
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.reference, r.actionType, r.currency, r.approver].some((f) => f.toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const columns: Column<TreasuryAction>[] = [
    { key: 'ref', header: 'Ref', width: '84px', render: (r) => <span className="tnum" style={{ fontWeight: 700, color: T.ink }}>{r.reference}</span> },
    { key: 'type', header: 'Action', render: (r) => (
      <div>
        <div style={{ fontWeight: 600, color: T.ink }}>{r.actionType}</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{r.liquidityBucket} bucket{r.approver ? ` · ${r.approver}` : ''}</div>
      </div>
    ) },
    { key: 'ccy', header: 'CCY', width: '58px', render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: T.ink }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: CURRENCY_COLORS[r.currency] ?? T.muted }} />{r.currency}
      </span>
    ) },
    { key: 'amt', header: 'Amount', align: 'right', width: '96px', render: (r) => <span className="tnum" style={{ fontWeight: 600 }}>{formatCompactUsd(r.amount)}</span> },
    { key: 'status', header: 'Status', width: '100px', render: (r) => { const c = statusColors(r.status); return <Badge fg={c.fg} bg={c.bg}>{r.status}</Badge>; } },
    { key: 'act', header: '', align: 'right', width: '150px', render: (r) => (
      r.status === 'Pending' ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="subtle" onClick={() => void setStatus(r, 'Approved')}>Approve</Button>
          <Button size="sm" variant="ghost" onClick={() => void setStatus(r, 'Rejected')}>Reject</Button>
        </div>
      ) : r.status === 'Approved' ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="subtle" onClick={() => void setStatus(r, 'Executed')}>Mark executed</Button>
        </div>
      ) : <span style={{ fontSize: 11.5, color: T.faint }}>{timeAgo(r.requestedAt)}</span>
    ) },
  ];

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Treasury & Liquidity"
        blurb="Turn the Fabric treasury dashboards into action — raise FX hedges, liquidity transfers and wire approvals, then route them through the approval workflow."
        onNew={openNew} newLabel="New action"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Kpi label="Total FX Exposure" value={formatCompactUsd(fxExposure)} accent={T.primary} sub="non-USD absolute" />
        <Kpi label="Pending Approvals" value={pending.length} accent={T.med} sub="awaiting sign-off" trend={pending.length ? { dir: 'flat', text: 'action needed' } : undefined} />
        <Kpi label="Executed" value={executed.length} accent={T.low} sub="settled this period" />
        <Kpi label="Open Actions" value={rows.length - executed.length} accent={T.usd} sub="in the workflow" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18, alignItems: 'stretch' }} className="aml-grid">
        <Card title="Liquidity by Bucket" subtitle="Amount across maturity buckets" accent={T.primary}>
          <BarChart data={byBucket} valueFormat={(v) => formatCompactUsd(v)} />
        </Card>
        <Card title="Currency Mix" subtitle="FX exposure by currency" accent={T.eur}>
          <Donut data={currencyMix} centerValue={formatCompactUsd(fxExposure)} centerLabel="FX exposure" />
        </Card>
      </div>

      <Card title="Treasury Actions" subtitle={`${filtered.length} of ${rows.length} actions`} accent={T.usd} pad={0}>
        <div style={{ padding: '16px 20px 4px' }}>
          <Toolbar search={search} onSearch={setSearch} placeholder="Search ref, type, currency, approver…">
            <Select value={statusFilter} onChange={setStatusFilter} options={['All', ...STATUSES]} style={{ width: 140 }} />
          </Toolbar>
        </div>
        {loading ? <Loading /> : <DataTable columns={columns} rows={filtered} onRowClick={openEdit} empty="No actions match your filters." />}
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.reference : 'New treasury action'}
        subtitle={editing ? editing.actionType : 'Raise an FX / liquidity / wire action'}
        accent={T.usd}
        footer={
          <>
            {editing && <Button variant="danger" onClick={() => void remove()} style={{ marginRight: 'auto' }}>Delete</Button>}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create action'}</Button>
          </>
        }
      >
        <Row>
          <Field label="Action type"><Select value={draft.actionType} onChange={(v) => setDraft({ ...draft, actionType: v })} options={TYPES} /></Field>
          <Field label="Currency"><Select value={draft.currency} onChange={(v) => setDraft({ ...draft, currency: v })} options={CURRENCIES} /></Field>
        </Row>
        <Row>
          <Field label="Amount (USD-equiv)"><TextInput type="number" min={0} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></Field>
          <Field label="Liquidity bucket"><Select value={draft.liquidityBucket} onChange={(v) => setDraft({ ...draft, liquidityBucket: v })} options={BUCKETS} /></Field>
        </Row>
        <Row>
          <Field label="Status"><Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES} /></Field>
          <Field label="Approver"><TextInput value={draft.approver} onChange={(e) => setDraft({ ...draft, approver: e.target.value })} placeholder="Treasury approver" /></Field>
        </Row>
        <Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Rationale, counterparty, settlement detail…" /></Field>
      </Drawer>
    </div>
  );
}
