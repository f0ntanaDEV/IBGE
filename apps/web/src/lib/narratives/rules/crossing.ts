import { preposicaoTerritorio } from "@/lib/narratives/grammar"
import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

export function crossing(ctx: NarrativeContext): Insight | null {
  const a = ctx.data.series
  const b = ctx.data.seriesB
  if (!a || !b) return null
  const byYear = new Map(b.map((point) => [point.ano, point.valor]))
  let year: number | null = null
  for (let index = 1; index < a.length; index += 1) {
    const previous = byYear.get(a[index - 1].ano)
    const current = byYear.get(a[index].ano)
    if (previous == null || current == null) continue
    const before = a[index - 1].valor - previous
    const after = a[index].valor - current
    if (before === 0 || before * after < 0) year = a[index].ano
  }
  if (year == null) return null
  const onde = preposicaoTerritorio(ctx.territorio.nome)
  return {
    type: "crossing",
    relevance: 0.85,
    text: renderTemplate("crossing", ctx, { ano: String(year), onde }),
    highlight: { chartId: ctx.chartId ?? "", x: year },
  }
}
