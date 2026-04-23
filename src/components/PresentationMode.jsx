import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ComposedChart, Area, Line, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { fCurrency, fCompact, fNumber, fPct, fDate } from '../utils/format.js'

const DURATION = 180

/* ─── helpers ─────────────────────────────────────────────────── */
function presetLabel(p) {
  return ({ today:'Hoje', yesterday:'Ontem', last_7d:'7 dias', last_14d:'14 dias', last_30d:'30 dias', this_month:'Este mês', last_month:'Mês anterior' })[p] || p
}
function useClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return t
}

/* ─── main component ───────────────────────────────────────────── */
export default function PresentationMode({ data, campaigns, preset, onClose }) {
  const accounts = data.filter(a => !a.error && (a.spend > 0 || a.impressions > 0 || a.spendCap != null))

  const [idx,     setIdx]     = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [phase,   setPhase]   = useState('in')
  const clock = useClock()

  const goTo = useCallback((i) => {
    setPhase('out')
    setTimeout(() => { setIdx(i); setElapsed(0); setPhase('in') }, 420)
  }, [])
  const next = useCallback(() => goTo((idx + 1) % accounts.length), [idx, accounts.length, goTo])
  const prev = useCallback(() => goTo((idx - 1 + accounts.length) % accounts.length), [idx, accounts.length, goTo])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= DURATION) {
          setPhase('out')
          setTimeout(() => { setIdx(i => (i + 1) % accounts.length); setElapsed(0); setPhase('in') }, 420)
          return 0
        }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [paused, accounts.length])

  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === ' ')          setPaused(p => !p)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [next, prev, onClose])

  if (!accounts.length) return (
    <div style={S.root}><p style={{ color: '#555' }}>Sem dados.</p><button style={S.closeFallback} onClick={onClose}>Fechar</button></div>
  )

  const acc   = accounts[idx]
  const next_ = accounts[(idx + 1) % accounts.length]
  const C     = acc.color || '#00D4FF'

  const remaining = acc.spendCap != null ? acc.spendCap - (acc.amountSpent || 0) : (acc.balance || 0)
  const cpr       = acc.leads > 0 ? acc.spend / acc.leads : 0
  const cpm       = acc.impressions > 0 ? (acc.spend / acc.impressions) * 1000 : 0
  const ctr       = acc.ctr || 0
  const isZero    = remaining <= 0
  const isLow     = !isZero && remaining < 100
  const balC      = isZero ? '#FF4D6A' : isLow ? '#FFB800' : '#00E5A0'

  const camps     = campaigns.filter(c => c.accountId === acc.accountId)
  const active    = camps.filter(c => c.status === 'ACTIVE')
  const paused_   = camps.filter(c => c.status === 'PAUSED')

  // chart: daily spend + leads (last 21 days)
  const chart = (acc.daily || []).slice(-21).map(d => ({
    date:  fDate(d.date),
    spend: d.spend,
    leads: d.leads,
  }))

  // top campaigns by spend
  const topCamps = [...camps].sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 5)
  const maxSpend = topCamps[0]?.spend || 1

  const timeLeft = DURATION - elapsed
  const mins     = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs     = String(timeLeft % 60).padStart(2, '0')
  const progress = (elapsed / DURATION) * 100

  const fadeStyle = {
    opacity:   phase === 'in' ? 1 : 0,
    transform: phase === 'in' ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.42s ease, transform 0.42s ease',
  }

  const clockStr = clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr  = clock.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <div style={{ ...S.root, '--C': C }}>
      {/* dot-grid bg */}
      <div style={S.dotGrid} />
      {/* spotlight */}
      <div style={{ ...S.spotlight, background: `radial-gradient(ellipse 900px 600px at 22% 55%, ${C}14 0%, transparent 65%)` }} />
      <div style={{ ...S.spotlight, background: `radial-gradient(ellipse 500px 400px at 85% 15%, ${C}08 0%, transparent 70%)` }} />
      {/* accent bar */}
      <div style={{ ...S.accent, background: `linear-gradient(180deg, ${C} 0%, ${C}60 60%, transparent 100%)` }} />

      {/* ══ TOP BAR ══ */}
      <header style={S.header}>
        <div style={S.hLeft}>
          <div style={S.clockBlock}>
            <span style={S.clockTime}>{clockStr}</span>
            <span style={S.clockDate}>{dateStr}</span>
          </div>
          <div style={S.hSep} />
          <img src="/logo.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.85 }} />
          <span style={S.hBrand}>Flu<span style={{ color: C }}>xo</span></span>
          <div style={{ ...S.modeBadge, background: `${C}15`, borderColor: `${C}30`, color: C }}>
            MODO APRESENTAÇÃO
          </div>
        </div>

        <div style={S.hDots}>
          {accounts.map((a, i) => (
            <button key={`d${i}`} onClick={() => goTo(i)} title={a.short} style={{
              ...S.dot,
              width:      i === idx ? 26 : 6,
              background: i === idx ? a.color : 'rgba(255,255,255,0.14)',
              boxShadow:  i === idx ? `0 0 12px ${a.color}` : 'none',
            }} />
          ))}
        </div>

        <div style={S.hRight}>
          <span style={S.hCount}>{idx + 1}<span style={{ opacity: 0.35 }}>/{accounts.length}</span></span>
          {[
            { icon: paused ? '▶' : '❚❚', fn: () => setPaused(p => !p), title: 'Espaço' },
            { icon: '‹',  fn: prev, title: '←' },
            { icon: '›',  fn: next, title: '→' },
          ].map(({ icon, fn, title }) => (
            <button key={icon} onClick={fn} title={title} style={S.hBtn}>{icon}</button>
          ))}
          <button onClick={onClose} title="Esc" style={{ ...S.hBtn, ...S.hBtnClose }}>✕</button>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{ ...S.body, ...fadeStyle }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={S.sidebar}>
          {/* Avatar with spinning ring */}
          <div style={S.avatarWrap}>
            <div style={{ ...S.avatarRing, borderColor: `${C}40`, boxShadow: `0 0 0 1px ${C}20, 0 0 40px ${C}25` }} />
            <div style={{ ...S.avatar, background: `${C}18`, color: C, border: `2px solid ${C}50`, boxShadow: `0 0 50px ${C}30` }}>
              {acc.initials}
            </div>
          </div>

          <div style={S.sName}>{acc.short || acc.name}</div>
          {acc.name !== acc.short && <div style={S.sFullName}>{acc.name}</div>}
          <div style={{ ...S.sGroup, background: `${C}14`, borderColor: `${C}30`, color: C }}>{acc.group}</div>

          {/* Balance status */}
          {(isZero || isLow) && (
            <div style={{ ...S.alertTag, background: `${balC}12`, borderColor: `${balC}35`, color: balC }}>
              ⚠ {isZero ? 'Sem saldo' : 'Saldo baixo'}
            </div>
          )}

          <div style={S.sDivider} />

          {/* Campaign summary */}
          <div style={S.campSummary}>
            <div style={S.campSummaryRow}>
              <span style={{ ...S.campDot2, background: '#00E5A0' }} />
              <span style={S.campSummaryLabel}>Ativas</span>
              <span style={{ ...S.campSummaryVal, color: '#00E5A0' }}>{active.length}</span>
            </div>
            <div style={S.campSummaryRow}>
              <span style={{ ...S.campDot2, background: 'rgba(255,255,255,0.25)' }} />
              <span style={S.campSummaryLabel}>Pausadas</span>
              <span style={S.campSummaryVal}>{paused_.length}</span>
            </div>
          </div>

          <div style={S.sDivider} />

          {/* Secondary metrics */}
          {[
            { l: 'CTR',        v: fPct(ctr) },
            { l: 'Frequência', v: (acc.frequency || 0).toFixed(2) },
            { l: 'Alcance',    v: fCompact(acc.reach || 0) },
            { l: 'Clicks',     v: fCompact(acc.clicks || 0) },
          ].map(({ l, v }) => (
            <div key={l} style={S.secRow}>
              <span style={S.secLabel}>{l}</span>
              <span style={S.secVal}>{v}</span>
            </div>
          ))}

          {/* Período */}
          <div style={{ ...S.periodTag, borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
            {presetLabel(preset)}
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <main style={S.main_}>

          {/* HERO ROW */}
          <div style={S.heroRow}>
            <div style={S.heroBlock}>
              <span style={S.heroLabel}>INVESTIMENTO TOTAL</span>
              <div style={{ ...S.heroValue, color: C }}>{fCurrency(acc.spend)}</div>
            </div>
            <div style={S.heroDivider} />
            <div style={S.heroBlock}>
              <span style={S.heroLabel}>LEADS</span>
              <div style={{ ...S.heroValue, color: '#00E5A0' }}>{fNumber(acc.leads)}</div>
            </div>
            <div style={S.heroDivider} />
            <div style={S.heroBlock}>
              <span style={S.heroLabel}>IMPRESSÕES</span>
              <div style={{ ...S.heroValue, color: '#7B61FF' }}>{fCompact(acc.impressions)}</div>
            </div>
            <div style={S.heroDivider} />
            <div style={S.heroBlock}>
              <span style={S.heroLabel}>SALDO RESTANTE</span>
              <div style={{ ...S.heroValue, color: balC }}>{fCurrency(remaining < 0 ? 0 : remaining)}</div>
            </div>
          </div>

          {/* SECONDARY METRICS */}
          <div style={S.metricsRow}>
            {[
              { l: 'Custo por Lead', v: cpr > 0 ? fCurrency(cpr) : '—',  c: '#FFB800' },
              { l: 'CPM',           v: fCurrency(cpm),                    c: '#FF6B8A' },
              { l: 'CTR',           v: fPct(ctr),                         c: '#7B61FF' },
              { l: 'Alcance',       v: fCompact(acc.reach || 0),          c: '#00D4FF' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ ...S.metCard, borderColor: `${c}22` }}>
                <span style={{ ...S.metDot, background: c }} />
                <span style={S.metLabel}>{l}</span>
                <span style={{ ...S.metVal, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* CHART */}
          <div style={S.chartBox}>
            <div style={S.chartTop}>
              <span style={S.sectionTitle}>Evolução diária</span>
              <div style={S.chartLegend}>
                <span style={S.legendDot(C)} />
                <span style={S.legendText}>Invest.</span>
                <span style={S.legendDot('#00E5A0')} />
                <span style={S.legendText}>Leads</span>
              </div>
            </div>
            {chart.length > 1
              ? <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id={`gS${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C}       stopOpacity={0.35}/>
                        <stop offset="100%" stopColor={C}       stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id={`gL${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#00E5A0" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#00E5A0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis yAxisId="s" hide />
                    <YAxis yAxisId="l" orientation="right" hide />
                    <Tooltip content={<ChartTooltip C={C}/>} />
                    <Area yAxisId="s" type="monotone" dataKey="spend" stroke={C}        strokeWidth={2}   fill={`url(#gS${idx})`} dot={false} activeDot={{ r: 5, fill: C, strokeWidth: 0 }}/>
                    <Line  yAxisId="l" type="monotone" dataKey="leads" stroke="#00E5A0" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#00E5A0', strokeWidth: 0 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              : <div style={S.noData}>Sem histórico disponível</div>
            }
          </div>

          {/* CAMPAIGNS */}
          <div style={S.campsBox}>
            <span style={S.sectionTitle}>Top campanhas por investimento</span>
            {topCamps.length === 0
              ? <div style={S.noData}>Sem campanhas no período</div>
              : <div style={S.campRows}>
                  {topCamps.map((c, i) => {
                    const leads   = (c.actions || []).find(a => a.action_type === 'lead')?.value || 0
                    const isAct   = c.status === 'ACTIVE'
                    const barPct  = ((c.spend || 0) / maxSpend) * 100
                    return (
                      <div key={`${c.id}-${i}`} style={S.campRow}>
                        <div style={{ ...S.campStatusDot, background: isAct ? '#00E5A0' : 'rgba(255,255,255,0.2)' }} />
                        <span style={S.campName}>{c.name}</span>
                        <div style={S.campBarWrap}>
                          <div style={{ ...S.campBar, width: `${barPct}%`, background: `linear-gradient(90deg, ${C}80, ${C})` }} />
                        </div>
                        <span style={S.campSpend}>{fCurrency(c.spend || 0)}</span>
                        {leads > 0 && <span style={{ ...S.campLeads, color: '#00E5A0' }}>{leads} leads</span>}
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </main>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={S.footer}>
        <div style={S.footLeft}>
          <div style={S.nextLabel}>A SEGUIR</div>
          <div style={S.nextAvatar(next_.color)}>{next_.initials}</div>
          <div style={{ ...S.nextName, color: next_.color }}>{next_.short}</div>
        </div>

        <div style={S.progressWrap}>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: `${progress}%`, background: `linear-gradient(90deg, ${C}70, ${C})`, boxShadow: `0 0 14px ${C}80` }} />
          </div>
        </div>

        <div style={S.footRight}>
          <span style={{ ...S.timerVal, color: paused ? 'rgba(255,255,255,0.25)' : C }}>
            {paused ? '⏸ PAUSADO' : `${mins}:${secs}`}
          </span>
        </div>
      </footer>
    </div>
  )
}

/* ─── sub-components ───────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, C }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0C1022', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.stroke, fontWeight: 700 }}>
          {p.name === 'spend' ? fCurrency(p.value) : `${p.value} leads`}
        </div>
      ))}
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────── */
const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: '#040810',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'inherit', overflow: 'hidden',
  },
  dotGrid: {
    position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
  spotlight: { position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', transition: 'background 0.7s ease' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 2, transition: 'background 0.6s ease' },

  /* header */
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 28px 10px 32px',
    background: 'rgba(4,8,16,0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  hLeft:      { display: 'flex', alignItems: 'center', gap: 12 },
  clockBlock: { display: 'flex', flexDirection: 'column', lineHeight: 1.15 },
  clockTime:  { fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' },
  clockDate:  { fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 },
  hSep:       { width: 1, height: 28, background: 'rgba(255,255,255,0.08)' },
  hBrand:     { fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
  modeBadge:  { fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 4, border: '1px solid', letterSpacing: 1.2 },
  hDots:      { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', maxWidth: 460, justifyContent: 'center' },
  dot:        { height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.35s cubic-bezier(.34,1.56,.64,1)' },
  hRight:     { display: 'flex', alignItems: 'center', gap: 5 },
  hCount:     { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginRight: 8, fontVariantNumeric: 'tabular-nums' },
  hBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(255,255,255,0.55)', width: 30, height: 30, borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14, fontWeight: 700,
  },
  hBtnClose: { background: 'rgba(255,77,106,0.1)', borderColor: 'rgba(255,77,106,0.25)', color: '#FF4D6A' },

  /* body */
  body: { flex: 1, display: 'flex', minHeight: 0, position: 'relative', zIndex: 5 },

  /* sidebar */
  sidebar: {
    width: 240, flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '24px 20px 16px',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    gap: 0, overflow: 'hidden',
  },
  avatarWrap:   { position: 'relative', marginBottom: 18 },
  avatarRing: {
    position: 'absolute', inset: -10,
    borderRadius: 36, border: '1px solid',
  },
  avatar: {
    width: 96, height: 96, borderRadius: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, fontWeight: 900, transition: 'all 0.5s',
  },
  sName:     { fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 4, lineHeight: 1.2 },
  sFullName: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 8 },
  sGroup: {
    fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
    border: '1px solid', marginBottom: 10, letterSpacing: 0.5,
  },
  alertTag: { fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6, border: '1px solid', marginBottom: 10 },
  sDivider: { width: '100%', height: 1, background: 'rgba(255,255,255,0.05)', margin: '10px 0' },
  campSummary: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6 },
  campSummaryRow: { display: 'flex', alignItems: 'center', gap: 8 },
  campDot2:   { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  campSummaryLabel: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 },
  campSummaryVal: { fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' },
  secRow: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '4px 0' },
  secLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8 },
  secVal:   { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' },
  periodTag: { marginTop: 'auto', fontSize: 10, padding: '4px 12px', borderRadius: 20, border: '1px solid' },

  /* main */
  main_: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '20px 28px 16px', gap: 14, overflow: 'hidden',
  },

  /* hero row */
  heroRow: {
    display: 'flex', alignItems: 'stretch', gap: 0,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, overflow: 'hidden', flexShrink: 0,
  },
  heroBlock: { flex: 1, padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 4 },
  heroDivider: { width: 1, background: 'rgba(255,255,255,0.05)', flexShrink: 0 },
  heroLabel: { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroValue: { fontSize: 36, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },

  /* metrics row */
  metricsRow: { display: 'flex', gap: 10, flexShrink: 0 },
  metCard: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.025)', border: '1px solid',
    borderRadius: 10, padding: '10px 14px',
  },
  metDot:   { width: 4, height: 30, borderRadius: 2, flexShrink: 0 },
  metLabel: { flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.6 },
  metVal:   { fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },

  /* chart */
  chartBox: {
    flex: 1, minHeight: 0,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14, padding: '14px 16px 10px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  chartTop:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2 },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 8 },
  legendDot:   c => ({ width: 8, height: 3, borderRadius: 2, background: c }),
  legendText:  { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  noData:      { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 },

  /* campaigns */
  campsBox: {
    flexShrink: 0,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14, padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  campRows:      { display: 'flex', flexDirection: 'column', gap: 7 },
  campRow:       { display: 'flex', alignItems: 'center', gap: 10 },
  campStatusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  campName:      { fontSize: 12, color: 'rgba(255,255,255,0.65)', width: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 },
  campBarWrap:   { flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  campBar:       { height: '100%', borderRadius: 2, transition: 'width 0.8s ease' },
  campSpend:     { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', width: 86, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  campLeads:     { fontSize: 11, fontWeight: 700, width: 64, textAlign: 'right' },

  /* footer */
  footer: {
    position: 'relative', zIndex: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '8px 28px 10px 32px',
    background: 'rgba(4,8,16,0.9)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  footLeft:    { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  nextLabel:   { fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5 },
  nextAvatar:  c => ({ width: 22, height: 22, borderRadius: 6, background: `${c}20`, border: `1px solid ${c}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: c }),
  nextName:    { fontSize: 12, fontWeight: 700 },
  progressWrap: { flex: 1 },
  progressTrack: { height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'visible' },
  progressFill:  { height: '100%', borderRadius: 2, transition: 'width 1s linear' },
  footRight:   { flexShrink: 0 },
  timerVal:    { fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums', transition: 'color 0.3s' },

  closeFallback: { marginTop: 16, padding: '8px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, cursor: 'pointer' },
}
