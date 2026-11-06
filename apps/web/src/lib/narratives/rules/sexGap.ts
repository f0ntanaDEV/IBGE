import { renderTemplate } from "@/lib/narratives/templates"
import type { Insight, NarrativeContext } from "@/lib/narratives/types"
import { formatValue } from "@/lib/format"

export function sexGap(ctx: NarrativeContext): Insight | null {
  const sex = ctx.data.sex
  if (!sex) return null
  const gap = sex.m - sex.h
  const maior = gap >= 0 ? "As mulheres vivem" : "Os homens vivem"
  return {
    type: "sexGap",
    relevance: 0.8,
    text: renderTemplate("sexGap", ctx, {
      gap: formatValue(Math.abs(gap), { key: "e0", kind: "years" }),
      maior,
    }),
  }
}
