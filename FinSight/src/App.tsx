import { useState, type ReactNode } from 'react';

import { useAuth } from './auth/AuthContext';
import { isPreviewMock } from './rayfin/client';
import { T } from './theme';
import { CopilotPanel } from './components/CopilotPanel';
import { OverviewView } from './views/OverviewView';
import { AmlView } from './views/AmlView';
import { CreditView } from './views/CreditView';
import { TreasuryView } from './views/TreasuryView';
import { DigitalView } from './views/DigitalView';

type NavKey = 'overview' | 'aml' | 'credit' | 'treasury' | 'digital';

interface NavItem {
  key: NavKey;
  label: string;
  hint: string;
  color: string;
  icon: ReactNode;
}

// ── Brand mark (the Truist-colored Rayfin banker fish) ──────────────────────
function FinSightMark() {
  return (
    <img
      src="/finsight-banker.png"
      alt="FinSight"
      width={34}
      height={34}
      style={{ borderRadius: 9, boxShadow: '0 2px 8px -2px rgba(75,40,109,0.5)', flexShrink: 0, objectFit: 'cover' }}
    />
  );
}

// ── Icons (inline, stroke-based) ─────────────────────────────────────────────
function IconGrid() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" /><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" /><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" /><rect x="11.5" y="11.5" width="6" height="6" rx="1.5" /></svg>;
}
function IconShield() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M10 2.5 4 5v4.2c0 3.7 2.5 6.3 6 7.3 3.5-1 6-3.6 6-7.3V5l-6-2.5Z" /><path d="M7.5 10l1.8 1.8 3.2-3.6" strokeLinecap="round" /></svg>;
}
function IconPulse() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10.5h3.2l2-5 3 10 2.2-6 1.6 3h4" /></svg>;
}
function IconVault() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><circle cx="10" cy="10" r="3.2" /><path d="M10 6.8v-.8M10 14v-.8M13.2 10h.8M6 10h.8" strokeLinecap="round" /></svg>;
}
function IconDevices() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2.5" y="4" width="10" height="9" rx="1.5" /><rect x="13.5" y="7" width="4" height="9" rx="1.2" /><path d="M5 16h5" strokeLinecap="round" /></svg>;
}

const NAV: NavItem[] = [
  { key: 'overview', label: 'Command Center', hint: 'Executive rollup', color: T.primary, icon: <IconGrid /> },
  { key: 'aml', label: 'AML Intelligence', hint: 'AML automation', color: T.high, icon: <IconShield /> },
  { key: 'credit', label: 'Credit & Risk', hint: 'Risk discipline', color: T.usd, icon: <IconPulse /> },
  { key: 'treasury', label: 'Treasury', hint: 'Treasury modernization', color: T.primary, icon: <IconVault /> },
  { key: 'digital', label: 'Digital', hint: 'Digital efficiency', color: T.eur, icon: <IconDevices /> },
];

function ResponsiveStyles() {
  return (
    <style>{`
      .fs-scrim { display: none; }
      @media (max-width: 860px) {
        .fs-sidebar {
          position: fixed !important; z-index: 60; left: 0; top: 0;
          transform: translateX(-100%); transition: transform 0.25s ease;
          box-shadow: 12px 0 40px -18px rgba(20,22,45,0.4);
        }
        .fs-sidebar.open { transform: translateX(0); }
        .fs-scrim { display: block; position: fixed; inset: 0; z-index: 55; background: rgba(20,22,45,0.32); }
        .fs-burger { display: inline-flex !important; align-items: center; justify-content: center; }
      }
      @media (max-width: 720px) {
        .aml-grid { grid-template-columns: 1fr !important; }
        .trend-grid { grid-template-columns: 1fr !important; }
        .fs-sensitivity span:last-child, .fs-username { }
      }
      @media (max-width: 560px) {
        .fs-sensitivity { display: none !important; }
        .fs-username { display: none !important; }
        .fs-copilot-label { display: none !important; }
        .fs-copilot-btn { padding: 6px 8px !important; }
      }
    `}</style>
  );
}

