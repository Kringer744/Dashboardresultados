import React from 'react'

export default function Header({ alertCount, lastFetch, onRefresh, loading }) {
  return (
    <div style={styles.header}>
      <div style={styles.left}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" stroke="#00D4FF" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={styles.title}>
            Dashboard
            {alertCount > 0 && <span style={styles.badge}>{alertCount}</span>}
          </div>
          <div style={styles.subtitle}>Acompanhe os resultados dos seus clientes no Meta Ads</div>
        </div>
      </div>

      <div style={styles.right}>
        {lastFetch && (
          <span style={styles.lastUpdate}>
            Atualizado {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{ ...styles.refreshBtn, opacity: loading ? 0.5 : 1 }}
          title="Atualizar dados"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Atualizar
        </button>
      </div>
    </div>
  )
}

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px 0',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: 700, color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  badge: {
    background: 'var(--cyan)', color: '#000',
    fontSize: 11, fontWeight: 700,
    padding: '1px 6px', borderRadius: 20,
  },
  subtitle: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  lastUpdate: { fontSize: 11, color: 'var(--text-muted)' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--surface2)',
    border: '1px solid var(--border-md)',
    color: 'var(--text-soft)',
    padding: '6px 12px', borderRadius: 8,
    fontSize: 12, fontWeight: 500,
    transition: 'all 0.2s',
  },
}
