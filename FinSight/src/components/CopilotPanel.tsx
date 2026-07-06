import { useEffect, useRef, useState } from 'react';

import { T, formatCompactUsd } from '../theme';
import {
  getAmlCases,
  getCreditReviews,
  getTreasuryActions,
  getDigitalInitiatives,
} from '../services/finsight';
import { answerQuestion, SUGGESTIONS } from '../agent/engine';
import type {
  AgentAnswer,
  BarDatum,
  Block,
  DataSnapshot,
  NavTarget,
  ReasoningStep,
} from '../agent/types';

// A rendered turn in the conversation.
interface Turn {
  id: string;
  question: string;
  answer: AgentAnswer;
  revealed: number; // how many reasoning steps are shown (for the "thinking" effect)
  thinking: boolean; // still streaming steps
}

const DOMAIN_COLOR: Record<NavTarget, string> = {
  overview: T.primary,
  aml: T.high,
  credit: T.usd,
  treasury: T.primary,
  digital: T.eur,
};

// ── Inline **bold** renderer ─────────────────────────────────────────────────
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} style={{ color: T.ink, fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

// ── Mini bar chart used inside answers ───────────────────────────────────────
function MiniBars({ data, format }: { data: BarDatum[]; format?: 'num' | 'usd' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '84px 1fr auto', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11.5, color: T.inkSoft, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          <div style={{ height: 16, background: '#efeaf6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: d.color ?? T.bar, borderRadius: 4, transformOrigin: 'left', animation: `growW 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both` }} />
          </div>
          <div className="tnum" style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, minWidth: 46, textAlign: 'right' }}>
            {d.display ?? (format === 'usd' ? formatCompactUsd(d.value) : d.value.toLocaleString())}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── One answer block ─────────────────────────────────────────────────────────
function BlockView({ block, onNavigate }: { block: Block; onNavigate: (n: NavTarget) => void }) {
  switch (block.kind) {
    case 'heading':
      return <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em', marginTop: 4 }}>{block.text}</div>;
    case 'para':
      return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: T.inkSoft }}><RichText text={block.text} /></p>;
    case 'metrics':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {block.items.map((m) => (
            <div key={m.label} style={{ position: 'relative', border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', background: T.cardMuted, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, insetInline: 0, height: 2.5, background: m.accent ?? T.primary }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{m.label}</div>
              <div className="tnum" style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 3, lineHeight: 1.05 }}>{m.value}</div>
              {m.sub && <div style={{ fontSize: 10.5, color: T.faint, marginTop: 1 }}>{m.sub}</div>}
            </div>
          ))}
        </div>
      );
    case 'bars':
      return (
        <div>
          {block.title && <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{block.title}</div>}
          <MiniBars data={block.data} format={block.format} />
        </div>
      );
    case 'bullets':
      return (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {block.items.map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.5, color: T.inkSoft }}>
              <span style={{ color: T.primary, marginTop: 1, flexShrink: 0 }}>▪</span>
              <span><RichText text={b} /></span>
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const tone = block.tone === 'warn' ? { bg: T.highSoft, fg: T.high, br: '#f3cdd6' } : block.tone === 'good' ? { bg: T.lowSoft, fg: '#0f766e', br: '#b6ead6' } : { bg: T.primarySoft, fg: T.primaryDeep, br: '#e0d3ee' };
      return (
        <div style={{ display: 'flex', gap: 9, padding: '10px 12px', borderRadius: 9, background: tone.bg, border: `1px solid ${tone.br}` }}>
          <span style={{ color: tone.fg, flexShrink: 0, fontSize: 13, lineHeight: 1.5 }}>{block.tone === 'good' ? '✓' : block.tone === 'warn' ? '⚠' : 'ℹ'}</span>
          <span style={{ fontSize: 12.5, lineHeight: 1.5, color: T.inkSoft }}><RichText text={block.text} /></span>
        </div>
      );
    }
    case 'citations':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grounded in</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {block.items.map((c) => (
              <button
                key={c.label + c.nav}
                onClick={() => onNavigate(c.nav)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.14s, background 0.14s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = DOMAIN_COLOR[c.nav]; e.currentTarget.style.background = T.cardMuted; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = '#fff'; }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: DOMAIN_COLOR[c.nav], flexShrink: 0 }} />
                <span>
                  <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>{c.label}</span>
                  {c.sub && <span style={{ display: 'block', fontSize: 10, color: T.muted }}>{c.sub}</span>}
                </span>
                <span style={{ color: T.faint, fontSize: 13 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      );
  }
}

// ── Reasoning step list (the visible "chain of thought") ─────────────────────
function ReasoningTrail({ steps, revealed, thinking }: { steps: ReasoningStep[]; revealed: number; thinking: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 4 }}>
      {steps.slice(0, revealed).map((s, i) => (
        <div key={i} className="rise" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '3px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.entity ? DOMAIN_COLOR[s.entity] : T.primary, flexShrink: 0, marginTop: 4 }} />
            {i < revealed - 1 && <span style={{ width: 1.5, flex: 1, background: T.border, minHeight: 8 }} />}
          </div>
          <div style={{ paddingBottom: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft }}>{s.label}</span>
            <span style={{ fontSize: 11.5, color: T.muted }}> — {s.detail}</span>
          </div>
        </div>
      ))}
      {thinking && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '3px 0' }}>
          <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary }} />
          <span style={{ fontSize: 11.5, color: T.muted, fontStyle: 'italic' }}>reasoning…</span>
        </div>
      )}
    </div>
  );
}

