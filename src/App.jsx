import React, { useState, useEffect } from 'react'
import { ACCOUNTS } from './config/accounts.js'
import { useMetaInsights } from './hooks/useMetaInsights.js'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import KPICards from './components/KPICards.jsx'
import Charts from './components/Charts.jsx'
import AccountsTable from './components/AccountsTable.jsx'
import CampaignsSection from './components/CampaignsSection.jsx'
import ExportModal from './components/ExportModal.jsx'
import PresentationMode from './components/PresentationMode.jsx'

const ALL_IDS = ACCOUNTS.map(a => a.id)

export default function App() {
  const [selected, setSelected] = useState(ALL_IDS)
  const [preset, setPreset]     = useState('last_30d')
  const [showExport, setShowExport] = useState(false)
  const [showPresent, setShowPresent] = useState(false)
  const [theme, setTheme]       = useState('dark')

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
  }, [theme])

  const { data, totals, daily, daily6m, accountInfo, campaigns, loading, error, refetch, lastFetch } = useMetaInsights(selected, preset)

  const errCount = data.filter(r => r.error).length

  return (
    <div style={styles.root}>
      <Sidebar selected={selected} onSelect={setSelected} accountInfo={accountInfo} />

      <div style={styles.main}>
        <Toolbar preset={preset} onPreset={setPreset} onExport={() => setShowExport(true)} onPresent={() => setShowPresent(true)} loading={loading} accountData={data} theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />

        <div style={styles.content}>
          <Header alertCount={errCount} lastFetch={lastFetch} onRefresh={refetch} loading={loading} />

          {error && (
            <div style={styles.errorBanner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div style={styles.overview}>
            <div style={styles.overviewLabel}>
              {selected.length === ALL_IDS.length ? 'Visão Geral' : `${selected.length} cliente${selected.length !== 1 ? 's' : ''} selecionado${selected.length !== 1 ? 's' : ''}`}
              <span style={styles.periodBadge}>{presetLabel(preset)}</span>
              {loading && <span style={styles.loadingDots}>Carregando...</span>}
            </div>

            {selected.length === 0
              ? <div style={styles.emptyState}>Selecione ao menos um cliente na barra lateral para ver os dados.</div>
              : <>
                  <KPICards totals={totals} daily={daily} loading={loading} />
                  <Charts daily={daily} daily6m={daily6m} accountData={data} />
                  <CampaignsSection campaigns={campaigns.filter(c => selected.includes(c.accountId))} loading={loading} />
                  <AccountsTable data={data} loading={loading} />
                </>
            }
          </div>
        </div>
      </div>

      {showPresent && (
        <PresentationMode
          data={data}
          campaigns={campaigns}
          preset={preset}
          onClose={() => setShowPresent(false)}
        />
      )}

      {showExport && (
        <ExportModal
          data={data}
          totals={totals}
          preset={preset}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

function presetLabel(preset) {
  const map = {
    today: 'Hoje', yesterday: 'Ontem', last_7d: '7 dias',
    last_14d: '14 dias', last_30d: '30 dias',
    this_month: 'Este mês', last_month: 'Mês anterior',
  }
  return map[preset] || preset
}

const styles = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' },
  content: { flex: 1, overflowY: 'auto', padding: '0 0 24px' },
  overview: { padding: '16px 28px 0' },
  overviewLabel: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 18, fontWeight: 800, color: 'var(--text)',
    marginBottom: 16, marginTop: 8,
  },
  periodBadge: {
    fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    padding: '3px 10px', borderRadius: 20, fontWeight: 500,
  },
  loadingDots: { fontSize: 11, color: 'var(--cyan)', animation: 'pulse 1s infinite', fontWeight: 500 },
  emptyState: {
    marginTop: 60, textAlign: 'center', color: 'var(--text-muted)',
    fontSize: 14, padding: '40px 0',
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '12px 28px 0',
    background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 12, color: 'var(--red)',
  },
}
