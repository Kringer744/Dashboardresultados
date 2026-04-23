import React, { useState } from 'react'
import { ACCOUNTS, GROUPS } from '../config/accounts.js'

export default function Sidebar({ selected, onSelect, accountInfo = {} }) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})

  const filtered = ACCOUNTS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const allIds = ACCOUNTS.map(a => a.id)
  const isAll  = selected.length === allIds.length
  const isNone = selected.length === 0

  const selectAll  = () => onSelect(allIds)
  const clearAll   = () => onSelect([])

  const toggleGroup = (g) => setCollapsed(p => ({ ...p, [g]: !p[g] }))

  const toggleAccount = (id) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(x => x !== id))
    } else {
      onSelect([...selected, id])
    }
  }

  const toggleGroupAccounts = (group) => {
    const ids = ACCOUNTS.filter(a => a.group === group).map(a => a.id)
    const allSelected = ids.every(id => selected.includes(id))
    if (allSelected) {
      onSelect(selected.filter(id => !ids.includes(id)))
    } else {
      onSelect([...new Set([...selected, ...ids])])
    }
  }

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <img src="/logo.png" alt="Fluxo" style={styles.logoImg} />
        <div>
          <div style={styles.logoText}>Flu<span style={styles.logoCyan}>xo</span></div>
          <div style={styles.logoSub}>Digital & Tech</div>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navSection}>
          <div style={{ ...styles.navLabel, padding: '8px 16px 4px' }}>Geral</div>

          {/* Visão Geral — seleciona todos */}
          <button
            style={{ ...styles.navItem, ...(isAll ? styles.navItemActive : {}) }}
            onClick={selectAll}
            title="Ver todos os clientes"
          >
            <span style={{ ...styles.navDot, background: 'var(--cyan)' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Visão Geral</span>
            {isAll && <span style={styles.activeDot} />}
          </button>
        </div>

        <div style={styles.navSection}>
          {/* Cabeçalho Clientes + botões */}
          <div style={styles.clientsHeader}>
            <span style={styles.navLabel} >Clientes</span>
            <div style={styles.selectionActions}>
              {!isNone && (
                <button style={styles.actionBtn} onClick={clearAll} title="Desmarcar todos">
                  Limpar
                </button>
              )}
              {!isAll && (
                <button style={{ ...styles.actionBtn, ...styles.actionBtnSelect }} onClick={selectAll} title="Selecionar todos">
                  Todos
                </button>
              )}
            </div>
          </div>
          {isNone && (
            <div style={styles.emptyHint}>
              Nenhum cliente selecionado.<br/>Clique para selecionar.
            </div>
          )}

          {search
            ? filtered.map(a => (
                <AccountItem key={a.id} account={a} active={selected.includes(a.id)} onToggle={toggleAccount} info={accountInfo[a.id]} />
              ))
            : GROUPS.map(group => {
                const accounts = ACCOUNTS.filter(a => a.group === group)
                const anySelected = accounts.some(a => selected.includes(a.id))
                const allGroupSelected = accounts.every(a => selected.includes(a.id))
                const isOpen = !collapsed[group]

                return (
                  <div key={group}>
                    <button
                      style={{ ...styles.navItem, ...(anySelected && !allGroupSelected ? styles.navItemPartial : allGroupSelected ? styles.navItemActive : {}) }}
                      onClick={() => toggleGroupAccounts(group)}
                    >
                      <span style={{ ...styles.navDot, background: accounts[0].color, opacity: anySelected ? 1 : 0.3 }} />
                      <GroupAvatar group={group} color={accounts[0].color} />
                      <span style={styles.groupName}>{group}</span>
                      <span style={styles.groupCount}>{accounts.length}</span>
                      <button
                        style={styles.chevronBtn}
                        onClick={e => { e.stopPropagation(); toggleGroup(group) }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {allGroupSelected && <span style={styles.activeDot} />}
                    </button>

                    {isOpen && accounts.map(a => (
                      <AccountItem key={a.id} account={a} active={selected.includes(a.id)} onToggle={toggleAccount} nested info={accountInfo[a.id]} />
                    ))}
                  </div>
                )
              })
          }
        </div>
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerBadge}>
          <span style={styles.footerDot} />
          Meta Ads API v21.0
        </div>
      </div>
    </aside>
  )
}

