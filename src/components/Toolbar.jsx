import React from 'react'
import { DATE_PRESETS } from '../config/accounts.js'
import AlertsBell from './AlertsBell.jsx'

export default function Toolbar({ preset, onPreset, onExport, onPresent, loading, accountData = [] }) {
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
        </div>
      </div>

      <div style={styles.right}>
        <AlertsBell accountData={accountData} />
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
  left: { display: 'flex', alignItems: 'center', gap: 10 },
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
