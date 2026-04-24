import React from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { fCurrency, fCompact, fPct, fNumber } from '../utils/format.js'

export default function KPICards({ totals, daily, loading }) {
  const cards = [
    {
      label: 'Investimento Total',
      value: fCurrency(totals.spend),
      sub: 'Total gasto no período',
      color: '#00D4FF',
      key: 'spend',
      format: v => fCurrency(v),
      icon: <MoneyIcon />,
    },
    {
      label: 'Alcance',
      value: fCompact(totals.reach),
      sub: `CTR médio: ${fPct(totals.ctr)}`,
      color: '#7B61FF',
      key: 'reach',
      format: v => fCompact(v),
      icon: <EyeIcon />,
    },
    {
      label: 'Resultados (Leads)',
      value: fNumber(totals.leads),
      sub: `CPM: ${fCurrency(totals.cpm)}`,
      color: '#00E5A0',
      key: 'leads',
      format: v => fNumber(v),
      icon: <TargetIcon />,
    },
    {
      label: 'Custo por Resultado',
      value: fCurrency(totals.cpr),
      sub: `CPM: ${fCurrency(totals.cpm)}`,
      color: '#FFB800',
      key: 'cpr',
      format: v => fCurrency(v),
      invert: true,
      icon: <LightIcon />,
    },
    {
      label: 'Saldo Disponível',
      value: fCurrency(totals.balance),
      sub: 'Total em conta(s) agora',
      color: '#00E5A0',
      key: 'balance',
      format: v => fCurrency(v),
      noSparkline: true,
      icon: <WalletIcon />,
    },
  ]

  return (
    <div style={styles.grid}>
      {cards.map(card => (
        <KPICard key={card.label} card={card} daily={daily} loading={loading} />
      ))}
    </div>
  )
}

function monthOverMonth(daily, key) {
  const map = {}
  for (const d of daily) {
    const m = d.date.substring(0, 7)
    if (!map[m]) map[m] = 0
    map[m] += d[key] || 0
  }
  const keys = Object.keys(map).sort()
  if (keys.length < 2) return null
  const prev = map[keys[keys.length - 2]]
  const curr = map[keys[keys.length - 1]]
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

function KPICard({ card, daily, loading }) {
  const chartData = daily.slice(-14).map(d => ({ v: d[card.key] || 0, date: d.date }))

  // Delta: prefer month-over-month, fall back to half-period
  let pct = card.noSparkline ? null : monthOverMonth(daily, card.key)
  if (pct === null && !card.noSparkline && chartData.length >= 4) {
    const half    = Math.floor(chartData.length / 2)
    const prevSum = chartData.slice(0, half).reduce((s, d) => s + d.v, 0)
    const currSum = chartData.slice(half).reduce((s, d) => s + d.v, 0)
    pct = prevSum > 0 ? ((currSum - prevSum) / prevSum) * 100 : null
  }

  const isUp   = pct !== null && pct >= 0
  const isGood = card.invert ? !isUp : isUp

  return (
    <div style={styles.card}>
      <div style={{ ...styles.topLine, background: card.color }} />
      <div style={styles.cardTop}>
        <div style={{ ...styles.iconBox, background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
          {React.cloneElement(card.icon, { color: card.color })}
        </div>
      </div>

      <div style={styles.cardLabel}>{card.label}</div>
      {loading
        ? <div style={styles.skeleton} />
        : <div style={styles.valueRow}>
            <div style={{ ...styles.cardValue, color: card.color }}>{card.value}</div>
            {pct !== null && (
              <span style={{ ...styles.delta, color: isGood ? 'var(--green)' : 'var(--red)', background: isGood ? 'rgba(0,229,160,0.1)' : 'rgba(255,77,106,0.1)' }}>
                {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
              </span>
            )}
          </div>
      }
      <div style={styles.cardSub}>{card.sub}</div>

      {!card.noSparkline && chartData.length > 1 && (
        <div style={styles.sparkline}>
          <ResponsiveContainer width="100%" height={50}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`g-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={card.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length
                    ? <div style={styles.tip}>{card.format(payload[0].value)}</div>
                    : null
                }
              />
              <Area type="monotone" dataKey="v" stroke={card.color} strokeWidth={1.5}
                fill={`url(#g-${card.key})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '16px 16px 0',
    position: 'relative', overflow: 'hidden',
    animation: 'fadeIn 0.3s ease',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  delta: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 },
  cardLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.3 },
  valueRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardValue: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  cardSub: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 },
  sparkline: { margin: '0 -16px' },
  skeleton: { height: 30, borderRadius: 6, background: 'var(--surface3)', marginBottom: 4 },
  tip: { background: 'var(--surface3)', border: '1px solid var(--border-md)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: 'var(--text)' },
}

const iconProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }
const MoneyIcon = ({ color }) => <svg {...iconProps}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
const EyeIcon   = ({ color }) => <svg {...iconProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/></svg>
const TargetIcon= ({ color }) => <svg {...iconProps}><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/><circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/></svg>
const LightIcon = ({ color }) => <svg {...iconProps}><line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/><path d="M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
const WalletIcon= ({ color }) => <svg {...iconProps}><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2"/><path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill={color}/><path d="M2 10h20" stroke={color} strokeWidth="2"/></svg>
