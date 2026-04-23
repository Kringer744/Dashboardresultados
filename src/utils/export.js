import { fCurrency, fCompact, fPct, fNumber } from './format.js'

export function exportCSV(data, preset) {
  const headers = ['Cliente', 'Grupo', 'Conta ID', 'Investido', 'Impressões', 'Alcance', 'Cliques', 'CTR', 'CPM', 'Leads', 'CPL', 'Frequência']
  const rows = data.map(r => [
    r.short || r.name || '',
    r.group || '',
    r.accountId || '',
    (r.spend || 0).toFixed(2),
    r.impressions || 0,
    r.reach || 0,
    r.clicks || 0,
    ((r.ctr || 0)).toFixed(2) + '%',
    (r.cpm || 0).toFixed(2),
    r.leads || 0,
    r.cpr > 0 ? (r.cpr).toFixed(2) : '',
    (r.frequency || 0).toFixed(2),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fluxo-relatorio-${preset}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPDF(data, totals, preset) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // Header bg
  doc.setFillColor(8, 11, 15)
  doc.rect(0, 0, W, 297, 'F')

  // Top bar
  doc.setFillColor(15, 19, 24)
  doc.rect(0, 0, W, 28, 'F')
  doc.setDrawColor(0, 212, 255)
  doc.setLineWidth(0.5)
  doc.line(0, 28, W, 28)

  // Title
  doc.setTextColor(0, 212, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Fluxo', 14, 16)
  doc.setTextColor(228, 239, 248)
  doc.text(' Digital & Tech', 30, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90, 122, 153)
  doc.text(`Relatório Meta Ads  •  Período: ${preset}  •  Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 22)

  // KPI summary
  const kpis = [
    { label: 'Investimento Total', value: fCurrency(totals.spend) },
    { label: 'Impressões',         value: fCompact(totals.impressions) },
    { label: 'Leads',              value: fNumber(totals.leads) },
    { label: 'CPL',                value: totals.cpr > 0 ? fCurrency(totals.cpr) : '—' },
    { label: 'CTR',                value: fPct(totals.ctr) },
    { label: 'CPM',                value: fCurrency(totals.cpm) },
  ]

  const boxW = (W - 28) / 6
  kpis.forEach((k, i) => {
    const x = 14 + i * boxW
    doc.setFillColor(22, 27, 34)
    doc.roundedRect(x, 32, boxW - 3, 20, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setTextColor(90, 122, 153)
    doc.text(k.label, x + 4, 38)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 212, 255)
    doc.text(k.value, x + 4, 47)
  })

  // Table
  autoTable(doc, {
    startY: 57,
    head: [['Cliente', 'Grupo', 'Investido', 'Impressões', 'Alcance', 'Cliques', 'CTR', 'CPM', 'Leads', 'CPL', 'Freq.']],
    body: data.map(r => [
      r.short || r.name || '',
      r.group || '',
      fCurrency(r.spend),
      fCompact(r.impressions),
      fCompact(r.reach),
      fNumber(r.clicks),
      fPct(r.ctr),
      fCurrency(r.cpm),
      fNumber(r.leads),
      r.cpr > 0 ? fCurrency(r.cpr) : '—',
      (r.frequency || 0).toFixed(2),
    ]),
    foot: [[
      'TOTAL', '',
      fCurrency(totals.spend),
      fCompact(totals.impressions),
      fCompact(totals.reach),
      fNumber(totals.clicks),
      fPct(totals.ctr),
      fCurrency(totals.cpm),
      fNumber(totals.leads),
      totals.cpr > 0 ? fCurrency(totals.cpr) : '—',
      '',
    ]],
    styles: { fillColor: [15, 19, 24], textColor: [228, 239, 248], lineColor: [30, 40, 54], lineWidth: 0.3, fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [22, 27, 34], textColor: [90, 122, 153], fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: [22, 27, 34], textColor: [0, 212, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [17, 22, 30] },
    theme: 'grid',
  })

  // Footer
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(90, 122, 153)
    doc.text(`Fluxo Digital & Tech  •  fluxodigitaltech@gmail.com  •  Página ${i} de ${pages}`, 14, doc.internal.pageSize.getHeight() - 6)
  }

  doc.save(`fluxo-relatorio-${preset}-${new Date().toISOString().split('T')[0]}.pdf`)
}
