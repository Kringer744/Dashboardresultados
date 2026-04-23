import React, { useState } from 'react'
import { exportCSV, exportPDF } from '../utils/export.js'

export default function ExportModal({ data, totals, preset, onClose }) {
  const [exporting, setExporting] = useState(null)

  const handle = async (type) => {
    setExporting(type)
    try {
      if (type === 'csv') exportCSV(data, preset)
      else await exportPDF(data, totals, preset)
    } finally {
      setExporting(null)
      onClose()
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Exportar Relatório</div>
            <div style={styles.sub}>{data.length} contas · período: {preset}</div>
          </div>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>

        <div style={styles.options}>
          <button style={{ ...styles.option, ...(exporting === 'csv' ? styles.optionLoading : {}) }} onClick={() => handle('csv')} disabled={!!exporting}>
            <div style={{ ...styles.optionIcon, background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#00E5A0" strokeWidth="2"/>
                <polyline points="14 2 14 8 20 8" stroke="#00E5A0" strokeWidth="2"/>
                <line x1="8" y1="13" x2="16" y2="13" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="17" x2="16" y2="17" stroke="#00E5A0" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={styles.optionTitle}>Planilha CSV</div>
              <div style={styles.optionDesc}>Abre no Excel, Google Sheets, etc.</div>
            </div>
            {exporting === 'csv' && <Spinner color="#00E5A0" />}
          </button>

          <button style={{ ...styles.option, ...(exporting === 'pdf' ? styles.optionLoading : {}) }} onClick={() => handle('pdf')} disabled={!!exporting}>
            <div style={{ ...styles.optionIcon, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#00D4FF" strokeWidth="2"/>
                <polyline points="14 2 14 8 20 8" stroke="#00D4FF" strokeWidth="2"/>
                <line x1="8" y1="13" x2="16" y2="13" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="17" x2="16" y2="17" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={styles.optionTitle}>Relatório PDF</div>
              <div style={styles.optionDesc}>Com branding Fluxo, KPIs e tabela completa</div>
            </div>
            {exporting === 'pdf' && <Spinner color="#00D4FF" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function Spinner({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.3"/>
      <path d="M12 3a9 9 0 0 1 9 9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border-md)',
    borderRadius: 16, padding: 24, width: 380,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.2s ease',
  },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text)' },
  sub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 3 },
  close: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: 0 },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 12,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s',
  },
  optionLoading: { opacity: 0.7 },
  optionIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  optionDesc: { fontSize: 11, color: 'var(--text-muted)' },
}
