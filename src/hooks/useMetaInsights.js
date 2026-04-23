import { useState, useEffect, useRef } from 'react'
import { fetchAllInsights, fetchAllAccountInfo, fetchAllCampaigns } from '../api/meta.js'
import { ACCOUNTS } from '../config/accounts.js'

export function useMetaInsights(selectedIds, preset) {
  const [data, setData]               = useState([])
  const [accountInfo, setAccountInfo] = useState({})
  const [campaigns, setCampaigns]     = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [lastFetch, setLastFetch]     = useState(null)

  // token para cancelar respostas de requisições antigas
  const loadToken = useRef(0)

  const load = async (ids, p) => {
    if (!ids.length) {
      setData([]); setCampaigns([]); setAccountInfo({})
      return
    }

    const token = ++loadToken.current
    setLoading(true)
    setError(null)
    setData([])
    setCampaigns([])

    try {
      const [insights, infos, camps] = await Promise.all([
        fetchAllInsights(ids, p),
        fetchAllAccountInfo(ids),
        fetchAllCampaigns(ids, p),
      ])

      // ignora se já veio uma requisição mais nova
      if (token !== loadToken.current) return

      setData(insights)
      const infoMap = {}
      for (const i of infos) infoMap[i.accountId] = i
      setAccountInfo(infoMap)
      setCampaigns(camps)
      setLastFetch(new Date())
    } catch (e) {
      if (token !== loadToken.current) return
      setError(e.message)
    } finally {
      if (token === loadToken.current) setLoading(false)
    }
  }

  useEffect(() => {
    load(selectedIds, preset)
  }, [selectedIds.join(','), preset])

  const refetch = () => load(selectedIds, preset)

  const totals = data.reduce(
    (acc, r) => ({
      spend:       acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks:      acc.clicks + r.clicks,
      leads:       acc.leads + r.leads,
      reach:       acc.reach + r.reach,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, reach: 0 }
  )
  totals.ctr     = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  totals.cpm     = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0
  totals.cpr     = totals.leads > 0 ? totals.spend / totals.leads : 0
  totals.balance = Object.values(accountInfo).reduce((s, i) => {
    const remaining = i.spendCap != null
      ? i.spendCap - (i.amountSpent || 0)
      : (i.balance || 0)
    return s + (remaining > 0 ? remaining : 0)
  }, 0)

  const dailyMap = {}
  for (const r of data) {
    for (const d of r.daily) {
      if (!dailyMap[d.date]) dailyMap[d.date] = { date: d.date, spend: 0, impressions: 0, clicks: 0, leads: 0 }
      dailyMap[d.date].spend       += d.spend
      dailyMap[d.date].impressions += d.impressions
      dailyMap[d.date].clicks      += d.clicks
      dailyMap[d.date].leads       += d.leads
    }
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  const enriched = data.map(r => ({
    ...r,
    ...ACCOUNTS.find(a => a.id === r.accountId),
    ...(accountInfo[r.accountId] || {}),
  }))

  const enrichedCampaigns = campaigns.map(c => ({
    ...c,
    ...ACCOUNTS.find(a => a.id === c.accountId),
  }))

  return { data: enriched, totals, daily, accountInfo, campaigns: enrichedCampaigns, loading, error, refetch, lastFetch }
}
