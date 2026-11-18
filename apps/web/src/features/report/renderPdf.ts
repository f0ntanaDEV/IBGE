import type { buildReport } from "@/features/report/buildReport"

type Report = ReturnType<typeof buildReport>

/** Desenha o relatório em A4, com sumário na página 2 e rodapé de páginas. */
export async function renderPdf(report: Report, images: Record<string, string> = {}) {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const width = doc.internal.pageSize.getWidth()
  const write = (title: string, lines: string[]) => {
    doc.setFontSize(14)
    doc.text(title, 15, 20)
    doc.setFontSize(11)
    const body = doc.splitTextToSize(lines.filter(Boolean).join("\n"), width - 30)
    doc.text(body, 15, 30)
  }
  write(report.pageTitle, [report.question, report.filters, report.generatedAt, `Revisão ${report.revision}`, report.url])
  doc.addPage()
  write("Sumário", report.summary.map((item) => `${item.title} — página ${item.page}`))
  doc.addPage()
  write("Resumo", [report.headline, report.story, report.note])
  doc.addPage()
  write("Indicadores", report.kpis.map((item) => `${item.label}: ${item.value} (${item.status}). ${item.reference}. ${item.action}`))
  if (!report.simple) {
    for (const chart of report.charts) {
      doc.addPage()
      write(chart.title, [chart.description, chart.help, chart.filtersLabel, chart.narrative ?? ""])
      const image = images[chart.id]
      if (image) doc.addImage(image, "PNG", 15, 70, 180, 90)
    }
    doc.addPage()
    write("Fatos e contexto", [...report.facts, ...report.context])
    doc.addPage()
    write("Notícias do IBGE", report.news.map((item) => `${item.date} — ${item.title} — ${item.url}`))
  }
  doc.addPage()
  doc.setFontSize(14)
  doc.text("Anexos", 15, 20)
  for (const chart of report.charts) {
    const rows = chart.table.rows.length > 200 ? [...chart.table.rows.slice(0, 20), ...chart.table.rows.slice(-20)] : chart.table.rows
    autoTable(doc, { head: [chart.table.columns], body: rows, startY: 28, styles: { fontSize: 8 } })
    if (chart.table.rows.length > 200) doc.text("dados completos no CSV", 15, doc.internal.pageSize.getHeight() - 20)
  }
  doc.addPage()
  write("Fonte e metodologia", ["IBGE, Projeções da População, revisão 2024.", "Como ler este painel: /sobre"])
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    doc.setFontSize(9)
    doc.text(`Página ${page} de ${total}`, width - 40, doc.internal.pageSize.getHeight() - 8)
  }
  const place = report.filters.split("·")[0]?.trim().toLowerCase().replace(/\s+/g, "-") || "brasil"
  const year = report.filters.match(/\d{4}/)?.[0] ?? "ano"
  doc.save(`relatorio-${report.pageTitle.toLowerCase().replace(/\s+/g, "-")}-${place}-${year}.pdf`)
  return total
}
