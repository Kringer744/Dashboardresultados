import React, { useState, useRef, useEffect } from 'react'
import { fCurrency } from '../utils/format.js'

const THRESHOLD_WARNING  = 100  // abaixo disso → alerta amarelo
const THRESHOLD_CRITICAL = 0    // zerado → alerta vermelho

function getAlerts(accountData) {
  const critical = []
  const warning  = []

  for (const acc of accountData) {
    const remaining = acc.spendCap != null
      ? acc.spendCap - (acc.amountSpent || 0)
      : (acc.balance || 0)

    if (remaining <= THRESHOLD_CRITICAL) {
      critical.push({ ...acc, remaining })
    } else if (remaining <= THRESHOLD_WARNING) {
      warning.push({ ...acc, remaining })
    }
  }

  return { critical, warning }
}

export default function AlertsBell({ accountData }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { critical, warning } = getAlerts(accountData)
  const total = critical.length + warning.length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (accountData.length === 0) return null

  return (
    <div ref={ref} style={styles.wrap}>
      <button
        style={{ ...styles.bell, ...(total > 0 ? styles.bellActive : {}) }}
        onClick={() => setOpen(o => !o)}
        title={total > 0 ? `${total} alerta${total > 1 ? 's' : ''} de saldo` : 'Sem alertas'}
      >
        <BellIcon active={total > 0} />
        {total > 0 && (
          <span style={{ ...styles.badge, background: critical.length > 0 ? 'var(--red)' : 'var(--yellow)' }}>
            {total}
          </span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropHeader}>
            <span style={styles.dropTitle}>Alertas de Saldo</span>
            <span style={styles.dropSub}>{total} conta{total !== 1 ? 's' : ''} com atenção</span>
          </div>

          {total === 0 && (
            <div style={styles.empty}>
              <span style={{ fontSize: 22 }}>✓</span>
              <span>Todas as contas com saldo ok</span>
            </div>
          )}

          {critical.length > 0 && (
            <div style={styles.group}>
              <div style={styles.groupLabel}>
                <span style={{ ...styles.groupDot, background: 'var(--red)' }} />
                SEM SALDO — {critical.length} conta{critical.length !== 1 ? 's' : ''}
              </div>
              {critical.map(acc => (
                <AlertItem key={acc.accountId} acc={acc} type="critical" />
              ))}
            </div>
          )}

          {warning.length > 0 && (
            <div style={styles.group}>
              <div style={styles.groupLabel}>
                <span style={{ ...styles.groupDot, background: 'var(--yellow)', animation: 'pulse 1.5s infinite' }} />
                SALDO BAIXO (&lt; R$100) — {warning.length} conta{warning.length !== 1 ? 's' : ''}
              </div>
              {warning.map(acc => (
                <AlertItem key={acc.accountId} acc={acc} type="warning" />
              ))}
            </div>
          )}

          <div style={styles.dropFooter}>
            Limite de alerta: R$ {THRESHOLD_WARNING},00 · Atualizado ao carregar
          </div>
        </div>
      )}
    </div>
  )
}

function AlertItem({ acc, type }) {
  const isCritical = type === 'critical'
  const color = isCritical ? 'var(--red)' : 'var(--yellow)'
  const bgColor = isCritical ? 'rgba(255,77,106,0.06)' : 'rgba(255,184,0,0.06)'
  const borderColor = isCritical ? 'rgba(255,77,106,0.2)' : 'rgba(255,184,0,0.2)'

  return (
    <div style={{ ...styles.item, background: bgColor, borderColor }}>
      <div style={{ ...styles.itemAvatar, background: `${acc.color || '#00D4FF'}18`, border: `1px solid ${acc.color || '#00D4FF'}33`, color: acc.color || '#00D4FF' }}>
        {acc.initials || '??'}
      </div>
      <div style={styles.itemInfo}>
        <div style={styles.itemName}>{acc.short || acc.name}</div>
        <div style={styles.itemGroup}>{acc.group}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color }}>
          {isCritical ? 'R$ 0,00' : fCurrency(acc.remaining)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          {isCritical ? 'Sem saldo' : 'Restante'}
        </div>
      </div>
    </div>
  )
}

function BellIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      style={{ animation: active ? 'bellShake 2s ease infinite' : 'none' }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {active && <circle cx="18" cy="5" r="3" fill="var(--red)" stroke="var(--surface)" strokeWidth="1.5"/>}
    </svg>
  )
}

const styles = {
  wrap: { position: 'relative' },
  bell: {
    position: 'relative',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', padding: '7px 9px', borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    transition: 'all 0.2s',
  },
  bellActive: {
    border: '1px solid rgba(255,77,106,0.4)',
    color: 'var(--red)',
    background: 'rgba(255,77,106,0.08)',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 16, height: 16, borderRadius: 8,
    fontSize: 9, fontWeight: 800, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px',
    border: '1.5px solid var(--bg)',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 320, background: 'var(--surface)',
    border: '1px solid var(--border-md)',
    borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    zIndex: 200, overflow: 'hidden',
    animation: 'fadeIn 0.15s ease',
  },
  dropHeader: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
  },
  dropTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  dropSub: { fontSize: 11, color: 'var(--text-muted)' },
  group: { padding: '10px 0 4px' },
  groupLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 9, fontWeight: 700, letterSpacing: 1,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    padding: '0 16px 6px',
  },
  groupDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10,
    margin: '0 8px 4px', padding: '10px 12px',
    borderRadius: 8, border: '1px solid',
  },
  itemAvatar: {
    width: 30, height: 30, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 800, flexShrink: 0,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemGroup: { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '24px 16px', color: 'var(--green)', fontSize: 12, fontWeight: 600,
  },
  dropFooter: {
    padding: '8px 16px', borderTop: '1px solid var(--border)',
    fontSize: 10, color: 'var(--text-muted)',
  },
}