// ── The banker-fish agent avatar ─────────────────────────────────────────────
function AgentAvatar({ size = 30 }: { size?: number }) {
  return (
    <img src="/finsight-banker.png" alt="Copilot" width={size} height={size} style={{ borderRadius: size / 3.6, objectFit: 'cover', flexShrink: 0, boxShadow: '0 1px 4px -1px rgba(75,40,109,0.5)' }} />
  );
}

async function snapshot(): Promise<DataSnapshot> {
  const [aml, credit, treasury, digital] = await Promise.all([
    getAmlCases(), getCreditReviews(), getTreasuryActions(), getDigitalInitiatives(),
  ]);
  return { aml, credit, treasury, digital };
}

export function CopilotPanel({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (n: NavTarget) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Esc closes; focus the input on open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  // Autoscroll to the newest content as steps stream in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);

    const data = await snapshot(); // live read every time → reflects edits
    const answer = answerQuestion(q, data);
    const id = crypto.randomUUID();
    setTurns((prev) => [...prev, { id, question: q, answer, revealed: 0, thinking: true }]);

    // Stream the reasoning steps one by one for a genuine "thinking" feel.
    for (let i = 1; i <= answer.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 260));
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, revealed: i } : t)));
    }
    await new Promise((r) => setTimeout(r, 200));
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, thinking: false } : t)));
    setBusy(false);
  };

  if (!open) return null;

  const lastTurn = turns[turns.length - 1];
  const followups = !busy && lastTurn && !lastTurn.thinking ? lastTurn.answer.followups : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(32,20,58,0.34)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }} onClick={onClose} />

      <aside
        style={{ position: 'relative', width: 'min(460px, 100vw)', height: '100%', background: T.card, boxShadow: '-16px 0 50px -20px rgba(32,20,58,0.5)', display: 'flex', flexDirection: 'column', animation: 'overlayIn 0.3s cubic-bezier(0.22,1,0.36,1)' }}
      >
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 18px', borderBottom: `1px solid ${T.border}`, background: `linear-gradient(120deg, ${T.primarySoft}, transparent)` }}>
          <AgentAvatar size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>FinSight Copilot</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, color: '#0f766e', background: T.lowSoft, border: '1px solid #b6ead6', borderRadius: 999, padding: '1px 7px' }}>
                <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#14b8a6' }} /> LIVE DATA
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>Reasons over your Rayfin entities</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: T.cardMuted, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: T.muted, fontSize: 16, flexShrink: 0 }}>✕</button>
        </header>

        {/* Conversation */}
        <div ref={scrollRef} className="scroll-y" style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {turns.length === 0 && <EmptyState onPick={ask} />}

          {turns.map((turn) => (
            <div key={turn.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* user question */}
              <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: T.primary, color: '#fff', padding: '9px 13px', borderRadius: '13px 13px 4px 13px', fontSize: 13, fontWeight: 500, lineHeight: 1.45, boxShadow: '0 2px 8px -3px rgba(75,40,109,0.5)' }}>
                {turn.question}
              </div>

              {/* agent answer */}
              <div style={{ display: 'flex', gap: 10 }}>
                <AgentAvatar />
                <div style={{ flex: 1, minWidth: 0, background: T.cardMuted, border: `1px solid ${T.border}`, borderRadius: '13px 13px 13px 4px', padding: 13, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <ReasoningTrail steps={turn.answer.steps} revealed={turn.revealed} thinking={turn.thinking} />
                  {!turn.thinking && (
                    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 11, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      {turn.answer.blocks.map((b, i) => <BlockView key={i} block={b} onNavigate={onNavigate} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Follow-up chips */}
          {followups.length > 0 && (
            <div className="rise" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingLeft: 40 }}>
              {followups.map((f) => (
                <button
                  key={f}
                  onClick={() => void ask(f)}
                  style={{ fontSize: 11.5, fontWeight: 600, color: T.primaryDeep, background: T.primarySoft, border: `1px solid #e0d3ee`, borderRadius: 999, padding: '5px 11px', cursor: 'pointer', transition: 'filter 0.14s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.97)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 14px', background: T.card }}>
          <form
            onSubmit={(e) => { e.preventDefault(); void ask(input); }}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: '#fff', border: `1px solid ${T.borderStrong}`, borderRadius: 12, padding: '6px 6px 6px 12px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(75,40,109,0.12)'; }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AML, credit, treasury, digital…"
              disabled={busy}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: T.ink, background: 'transparent', padding: '5px 0' }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: 'none', background: busy || !input.trim() ? T.borderStrong : T.primary, color: '#fff', cursor: busy || !input.trim() ? 'default' : 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
            >
              {busy
                ? <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} />
                : <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 10 17 3l-4 14-3-5-7-2Z" fill="currentColor" /></svg>}
            </button>
          </form>
          <div style={{ fontSize: 10, color: T.faint, textAlign: 'center', marginTop: 7 }}>
            Grounded in live Rayfin data · every figure is computed, not generated
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Empty state — intro + suggestion chips ───────────────────────────────────
function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '12px 0' }}>
        <AgentAvatar size={54} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>Ask FinSight Copilot</div>
          <p style={{ margin: '6px auto 0', fontSize: 12.5, color: T.muted, lineHeight: 1.55, maxWidth: 320 }}>
            I read your live AML, credit, treasury and digital data, reason over it step by step, and answer with computed figures you can trace back to each workspace.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Try asking</div>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onPick(s.text)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.14s, transform 0.12s, box-shadow 0.14s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = DOMAIN_COLOR[s.domain]; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = T.shadow; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOMAIN_COLOR[s.domain], flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft, lineHeight: 1.35 }}>{s.text}</span>
            <span style={{ marginLeft: 'auto', color: T.faint, fontSize: 14 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
