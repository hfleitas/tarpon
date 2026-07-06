// Design tokens + formatting helpers for the FinSight Operations Console.
// Palette is the authentic Truist brand (truist.com): Truist Purple #4B286D as
// primary with a bright Truist Teal #00B5CC accent, a heritage-purple / deep-
// purple / gold categorical set, on a soft purple-lavender canvas with floating
// white cards — a Truist-branded read of the Fabric / Power BI dashboards.

export const T = {
  // Surfaces
  bg: '#f2eef8',
  bgTintA: '#f4eefb',
  bgTintB: '#efe9f7',
  bgTintC: '#f3edfa',
  card: '#ffffff',
  cardMuted: '#f7f5fb',
  border: '#e8e4f0',
  borderStrong: '#dad4e8',

  // Text
  ink: '#20143a',
  inkSoft: '#453a5c',
  muted: '#6d6685',
  faint: '#9d97b3',

  // Brand / primary — Truist Purple
  primary: '#4B286D',
  primaryDeep: '#301245',
  primarySoft: '#efe9f5',
  bar: '#6d4a91',
  barSoft: '#d8c9e6',

  // Categorical (currencies / series) — Truist purple/teal/violet/gold set
  gbp: '#4B286D', // Truist purple
  jpy: '#301245', // deep purple
  eur: '#00B5CC', // Truist teal
  usd: '#7C4D9F', // heritage purple
  cad: '#E0A03C', // gold

  // Semantic
  high: '#d6304a',
  highSoft: '#fbe9ee',
  med: '#c77d09',
  medSoft: '#fbf1e0',
  low: '#0f9488',
  lowSoft: '#e3f6f3',
  info: '#4B286D',
  infoSoft: '#efe9f5',

  radius: 12,
  radiusSm: 8,
  shadow: '0 1px 2px rgba(48,18,69,0.06), 0 6px 20px -12px rgba(48,18,69,0.20)',
  shadowLg: '0 10px 40px -16px rgba(48,18,69,0.30)',
} as const;

export const CURRENCY_COLORS: Record<string, string> = {
  GBP: T.gbp,
  JPY: T.jpy,
  EUR: T.eur,
  USD: T.usd,
  CAD: T.cad,
};

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatUsd(n: number): string {
  return usd0.format(n);
}

/** $90.8B / $486.3K style compact currency. */
export function formatCompactUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

export function timeAgo(d: Date | string): string {
  const then = typeof d === 'string' ? new Date(d) : d;
  const diff = Date.now() - then.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Map a semantic level to its color pair. */
export function levelColors(level: string): { fg: string; bg: string } {
  const l = level.toLowerCase();
  if (l === 'high' || l === 'critical') return { fg: T.high, bg: T.highSoft };
  if (l === 'medium' || l === 'med') return { fg: T.med, bg: T.medSoft };
  if (l === 'low') return { fg: T.low, bg: T.lowSoft };
  return { fg: T.info, bg: T.infoSoft };
}

/** Map a workflow status to a color pair. */
export function statusColors(status: string): { fg: string; bg: string } {
  const s = status.toLowerCase();
  if (['new', 'open', 'pending', 'planned'].includes(s)) return { fg: T.info, bg: T.infoSoft };
  if (['in review', 'monitoring', 'in progress'].includes(s)) return { fg: T.med, bg: T.medSoft };
  if (['escalated'].includes(s)) return { fg: T.high, bg: T.highSoft };
  if (['sar filed', 'action taken', 'approved', 'live'].includes(s))
    return { fg: T.usd, bg: '#f1e9f8' };
  if (['cleared', 'closed', 'executed', 'complete'].includes(s))
    return { fg: T.low, bg: T.lowSoft };
  if (['rejected'].includes(s)) return { fg: T.muted, bg: '#eeecf4' };
  return { fg: T.muted, bg: '#eeecf4' };
}
