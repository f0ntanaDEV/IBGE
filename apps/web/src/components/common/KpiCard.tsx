import { useRef } from "react"
import { GlossaryPopover } from "@/features/glossary/GlossaryPopover"
import { unidadeKpi } from "@/features/glossary/glossary"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatValue, type NumberFormat } from "@/lib/format"
import { useMode } from "@/stores/preferences"

type KpiCardProps = {
  label: string
  value: number | null
  format: NumberFormat
  metricKey?: string
  display?: string
  delta?: number | null
  loading?: boolean
}

function bareNumber(value: number, format: NumberFormat, mode: "technical" | "simple") {
  if (format === "percent") return formatValue(value, { key: "kpi", kind: "percent" }, mode)
  if (format === "integer") return formatValue(value, { key: "kpi", kind: "count" }, mode)
  if (format === "permil") return formatValue(value, { key: "kpi", kind: "permil" }, mode)
  if (format === "years") return formatValue(value, { key: "kpi", kind: "years" }, mode).replace(/ anos$/, "")
  if (format === "number") return formatValue(value, { key: "kpi", kind: "raw" }, mode)
  return formatValue(value, { key: "kpi", kind: "rate" }, mode)
}

function KpiDelta({ value }: { value: number | null | undefined }) {
  if (value == null || Number.isNaN(value)) return <p className="min-h-5 text-sm text-muted-foreground">&nbsp;</p>
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→"
  const amount = formatValue(Math.abs(value), { key: "delta", kind: "delta" })
  return <p className="truncate text-sm text-muted-foreground">{arrow} {amount}% em 10 anos</p>
}

export function KpiCard({ label, value, format, metricKey, display, delta, loading }: KpiCardProps) {
  const mode = useMode()
  const cardRef = useRef<HTMLDivElement>(null)
  const unit = display || format === "percent" ? null : unidadeKpi(metricKey ?? "", value)

  if (loading) {
    return (
      <Card role="status" aria-busy="true" aria-label={label} className="flex h-full min-h-[7rem] flex-col gap-1 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-28" />
      </Card>
    )
  }

  const shown = display ?? (value == null ? "—" : bareNumber(value, format, mode))

  return (
    <Card
      ref={cardRef}
      data-population={metricKey === "pop_t" || metricKey === "populacao" ? value ?? undefined : undefined}
      className="flex h-full min-h-[7rem] flex-col gap-1 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm text-muted-foreground">{label}</span>
        {metricKey ? <GlossaryPopover metricKey={metricKey} cardRef={cardRef} /> : null}
      </div>
      <div className="flex min-w-0 items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{shown}</span>
        {unit ? <span className="truncate text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      <KpiDelta value={delta} />
    </Card>
  )
}
