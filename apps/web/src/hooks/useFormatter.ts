import { useCallback } from "react"
import { formatValue, type MetricMeta } from "@/lib/format"

export function useFormatter(metric: MetricMeta) {
  const { key, kind, unitSimple } = metric
  return useCallback(
    (value: number | null | undefined) => formatValue(value ?? null, { key, kind, unitSimple }),
    [key, kind, unitSimple],
  )
}