export function App() {
  const { user, signOut } = useAuth();
  const [nav, setNav] = useState<NavKey>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const go = (k: NavKey) => { setNav(k); setMobileNav(false); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #f4eefb 0%, #efe9f7 45%, #f3edfa 100%)' }}>
      <ResponsiveStyles />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fs-sidebar${mobileNav ? ' open' : ''}`}
        style={{ width: 244, flexShrink: 0, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}
      >
        <div style={{ padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <FinSightMark />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>FinSight</div>
            <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 600, letterSpacing: '0.02em' }}>Operations Console</div>
          </div>
        </div>

        <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 12px 6px' }}>Workspaces</div>
          {NAV.map((item) => {
            const active = nav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', textAlign: 'left', position: 'relative',
                  background: active ? T.primarySoft : 'transparent',
                  transition: 'background 0.14s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(75,40,109,0.06)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: item.color }} />}
                <span style={{ display: 'flex', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: active ? '#fff' : 'rgba(255,255,255,0.7)', color: active ? item.color : T.muted, boxShadow: active ? '0 1px 3px rgba(20,22,45,0.1)' : 'none', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: active ? 700 : 600, color: active ? T.ink : T.inkSoft, lineHeight: 1.2 }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 10.5, color: T.faint, marginTop: 1 }}>{item.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.6)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
              <rect x="0" y="0" width="7" height="7" fill="#F25022" />
              <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
              <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
              <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
            </svg>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft, lineHeight: 1.2 }}>Microsoft Fabric</div>
              <div style={{ fontSize: 10, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Rayfin · SQL Database</div>
            </div>
          </div>
        </div>
      </aside>

      {mobileNav && <div className="fs-scrim" onClick={() => setMobileNav(false)} />}

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}` }}>
          <button className="fs-burger" onClick={() => setMobileNav(true)} aria-label="Open navigation" style={{ display: 'none', border: `1px solid ${T.borderStrong}`, background: '#fff', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: T.inkSoft }}>☰</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, color: T.muted }}>Truist Demo</span>
            <span style={{ color: T.faint }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {NAV.find((n) => n.key === nav)?.label}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setCopilotOpen(true)}
              className="fs-copilot-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 8px', borderRadius: 999, border: 'none', cursor: 'pointer', background: `linear-gradient(120deg, ${T.primary}, ${T.usd})`, color: '#fff', fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 10px -3px rgba(75,40,109,0.55)', transition: 'filter 0.15s, transform 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <img src="/finsight-banker.png" alt="" width={22} height={22} style={{ borderRadius: 6, objectFit: 'cover' }} />
              <span className="fs-copilot-label">Ask Copilot</span>
            </button>

            <span className="fs-sensitivity" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: '#fdf3e3', color: '#a5670a', fontSize: 11.5, fontWeight: 700, border: '1px solid #f6e2bf' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1 2 3.5V8c0 3.6 2.6 6 6 7 3.4-1 6-3.4 6-7V3.5L8 1Z" /></svg>
              Confidential · Internal Only
            </span>

            {isPreviewMock && (
              <span className="fs-preview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, background: T.lowSoft, color: '#0f766e', fontSize: 11.5, fontWeight: 700, border: '1px solid #b6ead6' }}>
                <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#14b8a6' }} />
                Preview data
              </span>
            )}

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 999, padding: '4px 6px 4px 4px', cursor: 'pointer' }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${T.primary}, ${T.usd})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                  {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
                </span>
                <span className="fs-username" style={{ fontSize: 12.5, fontWeight: 600, color: T.inkSoft, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'User'}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" style={{ color: T.faint, marginRight: 4 }}><path fill="currentColor" d="M3 4.5 6 8l3-3.5z" /></svg>
              </button>
              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 31, minWidth: 220, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadowLg, overflow: 'hidden', animation: 'overlayIn 0.18s ease' }}>
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{user?.name}</div>
                      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{user?.email}</div>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); void signOut(); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: T.inkSoft, fontWeight: 600 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.cardMuted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="scroll-y" style={{ flex: 1, padding: '22px clamp(16px, 3vw, 34px) 60px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            {nav === 'overview' && <OverviewView onNavigate={(n) => go(n)} />}
            {nav === 'aml' && <AmlView />}
            {nav === 'credit' && <CreditView />}
            {nav === 'treasury' && <TreasuryView />}
            {nav === 'digital' && <DigitalView />}
          </div>
        </main>
      </div>

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} onNavigate={(n) => { setCopilotOpen(false); go(n); }} />
    </div>
  );
}
