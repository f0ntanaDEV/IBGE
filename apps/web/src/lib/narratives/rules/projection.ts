import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"

export function projection(ctx: NarrativeContext): Insight | null {
  const from = ctx.data.projectionFrom
  if (from == null) return null
  const last = ctx.data.series?.[ctx.data.series.length - 1]?.ano
  if (last == null || last < from) return null
  return {
    type: "projection",
    relevance: 0.5,
    text: renderTemplate("projection", ctx, { desde: String(from) }),
    highlight: { chartId: ctx.chartId ?? "", x: from },
  }
}
