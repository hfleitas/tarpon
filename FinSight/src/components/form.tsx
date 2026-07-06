import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { T } from '../theme';

const labelStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: T.inkSoft,
  marginBottom: 5,
  display: 'block',
};

const fieldBase: CSSProperties = {
  width: '100%',
  borderRadius: T.radiusSm,
  border: `1px solid ${T.borderStrong}`,
  background: '#fff',
  padding: '9px 11px',
  fontSize: 13.5,
  color: T.ink,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

function focusOn(e: { currentTarget: HTMLElement }) {
  e.currentTarget.style.borderColor = T.primary;
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)';
}
function focusOff(e: { currentTarget: HTMLElement }) {
  e.currentTarget.style.borderColor = T.borderStrong;
  e.currentTarget.style.boxShadow = 'none';
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...fieldBase, ...props.style }} onFocus={focusOn} onBlur={focusOff} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...fieldBase, resize: 'vertical', minHeight: 74, lineHeight: 1.5, ...props.style }}
      onFocus={focusOn}
      onBlur={focusOff}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
  style?: CSSProperties;
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldBase, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236a6f85\' d=\'M3 4.5 6 8l3-3.5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28, cursor: 'pointer', ...style }}
      onFocus={focusOn}
      onBlur={focusOff}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled,
  style,
  size = 'md',
}: {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'subtle' | 'danger';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  style?: CSSProperties;
  size?: 'sm' | 'md';
}) {
  const pad = size === 'sm' ? '6px 12px' : '9px 16px';
  const fs = size === 'sm' ? 12.5 : 13.5;
  const palettes: Record<string, CSSProperties> = {
    primary: { background: T.primary, color: '#fff', border: '1px solid ' + T.primary },
    ghost: { background: 'transparent', color: T.inkSoft, border: `1px solid ${T.borderStrong}` },
    subtle: { background: T.primarySoft, color: T.primaryDeep, border: '1px solid transparent' },
    danger: { background: '#fff', color: T.high, border: `1px solid ${T.highSoft}` },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: pad,
        borderRadius: T.radiusSm,
        fontSize: fs,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'filter 0.15s, background 0.15s, transform 0.1s',
        whiteSpace: 'nowrap',
        ...palettes[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.filter = 'brightness(0.96)';
        if (variant === 'ghost') e.currentTarget.style.background = T.cardMuted;
        if (variant === 'danger') e.currentTarget.style.background = T.highSoft;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'none';
        if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
        if (variant === 'danger') e.currentTarget.style.background = '#fff';
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
}

// ── Slide-over drawer (create / edit records) ────────────────────────────────
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  accent = T.primary,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  accent?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end', background: 'rgba(20,22,45,0.32)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="scroll-y"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(460px, 100vw)', height: '100%', background: T.card, boxShadow: '-16px 0 50px -20px rgba(20,22,45,0.4)', display: 'flex', flexDirection: 'column', animation: 'overlayIn 0.28s cubic-bezier(0.22,1,0.36,1)' }}
      >
        <header style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, position: 'relative' }}>
          <div style={{ position: 'absolute', insetInlineStart: 0, insetBlock: 0, width: 3, background: accent }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: '-0.01em' }}>{title}</h2>
              {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: T.muted }}>{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ border: 'none', background: T.cardMuted, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: T.muted, fontSize: 16, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        </header>
        <div className="scroll-y" style={{ flex: 1, padding: 22, display: 'flex', flexDirection: 'column', gap: 15 }}>
          {children}
        </div>
        {footer && (
          <footer style={{ padding: '14px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end', background: T.cardMuted }}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Row({ children, cols = '1fr 1fr' }: { children: ReactNode; cols?: string }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12 }}>{children}</div>;
}
