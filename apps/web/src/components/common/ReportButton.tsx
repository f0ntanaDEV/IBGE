import { toPng } from "html-to-image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { STORYTELLING } from "@/content/storytelling"
import { useDashboardFilters } from "@/features/datasets/hooks"
import { buildReport } from "@/features/report/buildReport"
import { renderPdf } from "@/features/report/renderPdf"
import { useMode, usePreferences } from "@/stores/preferences"

export function ReportButton({ pageId, title, question }: { pageId: string; title: string; question?: string }) {
  const filters = useDashboardFilters()
  const mode = useMode()
  const setMotion = usePreferences((state) => state.setMotion)
  const [busy, setBusy] = useState("")
  const place = filters.territories.find((item) => item.cod === filters.cod)
  async function run() {
    if (busy) return
    const motion = document.documentElement.dataset.motion
    setMotion("off")
    const cards = [...document.querySelectorAll<HTMLElement>("[data-chart-id]")]
    const charts = cards.map((node) => ({
      id: node.dataset.chartId ?? node.id,
      title: node.querySelector("h3, h2")?.textContent ?? "Gráfico",
      description: "",
      help: "",
      filtersLabel: `${place?.local ?? "Brasil"} · ${filters.ano} · ${filters.sexo}`,
      table: { columns: ["Série"], rows: [[node.innerText.slice(0, 80)]] },
    }))
    const report = buildReport({
      pageTitle: title,
      question: question ?? "",
      filters: `${place?.local ?? "Brasil"} · ${filters.ano} · ${filters.sexo}`,
      generatedAt: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      revision: "2024",
      url: window.location.pathname,
      headline: document.querySelector("[data-headline]")?.textContent ?? "",
      story: STORYTELLING[pageId]?.[mode === "simple" ? "simples" : "tecnico"] ?? "",
      simple: mode === "simple",
      kpis: [...document.querySelectorAll<HTMLElement>("[data-kpi]")].map((node) => ({
        label: node.dataset.kpi ?? "",
        value: node.innerText.split("\n")[0] ?? "",
        status: "",
        reference: "",
        action: "",
      })),
      charts,
      facts: [],
      context: [],
      news: [...document.querySelectorAll<HTMLAnchorElement>("a[href*='ibge']")].slice(0, 5).map((link) => ({ title: link.textContent ?? "", date: "", url: link.href })),
    })
    const images: Record<string, string> = {}
    if (mode !== "simple") {
      for (const [index, node] of cards.entries()) {
        setBusy(`Gerando relatório… ${index + 1}/${cards.length || 1}`)
        const host = document.createElement("div")
        host.dataset.theme = "light"
        host.style.position = "fixed"
        host.style.left = "-10000px"
        host.style.width = "800px"
        host.append(node.cloneNode(true))
        document.body.append(host)
        images[node.dataset.chartId ?? ""] = await toPng(host, { pixelRatio: 2, backgroundColor: "#ffffff" })
        host.remove()
      }
    }
    await renderPdf(report, images)
    if (motion === "on") setMotion("on")
    setBusy("")
  }
  return (
    <Button variant="outline" disabled={Boolean(busy)} onClick={() => void run()}>
      {busy || "Relatório"}
    </Button>
  )
}
