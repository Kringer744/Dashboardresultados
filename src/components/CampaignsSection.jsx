import React, { useState } from 'react'
import { fCurrency, fCompact, fNumber } from '../utils/format.js'

const OBJECTIVE_LABEL = {
  OUTCOME_LEADS:           'Leads',
  OUTCOME_TRAFFIC:         'Tráfego',
  OUTCOME_AWARENESS:       'Reconhecimento',
  OUTCOME_ENGAGEMENT:      'Engajamento',
  OUTCOME_SALES:           'Vendas',
  OUTCOME_APP_PROMOTION:   'App',
  LEAD_GENERATION:         'Leads',
  CONVERSIONS:             'Conversões',
  LINK_CLICKS:             'Cliques',
  BRAND_AWARENESS:         'Alcance',
  REACH:                   'Alcance',
  VIDEO_VIEWS:             'Vídeos',
  MESSAGES:                'Mensagens',
}

export default function CampaignsSection({ campaigns, loading }) {
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState({ key: 'spend', dir: -1 })

  const active  = campaigns.filter(c => c.status === 'ACTIVE').length
  const paused  = campaigns.filter(c => c.status === 'PAUSED').length

  const filtered = campaigns
    .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) ||
                 (c.short || c.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => ((a[sort.key] || 0) - (b[sort.key] || 0)) * sort.dir)

  const toggleSort = (key) =>
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div style={styles.title}>Campanhas</div>
          <div style={styles.pills}>
            <span style={{ ...styles.pill, background: 'rgba(0,229,160,0.12)', color: 'var(--green)', border: '1px solid rgba(0,229,160,0.25)' }}>
              <span style={styles.dot} /> {active} ativas
            </span>
            <span style={{ ...styles.pill, background: 'rgba(255,184,0,0.1)', color: 'var(--yellow)', border: '1px solid rgba(255,184,0,0.25)' }}>
              ⏸ {paused} pausadas
            </span>
          </div>
        </div>

        <div style={styles.controls}>
          <div style={styles.statusTabs}>
            {[['ALL','Todas'], ['ACTIVE','Ativas'], ['PAUSED','Pausadas']].map(([v, l]) => (
              <button
                key={v}
                style={{ ...styles.tab, ...(statusFilter === v ? styles.tabActive : {}) }}
                onClick={() => setStatusFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={styles.searchWrap}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Buscar campanha..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Campanha</th>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>Objetivo</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('dailyBudget')}>
                Orçamento/dia {sort.key === 'dailyBudget' && <SortArrow dir={sort.dir} />}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('budgetRemaining')}>
                Saldo restante {sort.key === 'budgetRemaining' && <SortArrow dir={sort.dir} />}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('spend')}>
                Investido {sort.key === 'spend' && <SortArrow dir={sort.dir} />}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('impressions')}>
                Impressões {sort.key === 'impressions' && <SortArrow dir={sort.dir} />}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('leads')}>
                Leads {sort.key === 'leads' && <SortArrow dir={sort.dir} />}
              </th>
              <th style={{ ...styles.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('cpr')}>
                CPL {sort.key === 'cpr' && <SortArrow dir={sort.dir} />}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? <tr><td colSpan={10} style={styles.empty}>Nenhuma campanha encontrada</td></tr>
                : filtered.map(c => <CampaignRow key={c.id} campaign={c} />)
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CampaignRow({ campaign: c }) {
  const isActive = c.status === 'ACTIVE'
  const budget = c.dailyBudget || c.lifetimeBudget
  const budgetLabel = c.dailyBudget ? '/dia' : c.lifetimeBudget ? 'vitalício' : null

  return (
    <tr style={styles.tr}>
      <td style={{ ...styles.td, maxWidth: 240 }}>
        <div style={styles.campaignName} title={c.name}>{c.name}</div>
        <div style={styles.campaignId}>ID: {c.id}</div>
      </td>
      <td style={styles.td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: `${c.color || '#00D4FF'}20`, border: `1px solid ${c.color || '#00D4FF'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: c.color || '#00D4FF' }}>
            {c.initials || '??'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-soft)' }}>{c.short || c.group}</span>
        </div>
      </td>
      <td style={styles.td}>
        <span style={styles.objective}>
          {OBJECTIVE_LABEL[c.objective] || c.objective || '—'}
        </span>
      </td>
      <td style={styles.td}>
        <span style={{
          ...styles.statusBadge,
          background: isActive ? 'rgba(0,229,160,0.1)' : 'rgba(255,184,0,0.1)',
          color: isActive ? 'var(--green)' : 'var(--yellow)',
          border: `1px solid ${isActive ? 'rgba(0,229,160,0.25)' : 'rgba(255,184,0,0.25)'}`,
        }}>
          {isActive ? '● Ativa' : '⏸ Pausada'}
        </span>
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        {budget ? (
          <span style={{ fontSize: 12, color: 'var(--text)' }}>
            {fCurrency(budget)}
            {budgetLabel && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>{budgetLabel}</span>}
          </span>
        ) : '—'}
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        {c.budgetRemaining != null && c.budgetRemaining > 0 ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: c.budgetRemaining < 100 ? 'var(--red)' : 'var(--green)' }}>
            {fCurrency(c.budgetRemaining)}
          </span>
        ) : '—'}
      </td>
      <td style={{ ...styles.td, textAlign: 'right', color: 'var(--text)', fontWeight: 600 }}>
        {c.spend > 0 ? fCurrency(c.spend) : '—'}
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        {c.impressions > 0 ? fCompact(c.impressions) : '—'}
      </td>
      <td style={{ ...styles.td, textAlign: 'right', color: 'var(--cyan)', fontWeight: 600 }}>
        {c.leads > 0 ? fNumber(c.leads) : '—'}
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        {c.cpr > 0 ? fCurrency(c.cpr) : '—'}
      </td>
    </tr>
  )
}

function SortArrow({ dir }) {
  return <span style={{ color: 'var(--cyan)', fontSize: 9, marginLeft: 2 }}>{dir === -1 ? '▼' : '▲'}</span>
}

function SkeletonRow() {
  return (
    <tr style={styles.tr}>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} style={styles.td}>
          <div style={{ height: 13, borderRadius: 4, background: 'var(--surface3)', width: i === 0 ? 160 : i === 1 ? 80 : 50 }} />
        </td>
      ))}
    </tr>
  )
}

const styles = {
  wrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24 },
  header: { padding: '14px 18px', borderBottom: '1px solid var(--border)' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  pills: { display: 'flex', gap: 6 },
  pill: { fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s infinite', display: 'inline-block' },
  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  statusTabs: { display: 'flex', gap: 4 },
  tab: { padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 500, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' },
  tabActive: { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--cyan)', fontWeight: 700 },
  searchWrap: { position: 'relative', marginLeft: 'auto' },
  searchIcon: { position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  searchInput: { padding: '6px 10px 6px 26px', fontSize: 11, width: 200 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th: { padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', userSelect: 'none' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '11px 14px', fontSize: 12, color: 'var(--text-soft)', whiteSpace: 'nowrap' },
  campaignName: { fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220, whiteSpace: 'nowrap' },
  campaignId: { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  objective: { fontSize: 10, fontWeight: 600, background: 'rgba(123,97,255,0.1)', color: '#7B61FF', border: '1px solid rgba(123,97,255,0.2)', padding: '2px 7px', borderRadius: 5 },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 },
  empty: { padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 },
}
