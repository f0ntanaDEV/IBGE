import { evaluate, ruleForMetric, type Status } from "@/content/kpi-rules"
import { metricById, metricLabel } from "@/content/metricas"
import { deltaForMetric, formatValue } from "@/lib/format"

export function kpiView(
  metricId: string,
  input: {
    value: number | null
    prevYear?: number | null
    past10?: number | null
    brazil?: number | null
    year2000?: number | null
    cod: number
    withSigla?: boolean
  },
) {
  const metric = metricById(metricId)
  const rule = ruleForMetric(metricId)
  const level = metric?.kind === "percent" && input.value != null ? input.value * 100 : input.value
  const yoyPct = input.value != null && input.prevYear != null && input.prevYear !== 0 ? (input.value / input.prevYear - 1) * 100 : undefined
  const delta10Pp =
    input.value != null && input.past10 != null ? (metric?.kind === "percent" ? (input.value - input.past10) * 100 : input.value - input.past10) : undefined
  const brazil = metric?.kind === "percent" && input.brazil != null ? input.brazil * 100 : input.brazil
  let status: Status | undefined
  if (rule && level != null) {
    const missingYoy = rule.basis === "yoy_pct" && yoyPct == null
    const missingDelta = rule.basis === "delta10_pp" && delta10Pp == null
    const missingRef = rule.basis === "vs_brazil" && input.cod !== 0 && brazil == null
    if (!missingYoy && !missingDelta && !missingRef) {
      status = evaluate(rule.id, {
        value: level,
        brazil: input.cod === 0 ? undefined : brazil ?? undefined,
        prev: input.prevYear ?? undefined,
        yoyPct,
        delta10Pp,
      }).status
    }
  }
  const reference =
    input.cod === 0
      ? input.year2000 == null
        ? undefined
        : `2000: ${formatValue(input.year2000, metricId)}`
      : input.brazil == null
        ? undefined
        : `Brasil: ${formatValue(input.brazil, metricId)}`
  return {
    label: metricLabel(metricId, input.withSigla),
    status,
    reference,
    delta: deltaForMetric(input.value, input.past10 ?? null, metricId),
    action: rule?.action ?? "",
  }
}
