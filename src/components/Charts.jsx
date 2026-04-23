import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { fDate, fCurrency, fCompact, fNumber } from '../utils/format.js'
import { ACCOUNTS } from '../config/accounts.js'

export default function Charts({ daily, accountData }) {
  const [metric, setMetric] = useState('spend')

  const metrics = [
    { key: 'spend', label: 'Investimento', fmt: fCurrency, color: '#00D4FF' },
    { key: 'impressions', label: 'Impressões', fmt: fCompact, color: '#7B61FF' },
    { key: 'leads', label: 'Leads', fmt: fNumber, color: '#00E5A0' },
    { key: 'clicks', label: 'Cliques', fmt: fNumber, color: '#FFB800' },
  ]
  const active = metrics.find(m => m.key === metric)

  // distribution by account (top 6 + outros)
  const sorted = [...accountData].sort((a, b) => (b.spend || 0) - (a.spend || 0))
  const top5 = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  const restSpend = rest.reduce((s, a) => s + (a.spend || 0), 0)
  const pieData = [
    ...top5.map(a => ({ name: a.short || a.name, value: a.spend || 0, color: a.color || '#00D4FF' })),
    ...(restSpend > 0 ? [{ name: 'Outros', value: restSpend, color: '#3A4A5A' }] : []),
  ]
  const total = pieData.reduce((s, d) => s + d.value, 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={styles.tooltip}>
        <div style={styles.tooltipDate}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
            {active.fmt ? active.fmt(p.value) : p.value}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={styles.grid}>
      {/* Main area chart */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>Desempenho ao longo do tempo</div>
            <div style={styles.cardSub}>
              {daily.length > 0
                ? `${fDate(daily[0].date)} até ${fDate(daily[daily.length - 1].date)}`
                : 'Selecione um período'}
            </div>
          </div>
          <div style={styles.metricTabs}>
            {metrics.map(m => (
              <button
                key={m.key}
                style={{ ...styles.metricTab, ...(metric === m.key ? { ...styles.metricTabActive, color: m.color, borderColor: m.color, background: `${m.color}15` } : {}) }}
                onClick={() => setMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={daily} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={active.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fDate} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tickFormatter={v => fCompact(v)} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active: a, payload, label }) =>
                a && payload?.length
                  ? <div style={styles.tooltip}><div style={styles.tooltipDate}>{fDate(label)}</div><div style={{ color: active.color, fontWeight: 700 }}>{active.fmt(payload[0].value)}</div></div>
                  : null
              }
            />
            <Area type="monotone" dataKey={metric} stroke={active.color} strokeWidth={2}
              fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: active.color }} />
          </AreaChart>
        </ResponsiveContainer>

        <div style={styles.chartFooter}>
          <span style={styles.avgLabel}>Total</span>
          <span style={{ color: active.color, fontWeight: 700, fontSize: 16 }}>
            {active.fmt(daily.reduce((s, d) => s + (d[metric] || 0), 0))}
          </span>
        </div>
      </div>

      {/* Pie chart */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>Distribuição por Cliente</div>
            <div style={styles.cardSub}>Investimento por conta</div>
          </div>
        </div>

        <div style={styles.pieWrap}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={75}
                dataKey="value" paddingAngle={2} strokeWidth={0}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                content={({ active: a, payload }) =>
                  a && payload?.length
                    ? <div style={styles.tooltip}><div style={{ color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].payload.name}</div><div style={{ color: 'var(--text)', fontSize: 12 }}>{fCurrency(payload[0].value)} · {total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0}%</div></div>
                    : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.legend}>
          {pieData.map((d, i) => (
            <div key={i} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: d.color }} />
              <span style={styles.legendName}>{d.name}</span>
              <span style={styles.legendPct}>{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 },
  cardSub: { fontSize: 11, color: 'var(--text-muted)' },
  metricTabs: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  metricTab: {
    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
    background: 'none', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
  },
  metricTabActive: { fontWeight: 700 },
  chartFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' },
  avgLabel: { fontSize: 11, color: 'var(--text-muted)' },
  pieWrap: { display: 'flex', justifyContent: 'center' },
  legend: { display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendName: { flex: 1, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  legendPct: { color: 'var(--text-muted)', fontWeight: 600 },
  tooltip: { background: 'var(--surface3)', border: '1px solid var(--border-md)', padding: '8px 12px', borderRadius: 8, fontSize: 12 },
  tooltipDate: { color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 },
}
