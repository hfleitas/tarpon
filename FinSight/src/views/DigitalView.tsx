import { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, Badge, StackedColumns } from '../components/ui';
import { Toolbar } from '../components/Table';
import { Button, Drawer, Field, Row, Select, TextArea, TextInput } from '../components/form';
import { PageHead, Loading } from './AmlView';
import {
  getDigitalInitiatives,
  createDigitalInitiative,
  updateDigitalInitiative,
  deleteDigitalInitiative,
  type DigitalInitiative,
} from '../services/finsight';
import { T, formatCompact, formatDate, statusColors } from '../theme';

const CHANNELS = ['Mobile', 'Web', 'Tablet'];
const CATEGORIES = ['Adoption', 'Onboarding', 'BillPay', 'CardControls', 'Retention', 'Engagement'];
const METRICS = ['DAU', 'MAU', 'Mobile Adoption %', 'Engagement Score'];
const STATUSES = ['Planned', 'In Progress', 'Live', 'Complete'];
const CHANNEL_COLORS: Record<string, string> = { Mobile: T.gbp, Tablet: T.jpy, Web: T.eur };

type Draft = Omit<DigitalInitiative, 'id' | 'user_id'>;

const toInput = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const emptyDraft = (): Draft => ({
  name: '', channel: 'Mobile', category: 'Adoption', metric: 'DAU',
  targetValue: 6000, currentValue: 4876, status: 'Planned', owner: '',
  dueDate: new Date(Date.now() + 21 * 86400000), notes: '',
});

function fmtMetric(metric: string, v: number): string {
  if (metric.includes('%')) return `${v.toFixed(1)}%`;
  if (metric === 'Engagement Score') return v.toFixed(2);
  return formatCompact(v);
}

