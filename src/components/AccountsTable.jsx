import React, { useState } from 'react'
import { fCurrency, fCompact, fPct, fNumber } from '../utils/format.js'

const COLS = [
  { key: 'name',        label: 'Cliente',        render: (v, row) => <ClientCell row={row} /> },
  { key: 'balance',     label: 'Saldo Disponível',render: (v, row) => <BalanceCell row={row} />, align: 'right' },
  { key: 'spend',       label: 'Investido',       render: v => fCurrency(v), align: 'right' },
  { key: 'impressions', label: 'Impressões',      render: v => fCompact(v),  align: 'right' },
  { key: 'reach',       label: 'Alcance',         render: v => fCompact(v),  align: 'right' },
  { key: 'clicks',      label: 'Cliques',         render: v => fNumber(v),   align: 'right' },
  { key: 'ctr',         label: 'CTR',             render: v => fPct(v),      align: 'right' },
  { key: 'cpm',         label: 'CPM',             render: v => fCurrency(v), align: 'right' },
  { key: 'leads',       label: 'Leads',           render: v => fNumber(v),   align: 'right' },
  { key: 'cpr',         label: 'CPL',             render: v => v > 0 ? fCurrency(v) : '—', align: 'right' },
  { key: 'frequency',   label: 'Freq.',           render: v => (v || 0).toFixed(2), align: 'right' },
  { key: 'status',      label: 'Status',          render: (v, row) => <StatusBadge error={row.error} />, align: 'center' },
]

export default function AccountsTable({ data, loading }) {
  const [sort, setSort]   = useState({ key: 'spend', dir: -1 })
  const [search, setSearch] = useState('')

  const filtered = data
    .filter(r => (r.name || r.short || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => ((a[sort.key] || 0) - (b[sort.key] || 0)) * sort.dir)

  const toggleSort = (key) =>
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))

  const totals = data.reduce((acc, r) => ({
    spend: acc.spend + r.spend, impressions: acc.impressions + r.impressions,
    reach: acc.reach + r.reach, clicks: acc.clicks + r.clicks,
    leads: acc.leads + r.leads,
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0 })

  return (
    <div style={styles.wrap}>
      <div style={styles.tableHeader}>
        <div style={styles.tableTitle}>
          Resultados por Conta
          <span style={styles.count}>{data.length} contas</span>
        </div>
        <div style={styles.searchWrap}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            style={styles.searchInput}
            placeholder="Filtrar conta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  style={{ ...styles.th, textAlign: col.align || 'left', cursor: 'pointer' }}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sort.key === col.key && (
                    <span style={{ marginLeft: 4, color: 'var(--cyan)', fontSize: 9 }}>
                      {sort.dir === -1 ? '▼' : '▲'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.map((row, i) => (
                  <tr key={row.accountId || i} style={styles.tr}>
                    {COLS.map(col => (
                      <td key={col.key} style={{ ...styles.td, textAlign: col.align || 'left' }}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
          {!loading && data.length > 0 && (
            <tfoot>
              <tr style={styles.tfootRow}>
                <td style={{ ...styles.td, fontWeight: 700, color: 'var(--text)' }}>Total</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: 'var(--cyan)' }}>{fCurrency(totals.spend)}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{fCompact(totals.impressions)}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{fCompact(totals.reach)}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{fNumber(totals.clicks)}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {totals.impressions > 0 ? fPct((totals.clicks / totals.impressions) * 100) : '—'}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {totals.impressions > 0 ? fCurrency((totals.spend / totals.impressions) * 1000) : '—'}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{fNumber(totals.leads)}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {totals.leads > 0 ? fCurrency(totals.spend / totals.leads) : '—'}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function BalanceCell({ row }) {
  const { balance, spendCap, amountSpent } = row
  // Remaining budget: spend_cap - amount_spent (when cap exists), otherwise show prepaid balance
  const remaining = spendCap != null ? spendCap - (amountSpent || 0) : balance
  const hasData   = remaining != null && remaining > 0

  if (!hasData) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>

  const pct = spendCap ? Math.min(100, ((amountSpent || 0) / spendCap) * 100) : null
  const isLow = remaining < 500

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: isLow ? 'var(--red)' : 'var(--green)' }}>
        {fCurrency(remaining)}
      </div>
      {spendCap && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
          de {fCurrency(spendCap)}
        </div>
      )}
      {pct != null && (
        <div style={{ height: 3, background: 'var(--surface3)', borderRadius: 2, width: 60, marginLeft: 'auto' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isLow ? 'var(--red)' : 'var(--cyan)', borderRadius: 2 }} />
        </div>
      )}
    </div>
  )
}

function ClientCell({ row }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: `${row.color || '#00D4FF'}20`, border: `1px solid ${row.color || '#00D4FF'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: row.color || '#00D4FF', flexShrink: 0 }}>
        {row.initials || '??'}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{row.short || row.name || row.accountId}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.group}</div>
      </div>
    </div>
  )
}

function StatusBadge({ error }) {
  if (error) return <span style={{ ...styles.badge, background: 'rgba(255,77,106,0.12)', color: 'var(--red)' }} title={error}>Erro</span>
  return <span style={{ ...styles.badge, background: 'rgba(0,229,160,0.12)', color: 'var(--green)' }}>Ativo</span>
}

function SkeletonRow() {
  return (
    <tr style={styles.tr}>
      {COLS.map((_, i) => (
        <td key={i} style={styles.td}>
          <div style={{ height: 14, borderRadius: 4, background: 'var(--surface3)', width: i === 0 ? 120 : 60 }} />
        </td>
      ))}
    </tr>
  )
}

const styles = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', gap: 12 },
  tableTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  count: { fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface3)', padding: '2px 7px', borderRadius: 10 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  searchInput: { padding: '6px 10px 6px 26px', fontSize: 11, width: 180 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th: {
    padding: '10px 14px', fontSize: 10, fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase',
    background: 'var(--surface2)', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', userSelect: 'none',
  },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '12px 14px', fontSize: 12, color: 'var(--text-soft)', whiteSpace: 'nowrap' },
  tfootRow: { background: 'var(--surface2)', borderTop: '2px solid var(--border-md)' },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 },
}
