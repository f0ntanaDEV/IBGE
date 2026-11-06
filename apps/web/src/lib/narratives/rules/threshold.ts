import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"
import { formatValue } from "@/lib/format"

export function threshold(ctx: NarrativeContext): Insight | null {
  const item = ctx.data.threshold
  if (!item || item.since == null || item.value >= item.limiar) return null
  return {
    type: "threshold",
    relevance: 0.9,
    text: renderTemplate("threshold", ctx, {
      limiar: formatValue(item.limiar, { key: "tft", kind: "rate" }),
      desde: String(item.since),
    }),
    highlight: { chartId: ctx.chartId ?? "", x: item.since },
  }
}