export function DigitalView() {
  const [rows, setRows] = useState<DigitalInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DigitalInitiative | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setRows(await getDigitalInitiatives());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setOpen(true); };
  const openEdit = (d: DigitalInitiative) => {
    setEditing(d);
    setDraft({ name: d.name, channel: d.channel, category: d.category, metric: d.metric, targetValue: d.targetValue, currentValue: d.currentValue, status: d.status, owner: d.owner, dueDate: d.dueDate, notes: d.notes });
    setOpen(true);
  };
  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await updateDigitalInitiative(editing.id, draft);
      else await createDigitalInitiative(draft);
      setOpen(false); await load();
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    try { await deleteDigitalInitiative(editing.id); setOpen(false); await load(); }
    finally { setSaving(false); }
  };

  // KPIs echo the digital dashboard: DAU, MAU, Mobile Adoption %, active work
  const live = rows.filter((r) => ['Live', 'Complete'].includes(r.status)).length;
  const inFlight = rows.filter((r) => r.status === 'In Progress').length;
  const dau = rows.find((r) => r.metric === 'DAU')?.currentValue ?? 4876;
  const mau = rows.find((r) => r.metric === 'MAU')?.currentValue ?? 10000;
  const adoption = rows.find((r) => r.metric === 'Mobile Adoption %')?.currentValue ?? 37.93;

  // Initiatives by channel — a stacked column echoing "event mix by device"
  const stackCats = CATEGORIES;
  const stackSeries = CHANNELS.map((ch) => ({
    label: ch,
    color: CHANNEL_COLORS[ch],
    values: stackCats.map((cat) => rows.filter((r) => r.channel === ch && r.category === cat).length),
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.name, r.owner, r.category, r.metric].some((f) => f.toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Digital Efficiency"
        blurb="Drive the KPIs behind the Fabric engagement dashboards — a backlog of initiatives moving DAU, MAU, mobile adoption and engagement score toward target."
        onNew={openNew} newLabel="New initiative"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Kpi label="DAU" value={formatCompact(dau)} accent={T.primary} sub="daily active users" />
        <Kpi label="MAU" value={formatCompact(mau)} accent={T.jpy} sub="monthly active users" />
        <Kpi label="Mobile Adoption" value={`${adoption.toFixed(1)}%`} accent={T.eur} sub="share on mobile" trend={{ dir: 'up', text: 'improving', good: true }} />
        <Kpi label="Live / In-Flight" value={`${live} / ${inFlight}`} accent={T.low} sub="shipped vs building" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 2fr)', gap: 18, alignItems: 'start' }} className="aml-grid">
        <Card title="Initiatives by Channel & Category" subtitle="Where the effort sits" accent={T.gbp}>
          <StackedColumns categories={stackCats} series={stackSeries} />
        </Card>

        <Card title="Initiative Backlog" subtitle={`${filtered.length} of ${rows.length} initiatives`} accent={T.primary} pad={0}>
          <div style={{ padding: '16px 20px 4px' }}>
            <Toolbar search={search} onSearch={setSearch} placeholder="Search initiative, owner, metric…">
              <Select value={statusFilter} onChange={setStatusFilter} options={['All', ...STATUSES]} style={{ width: 140 }} />
            </Toolbar>
          </div>
          <div className="scroll-y" style={{ maxHeight: 520 }}>
            {loading ? <Loading /> : filtered.length === 0 ? (
              <p style={{ padding: '44px 16px', textAlign: 'center', color: T.faint, fontSize: 13 }}>No initiatives match your filters.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: '4px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map((r) => <InitiativeRow key={r.id} r={r} onClick={() => openEdit(r)} />)}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.name : 'New initiative'}
        subtitle={editing ? `${editing.channel} · ${editing.category}` : 'Add a digital-efficiency initiative'}
        accent={T.gbp}
        footer={
          <>
            {editing && <Button variant="danger" onClick={() => void remove()} style={{ marginRight: 'auto' }}>Delete</Button>}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving || !draft.name.trim()}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create initiative'}</Button>
          </>
        }
      >
        <Field label="Initiative name"><TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Mobile onboarding redesign" /></Field>
        <Row cols="1fr 1fr 1fr">
          <Field label="Channel"><Select value={draft.channel} onChange={(v) => setDraft({ ...draft, channel: v })} options={CHANNELS} /></Field>
          <Field label="Category"><Select value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={CATEGORIES} /></Field>
          <Field label="Status"><Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES} /></Field>
        </Row>
        <Field label="Target metric"><Select value={draft.metric} onChange={(v) => setDraft({ ...draft, metric: v })} options={METRICS} /></Field>
        <Row>
          <Field label="Current value"><TextInput type="number" step="0.01" value={draft.currentValue} onChange={(e) => setDraft({ ...draft, currentValue: Number(e.target.value) })} /></Field>
          <Field label="Target value"><TextInput type="number" step="0.01" value={draft.targetValue} onChange={(e) => setDraft({ ...draft, targetValue: Number(e.target.value) })} /></Field>
        </Row>
        <Row>
          <Field label="Owner"><TextInput value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Product owner" /></Field>
          <Field label="Due date"><TextInput type="date" value={toInput(draft.dueDate)} onChange={(e) => setDraft({ ...draft, dueDate: new Date(e.target.value) })} /></Field>
        </Row>
        <Field label="Notes"><TextArea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Hypothesis, rollout plan, results…" /></Field>
      </Drawer>
    </div>
  );
}

function InitiativeRow({ r, onClick }: { r: DigitalInitiative; onClick: () => void }) {
  const pct = r.targetValue ? Math.max(0, Math.min(100, (r.currentValue / r.targetValue) * 100)) : 0;
  const sc = statusColors(r.status);
  const chColor = CHANNEL_COLORS[r.channel] ?? T.primary;
  return (
    <li
      onClick={onClick}
      style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s', background: '#fff' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.boxShadow = T.shadow; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: chColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: T.ink, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{r.channel} · {r.category}{r.owner ? ` · ${r.owner}` : ''}</div>
        </div>
        <Badge fg={sc.fg} bg={sc.bg}>{r.status}</Badge>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 7, background: '#eef1f8', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? T.low : chColor, borderRadius: 5, transition: 'width 0.6s ease' }} />
          </div>
        </div>
        <div className="tnum" style={{ fontSize: 11.5, color: T.inkSoft, whiteSpace: 'nowrap', fontWeight: 600 }}>
          {fmtMetric(r.metric, r.currentValue)} <span style={{ color: T.faint }}>/ {fmtMetric(r.metric, r.targetValue)}</span>
        </div>
        <div style={{ fontSize: 11, color: T.faint, whiteSpace: 'nowrap', minWidth: 58, textAlign: 'right' }}>{formatDate(r.dueDate)}</div>
      </div>
    </li>
  );
}
