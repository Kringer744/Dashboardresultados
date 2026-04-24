import { INSIGHTS_FIELDS } from '../config/accounts.js'

const BASE = 'https://graph.facebook.com/v21.0'
const TOKEN = import.meta.env.VITE_META_TOKEN

function getDateRange(preset) {
  const now = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  switch (preset) {
    case 'today':      return { since: fmt(now), until: fmt(now) }
    case 'yesterday':  { const y = addDays(now, -1); return { since: fmt(y), until: fmt(y) } }
    case 'last_7d':    return { since: fmt(addDays(now, -7)), until: fmt(now) }
    case 'last_14d':   return { since: fmt(addDays(now, -14)), until: fmt(now) }
    case 'last_30d':   return { since: fmt(addDays(now, -30)), until: fmt(now) }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { since: fmt(s), until: fmt(now) }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { since: fmt(s), until: fmt(e) }
    }
    default:           return { since: fmt(addDays(now, -30)), until: fmt(now) }
  }
}

function extractLeads(actions = []) {
  // Tipos explícitos por objetivo de campanha — sem overlap
  const RESULT_TYPES = [
    // Lead Ads / pixel
    'lead',
    'offsite_conversion.fb_pixel_lead',
    'onsite_conversion.lead_grouped',
    // Mensagens / Conversas iniciadas (objetivo MESSAGES)
    'onsite_conversion.messaging_conversation_started_7d',
    'onsite_conversion.total_messaging_connection',
    // Compras / conversões
    'offsite_conversion.fb_pixel_purchase',
    'offsite_conversion.fb_pixel_complete_registration',
  ]

  // Soma apenas os tipos explícitos encontrados nas actions
  // (uma conta pode ter campanhas de lead E de mensagens ao mesmo tempo)
  const total = RESULT_TYPES
    .map(t => actions.find(x => x.action_type === t))
    .filter(Boolean)
    .reduce((s, a) => s + (parseFloat(a.value) || 0), 0)

  return total
}

function extractCPR(cost_per_action_type = []) {
  const types = ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped']
  for (const t of types) {
    const a = cost_per_action_type.find(x => x.action_type === t)
    if (a) return parseFloat(a.value) || 0
  }
  return 0
}

async function fetchInsights(accountId, dateRange, timeIncrement = 'all_days') {
  const params = new URLSearchParams({
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify(dateRange),
    level: 'account',
    time_increment: timeIncrement,
    access_token: TOKEN,
  })

  const res = await fetch(`${BASE}/${accountId}/insights?${params}`)
  const json = await res.json()

  if (json.error) throw new Error(`[${accountId}] ${json.error.message}`)

  // handle async report
  if (json.report_run_id) {
    return await pollReport(json.report_run_id)
  }

  return json.data || []
}

async function pollReport(reportRunId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`${BASE}/${reportRunId}?access_token=${TOKEN}`)
    const json = await res.json()
    if (json.async_status === 'Job Completed') {
      const dataRes = await fetch(`${BASE}/${reportRunId}/insights?access_token=${TOKEN}`)
      const data = await dataRes.json()
      return data.data || []
    }
    if (json.async_status === 'Job Failed') throw new Error('Meta report job failed')
  }
  throw new Error('Meta report timed out')
}

export async function fetchAccountInsights(accountId, preset) {
  const dateRange = getDateRange(preset)
  const [summary, daily] = await Promise.all([
    fetchInsights(accountId, dateRange, 'all_days'),
    fetchInsights(accountId, dateRange, '1'),
  ])

  const s = summary[0] || {}
  return {
    accountId,
    spend:       parseFloat(s.spend) || 0,
    impressions: parseInt(s.impressions) || 0,
    clicks:      parseInt(s.clicks) || 0,
    ctr:         parseFloat(s.ctr) || 0,
    cpm:         parseFloat(s.cpm) || 0,
    reach:       parseInt(s.reach) || 0,
    frequency:   parseFloat(s.frequency) || 0,
    leads:       extractLeads(s.actions),
    cpr:         extractCPR(s.cost_per_action_type),
    daily: daily.map(d => ({
      date:        d.date_start,
      spend:       parseFloat(d.spend) || 0,
      impressions: parseInt(d.impressions) || 0,
      clicks:      parseInt(d.clicks) || 0,
      leads:       extractLeads(d.actions),
    })),
  }
}

export async function fetchAccountInfo(accountId) {
  const params = new URLSearchParams({
    fields: 'name,balance,currency,amount_spent,spend_cap,account_status',
    access_token: TOKEN,
  })
  const res = await fetch(`${BASE}/${accountId}?${params}`)
  const json = await res.json()
  if (json.error) return { accountId, balance: null, currency: 'BRL' }
  return {
    accountId,
    balance:      parseFloat(json.balance) / 100 || 0,
    currency:     json.currency || 'BRL',
    amountSpent:  parseFloat(json.amount_spent) / 100 || 0,
    spendCap:     json.spend_cap ? parseFloat(json.spend_cap) / 100 : null,
    status:       json.account_status,
  }
}

export async function fetchAllAccountInfo(accountIds) {
  const results = await Promise.allSettled(accountIds.map(id => fetchAccountInfo(id)))
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { accountId: accountIds[i], balance: null, currency: 'BRL' }
  )
}

export async function fetchCampaigns(accountId, preset) {
  const dateRange = getDateRange(preset)
  const insightsFields = `spend,impressions,clicks,actions,cost_per_action_type`
  const params = new URLSearchParams({
    fields: [
      'id', 'name', 'status', 'effective_status', 'objective',
      'daily_budget', 'lifetime_budget', 'budget_remaining',
      `insights.time_range(${JSON.stringify(dateRange)}){${insightsFields}}`,
    ].join(','),
    effective_status: JSON.stringify(['ACTIVE', 'PAUSED']),
    limit: 100,
    access_token: TOKEN,
  })

  const res  = await fetch(`${BASE}/${accountId}/campaigns?${params}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)

  return (json.data || []).map(c => {
    const s = c.insights?.data?.[0] || {}
    return {
      id:              c.id,
      accountId,
      name:            c.name,
      status:          c.effective_status,
      objective:       c.objective || '',
      dailyBudget:     c.daily_budget     ? parseFloat(c.daily_budget) / 100     : null,
      lifetimeBudget:  c.lifetime_budget  ? parseFloat(c.lifetime_budget) / 100  : null,
      budgetRemaining: c.budget_remaining ? parseFloat(c.budget_remaining) / 100 : null,
      spend:           parseFloat(s.spend) || 0,
      impressions:     parseInt(s.impressions) || 0,
      clicks:          parseInt(s.clicks) || 0,
      leads:           extractLeads(s.actions),
      cpr:             extractCPR(s.cost_per_action_type),
    }
  })
}

export async function fetchAllCampaigns(accountIds, preset) {
  const results = await Promise.allSettled(
    accountIds.map(id => fetchCampaigns(id, preset))
  )
  return results.flatMap((r, i) =>
    r.status === 'fulfilled' ? r.value : []
  )
}

export async function fetchAllInsights(accountIds, preset) {
  const results = await Promise.allSettled(
    accountIds.map(id => fetchAccountInsights(id, preset))
  )

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { accountId: accountIds[i], error: r.reason?.message, spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, reach: 0, frequency: 0, leads: 0, cpr: 0, daily: [] }
  )
}
