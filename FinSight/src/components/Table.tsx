import type { CSSProperties, ReactNode } from 'react';
import { T } from '../theme';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  th?: CSSProperties;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty = 'No records.',
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  return (
    <div className="scroll-y" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: c.align ?? 'left',
                  padding: '10px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: `1px solid ${T.border}`,
                  background: T.cardMuted,
                  position: 'sticky',
                  top: 0,
                  whiteSpace: 'nowrap',
                  width: c.width,
                  ...c.th,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: T.faint, fontSize: 13 }}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f9fe')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '12px 14px',
                      textAlign: c.align ?? 'left',
                      borderBottom: `1px solid ${T.border}`,
                      color: T.inkSoft,
                      verticalAlign: 'middle',
                    }}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder = 'Search…',
  children,
  right,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
      <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.faint }}>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="m14 14 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', borderRadius: T.radiusSm, border: `1px solid ${T.borderStrong}`, background: '#fff', padding: '8px 12px 8px 32px', fontSize: 13, color: T.ink, outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>
      {children}
      <div style={{ marginLeft: 'auto' }}>{right}</div>
    </div>
  );
}
