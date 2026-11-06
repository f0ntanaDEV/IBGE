import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"
import { formatValue } from "@/lib/format"

export function biggestChange(ctx: NarrativeContext): Insight | null {
  const change = ctx.data.change
  if (!change) return null
  return {
    type: "biggestChange",
    relevance: 0.72,
    text: renderTemplate("biggestChange", ctx, {
      anoA: String(change.anoA),
      anoB: String(change.anoB),
      delta: formatValue(change.delta, { key: "delta", kind: "delta" }),
    }),
    highlight: { chartId: ctx.chartId ?? "", x: change.anoB },
  }
}
