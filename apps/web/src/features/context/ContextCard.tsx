import { ChartCard } from "@/components/common/ChartCard"
import { CountUp } from "@/motion/CountUp"
import type { ContextItem } from "@/features/datasets/api"
import { focusChart } from "@/lib/chartId"
import { formatValue, type MetricKind, type Mode } from "@/lib/format"

function kindOf(kind: ContextItem["kind"]): MetricKind {
  if (kind === "ratio") return "rate"
  return kind
}

function showValue(item: ContextItem, mode: Mode) {
  if (typeof item.value === "string") return item.value
  return formatValue(item.value, { key: item.id, kind: kindOf(item.kind) }, mode)
}

function NoteText({ item, mode }: { item: ContextItem; mode: Mode }) {
  if (!item.note) return null
  const chunks = item.note.split(/\{([^}]+)\}/g)
  return chunks.map((chunk, index) => {
    if (index % 2 === 0) return <span key={index}>{chunk}</span>
    const part = item.note_values?.find((entry) => entry.key === chunk)
    if (!part) return <span key={index}>{chunk}</span>
    if (typeof part.value !== "number" || part.kind === "year") {
      const formatted = typeof part.value === "string" ? part.value : formatValue(part.value, { key: part.key, kind: kindOf(part.kind) }, mode)
      const signed = typeof part.value === "number" && part.value > 0 && part.key === "delta" ? `+${formatted}` : formatted
      return <span key={index}>{signed}</span>
    }
    const kind = kindOf(part.kind)
    const positive = part.value > 0 && part.key === "delta"
    return (
      <CountUp
        key={`${part.key}-${index}`}
        value={part.value}
        metric={{ key: part.key, kind }}
        renderValue={(current) => {
          const formatted = formatValue(current, { key: part.key, kind }, mode)
          return positive && current > 0 ? `+${formatted}` : formatted
        }}
      />
    )
  })
}

export function ContextCard({
  items,
  loading,
  error,
  onRetry,
  mode = "technical",
  showCharts = true,
}: {
  items?: ContextItem[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  mode?: Mode
  showCharts?: boolean
}) {
  return (
    <ChartCard title="Contexto" chartId="contexto" loading={loading} error={error} onRetry={onRetry} pinned={false}>
      <ul className="divide-y">
        {!loading && !error && (items ?? []).length === 0 ? (
          <li className="py-2 text-sm text-muted-foreground">Sem indicadores de contexto para este recorte.</li>
        ) : null}
        {(items ?? []).map((item) => (
          <li key={item.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-semibold tabular-nums">
                {typeof item.value === "number" ? (
                  <CountUp value={item.value} metricKey={item.id} metric={{ key: item.id, kind: kindOf(item.kind) }} className="font-semibold tabular-nums" />
                ) : (
                  showValue(item, mode)
                )}
              </span>
            </div>
            {item.note ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"><NoteText item={item} mode={mode} /></p> : null}
            {showCharts ? (
              <button type="button" className="mt-1 text-xs underline-offset-2 hover:underline" onClick={() => focusChart(item.chart_id)}>
                Ver no gráfico: {item.chart_label}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
