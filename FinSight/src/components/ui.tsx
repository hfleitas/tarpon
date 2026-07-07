import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';
import { T } from '../theme';

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  pad = 20,
  headerPad,
  title,
  subtitle,
  right,
  accent,
}: {
  children?: ReactNode;
  style?: CSSProperties;
  pad?: number;
  headerPad?: number;
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  accent?: string;
}) {
  const resolvedHeaderPad = headerPad ?? (pad === 0 ? 20 : pad);

  return (
    <section
      style={{
        position: 'relative',
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadow,
        overflow: 'hidden',
        ...style,
      }}
    >
      {accent && (
        <div style={{ position: 'absolute', insetInlineStart: 0, insetBlock: 0, width: 3, background: accent }} />
      )}
      {(title || right) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: `14px ${resolvedHeaderPad}px`,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div>
            {title && <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </header>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </section>
  );
}

// ── KPI tile (Power BI card visual) ──────────────────────────────────────────
export function Kpi({
  label,
  value,
  sub,
  accent = T.primary,
  trend,
  onClick,
  sparkValues,
  sparkColor,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  trend?: { dir: 'up' | 'down' | 'flat'; text: string; good?: boolean };
  onClick?: () => void;
  sparkValues?: number[];
  sparkColor?: string;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      style={{
        position: 'relative',
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadow,
        padding: '14px 16px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = T.shadowLg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = T.shadow;
      }}
      onFocus={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = T.shadowLg;
        e.currentTarget.style.outline = `2px solid ${T.primary}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = T.shadow;
        e.currentTarget.style.outline = 'none';
      }}
    >
      <div style={{ position: 'absolute', top: 0, insetInline: 0, height: 3, background: accent }} />
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 800, color: T.ink, marginTop: 8, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, minHeight: 18 }}>
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11.5,
              fontWeight: 700,
              color: trend.dir === 'flat' ? T.muted : trend.good ? T.low : T.high,
            }}
          >
            {trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '■'} {trend.text}
          </span>
        )}
        {sub && <span style={{ fontSize: 11.5, color: T.muted }}>{sub}</span>}
      </div>
      {sparkValues && sparkValues.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline
            values={sparkValues}
            width={180}
            height={34}
            color={sparkColor ?? accent}
          />
        </div>
      )}
    </div>
  );
}

// ── Badge / pill ─────────────────────────────────────────────────────────────
export function Badge({
  children,
  fg,
  bg,
  dot,
}: {
  children: ReactNode;
  fg: string;
  bg: string;
  dot?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: fg }} />}
      {children}
    </span>
  );
}

// ── Horizontal bar chart (category → value), Power BI style ──────────────────
export function BarChart({
  data,
  valueFormat = (v) => String(v),
  color = T.bar,
  height,
}: {
  data: { label: string; value: number; color?: string }[];
  valueFormat?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '116px 1fr auto', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: T.inkSoft, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
          <div style={{ height: 22, background: '#eef1f8', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? color,
                borderRadius: 5,
                transformOrigin: 'left',
                animation: `growW 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both`,
              }}
            />
          </div>
          <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, minWidth: 44, textAlign: 'right' }}>
            {valueFormat(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart (currency mix) ───────────────────────────────────────────────
export function Donut({
  data,
  size = 172,
  thickness = 30,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f8" strokeWidth={thickness} />
          {data.map((d) => {
            const len = (d.value / total) * c;
            const seg = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {centerValue && <div className="tnum" style={{ fontSize: 19, fontWeight: 800, color: T.ink }}>{centerValue}</div>}
            {centerLabel && <div style={{ fontSize: 10.5, color: T.muted, marginTop: 1 }}>{centerLabel}</div>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 130 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ color: T.inkSoft, flex: 1 }}>{d.label}</span>
            <span className="tnum" style={{ color: T.muted, fontWeight: 600 }}>
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline / area (engagement, trend) ─────────────────────────────────────
export function Sparkline({
  values,
  width = 240,
  height = 56,
  color = T.primary,
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const sparklineId = useId().replace(/:/g, '');
  if (values.length < 2) return <div style={{ height, width }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const gid = `sg-${color.replace('#', '')}-${sparklineId}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={color} />
    </svg>
  );
}

// ── Stacked column chart (device × event) ────────────────────────────────────
export function StackedColumns({
  categories,
  series,
  height = 150,
}: {
  categories: string[];
  series: { label: string; color: string; values: number[] }[];
  height?: number;
}) {
  const totals = categories.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0));
  const max = Math.max(1, ...totals);
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
        {series.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.inkSoft }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
        {categories.map((cat, i) => (
          <div key={cat} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', maxWidth: 42, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: height - 22 }}>
              {series.map((s, si) => {
                const h = ((s.values[i] || 0) / max) * (height - 22);
                return (
                  <div
                    key={s.label}
                    title={`${s.label}: ${s.values[i]}`}
                    style={{
                      height: h,
                      background: s.color,
                      borderTopLeftRadius: si === 0 ? 4 : 0,
                      borderTopRightRadius: si === 0 ? 4 : 0,
                      animation: `growH 0.5s ease ${i * 0.04}s both`,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: 10.5, color: T.muted, textAlign: 'center', lineHeight: 1.1, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cat}
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes growH { from { height: 0 } }`}</style>
    </div>
  );
}