function GroupAvatar({ group, color }) {
  const initials = group.slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function AccountItem({ account, active, onToggle, nested, info }) {
  const balance = info?.balance
  const fmt = (v) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v.toFixed(0)}`
  return (
    <button
      style={{ ...styles.navItem, ...(nested ? styles.nested : {}), ...(active ? styles.navItemActive : {}) }}
      onClick={() => onToggle(account.id)}
    >
      {nested && <span style={styles.nestedLine} />}
      <div style={{ width: 20, height: 20, borderRadius: 5, background: `${account.color}22`, border: `1px solid ${account.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: account.color, flexShrink: 0 }}>
        {account.initials}
      </div>
      <span style={styles.accountName}>{account.short}</span>
      {balance != null && balance > 0 && (
        <span style={styles.balanceBadge}>{fmt(balance)}</span>
      )}
      {active && <span style={styles.activeDot} />}
    </button>
  )
}

const styles = {
  sidebar: {
    width: 230, minWidth: 230,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 16px 16px',
    borderBottom: '1px solid var(--border)',
  },
  logoImg: { width: 32, height: 32, objectFit: 'contain' },
  logoText: { fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.5 },
  logoCyan: { color: 'var(--cyan)' },
  logoSub: { fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 1 },
  searchWrap: {
    position: 'relative', margin: '12px 12px 4px',
  },
  searchIcon: {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '8px 10px 8px 30px',
    fontSize: 12, borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
  },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  navSection: { marginBottom: 4 },
  navLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' },
  navItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px 7px 16px',
    background: 'none', border: 'none',
    color: 'var(--text-soft)', fontSize: 12, fontWeight: 400,
    cursor: 'pointer', textAlign: 'left',
    borderLeft: '2px solid transparent',
    transition: 'all 0.15s',
    position: 'relative',
  },
  navItemActive: {
    background: 'rgba(0,212,255,0.07)',
    color: 'var(--cyan)',
    borderLeftColor: 'var(--cyan)',
    fontWeight: 600,
  },
  navItemPartial: {
    borderLeftColor: 'rgba(0,212,255,0.4)',
  },
  navDot: {
    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
  },
  activeDot: {
    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
    background: 'var(--cyan)', flexShrink: 0,
  },
  groupName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  groupCount: { fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface3)', padding: '1px 5px', borderRadius: 4 },
  chevronBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex' },
  nested: { paddingLeft: 28 },
  nestedLine: {
    position: 'absolute', left: 22, width: 8, height: 1,
    background: 'var(--border-md)',
  },
  accountName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 },
  footer: { padding: '12px 16px', borderTop: '1px solid var(--border)' },
  footerBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10, color: 'var(--text-muted)',
  },
  footerDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--green)', animation: 'pulse 1.5s infinite',
  },
  clientsHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px 4px',
  },
  selectionActions: { display: 'flex', gap: 4 },
  actionBtn: {
    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
    background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)',
    color: 'var(--red)', cursor: 'pointer',
  },
  actionBtnSelect: {
    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
    color: 'var(--cyan)',
  },
  emptyHint: {
    fontSize: 11, color: 'var(--text-muted)', padding: '10px 16px 6px',
    lineHeight: 1.6,
  },
  resetBadge: {
    marginLeft: 'auto', fontSize: 9, fontWeight: 700,
    background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)',
    color: 'var(--cyan)', padding: '1px 6px', borderRadius: 10,
    whiteSpace: 'nowrap',
  },
  balanceBadge: {
    fontSize: 9, fontWeight: 700,
    background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
    color: 'var(--green)', padding: '1px 5px', borderRadius: 6,
    whiteSpace: 'nowrap', flexShrink: 0,
  },
}
