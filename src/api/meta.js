import { INSIGHTS_FIELDS } from '../config/accounts.js'

const BASE = 'https://graph.facebook.com/v21.0'
const TOKEN = import.meta.env.VITE_META_TOKEN

function getDateRange(preset) {
  // Aceita objeto { since, until } direto (modo custom)
  if (preset && typeof preset === 'object' && preset.since && preset.until) {
    return { since: preset.since, until: preset.until }
  }

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
    case 'last_6m': {
      const s = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      return { since: fmt(s), until: fmt(now) }
    }
    default:           return { since: fmt(addDays(now, -30)), until: fmt(now) }
  }
}

function extractLeads(actions = []) {
  // Espelha exatamente a coluna "Resultado" do Meta Ads Manager.
  // Cada grupo = um objetivo de campanha. Pega o maior dentro do grupo
  // (evita alias duplicados) e soma entre grupos distintos
  // (conta leads form + conversas iniciadas de contas mistas).
  //
  // REMOVIDOS intencionalmente:
  //   - onsite_conversion.lead_grouped  → agrega sub-tipos demais, causa inflate
  //   - onsite_conversion.total_messaging_connection → conta TODAS interações
  //     de msg, não só conversas iniciadas (bate com Meta AM "Conversas por msg")
  const GROUPS = [
    // Grupo 1: Lead Ads (formulário nativo) — objetivo LEAD_GENERATION
    ['lead'],
    // Grupo 2: Conversas iniciadas — objetivo MESSAGES
    // "messaging_conversation_started_7d" é exatamente o que o Meta AM exibe
    ['messaging_conversation_started_7d', 'onsite_conversion.messaging_conversation_started_7d'],
    // Grupo 3: Lead via pixel (site externo) — objetivo CONVERSIONS
    ['offsite_conversion.fb_pixel_lead'],
    // Grupo 4: Compra / cadastro — objetivo CONVERSIONS
    ['offsite_conversion.fb_pixel_purchase', 'offsite_conversion.fb_pixel_complete_registration'],
  ]

  let total = 0
  for (const group of GROUPS) {
    let groupMax = 0
    for (const t of group) {
      const a = actions.find(x => x.action_type === t)
      if (a) groupMax = Math.max(groupMax, parseFloat(a.value) || 0)
    }
    total += groupMax
  }
  return total
}

function extractCPR(cost_per_action_type = []) {
  // Mesma ordem de prioridade que extractLeads — garante CPL da métrica certa
  const types = [
    'messaging_conversation_started_7d',
    'onsite_conversion.messaging_conversation_started_7d',
    'lead',
    'offsite_conversion.fb_pixel_lead',
    'offsite_conversion.fb_pixel_purchase',
    'offsite_conversion.fb_pixel_complete_registration',
  ]
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
    use_unified_attribution_setting: 'true', // bate exato com Meta Ads Manager
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
    fields: 'id,name,balance,currency,amount_spent,spend_cap,account_status,disable_reason,funding_source_details',
    access_token: TOKEN,
  })
  const res = await fetch(`${BASE}/${accountId}?${params}`)
  const json = await res.json()
  if (json.error) return { accountId, balance: null, currency: 'BRL' }
  return {
    accountId,
    balance:        parseFloat(json.balance) / 100 || 0,
    currency:       json.currency || 'BRL',
    amountSpent:    parseFloat(json.amount_spent) / 100 || 0,
    spendCap:       json.spend_cap ? parseFloat(json.spend_cap) / 100 : null,
    status:         json.account_status,
    disableReason:  json.disable_reason ?? null,
    fundingSource:  json.funding_source_details?.display_string || null,
    fundingType:    json.funding_source_details?.type ?? null,
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
      `insights.time_range(${JSON.stringify(dateRange)}).use_unified_attribution_setting(true){${insightsFields}}`,
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

export async function fetchDailyOnly(accountId, preset) {
  const dateRange = getDateRange(preset)
  const rows = await fetchInsights(accountId, dateRange, '1')
  return rows.map(d => ({
    date:        d.date_start,
    spend:       parseFloat(d.spend) || 0,
    impressions: parseInt(d.impressions) || 0,
    clicks:      parseInt(d.clicks) || 0,
    leads:       extractLeads(d.actions),
  }))
}

export async function fetchAllDailyOnly(accountIds, preset) {
  const results = await Promise.allSettled(accountIds.map(id => fetchDailyOnly(id, preset)))
  // Merge all accounts into a single daily aggregate
  const map = {}
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const d of r.value) {
      if (!map[d.date]) map[d.date] = { date: d.date, spend: 0, impressions: 0, clicks: 0, leads: 0 }
      map[d.date].spend       += d.spend
      map[d.date].impressions += d.impressions
      map[d.date].clicks      += d.clicks
      map[d.date].leads       += d.leads
    }
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
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
