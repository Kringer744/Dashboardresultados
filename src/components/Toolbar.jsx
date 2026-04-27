import React from 'react'
import { DATE_PRESETS } from '../config/accounts.js'
import AlertsBell from './AlertsBell.jsx'

export default function Toolbar({ preset, onPreset, customRange, onCustomRange, onExport, onPresent, loading, accountData = [], theme = 'dark', onToggleTheme }) {
  const isCustom = preset === 'custom'

  return (
    <div style={styles.toolbar}>
      <div style={styles.left}>
        <span style={styles.label}>Período</span>
        <div style={styles.presets}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.value}
              style={{ ...styles.presetBtn, ...(preset === p.value ? styles.presetActive : {}) }}
              onClick={() => onPreset(p.value)}
            >
              {p.label}
            </button>
          ))}
          <button
            style={{ ...styles.presetBtn, ...(isCustom ? styles.presetActive : {}), display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => onPreset('custom')}
            title="Selecionar datas específicas"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Personalizar
          </button>
        </div>
        {isCustom && (
          <div style={styles.dateInputs}>
            <input
              type="date"
              style={styles.dateInput}
              value={customRange?.since || ''}
              max={customRange?.until || undefined}
              onChange={e => onCustomRange({ ...customRange, since: e.target.value })}
            />
            <span style={styles.dateArrow}>→</span>
            <input
              type="date"
              style={styles.dateInput}
              value={customRange?.until || ''}
              min={customRange?.since || undefined}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => onCustomRange({ ...customRange, until: e.target.value })}
            />
          </div>
        )}
      </div>

      <div style={styles.right}>
        <AlertsBell accountData={accountData} />
        <button style={styles.themeBtn} onClick={onToggleTheme} title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
          {theme === 'dark'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </button>
        <button style={styles.presentBtn} onClick={onPresent} disabled={loading}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Modo Apresentação
        </button>
        <button style={styles.exportBtn} onClick={onExport} disabled={loading}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Exportar Relatório
        </button>
      </div>
    </div>
  )
}

const styles = {
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 28px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexWrap: 'wrap', gap: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  dateInputs: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 10px',
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.25)',
    borderRadius: 8,
  },
  dateInput: {
    padding: '4px 8px', fontSize: 11,
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text)',
    cursor: 'pointer',
    colorScheme: 'auto',
  },
  dateArrow: { color: 'var(--cyan)', fontSize: 12, fontWeight: 700 },
  label: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 },
  presets: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  presetBtn: {
    padding: '5px 11px', borderRadius: 7,
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-soft)', fontSize: 11, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  presetActive: {
    background: 'rgba(0,212,255,0.12)',
    border: '1px solid rgba(0,212,255,0.35)',
    color: 'var(--cyan)',
    fontWeight: 600,
  },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  themeBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 13px', borderRadius: 8,
    background: 'var(--surface2)',
    border: '1px solid var(--border-md)',
    color: 'var(--text-soft)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  presentBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 8,
    background: 'rgba(123,97,255,0.1)',
    border: '1px solid rgba(123,97,255,0.3)',
    color: '#7B61FF', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 16px', borderRadius: 8,
    background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.25)',
    color: 'var(--cyan)', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
}
