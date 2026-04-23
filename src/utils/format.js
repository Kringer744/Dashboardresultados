export const fCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const fNumber = (v) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(v || 0))

export const fCompact = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`
  return fNumber(v)
}

export const fPct = (v) => `${(v || 0).toFixed(2)}%`

export const fDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}`
}

export const delta = (curr, prev) => {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}
