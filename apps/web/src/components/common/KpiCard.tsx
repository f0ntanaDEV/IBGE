import { useRef } from "react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { GlossaryPopover } from "@/features/glossary/GlossaryPopover"
import { unidadeKpi } from "@/features/glossary/glossary"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Status } from "@/content/kpi-rules"
import { metricById } from "@/content/metricas"
import { formatDelta, formatValue, type NumberFormat } from "@/lib/format"
import { CountUp, EndFade } from "@/motion/CountUp"
import { CharFade } from "@/motion/WordReveal"
import { Reveal } from "@/motion/useMotion"
import { useMode } from "@/stores/preferences"

type KpiCardProps = {
  label: string
  value: number | null
  format: NumberFormat
  metricKey?: string
  display?: string
  delta?: number | null
  loading?: boolean
  status?: Status
  reference?: string
}

function bareNumber(value: number, format: NumberFormat, mode: "technical" | "simple", metricKey?: string) {
  if (metricKey && metricById(metricKey)) return formatValue(value, metricKey, mode).replace(/ anos$/, "")
  if (format === "percent") return formatValue(value, { key: "kpi", kind: "percent" }, mode)
  if (format === "integer") return formatValue(value, { key: "kpi", kind: "count" }, mode)
  if (format === "permil") return formatValue(value, { key: "kpi", kind: "permil" }, mode)
  if (format === "years") return formatValue(value, { key: "kpi", kind: "years" }, mode).replace(/ anos$/, "")
  if (format === "number") return formatValue(value, { key: "kpi", kind: "raw" }, mode)
  return formatValue(value, { key: "kpi", kind: "rate" }, mode)
}

export function KpiCard({ label, value, format, metricKey, display, delta, loading, status, reference }: KpiCardProps) {
  const mode = useMode()
  const cardRef = useRef<HTMLDivElement>(null)
  const catalog = metricKey ? metricById(metricKey) : undefined
  const unit = display || format === "percent" || catalog?.kind === "permil" || catalog?.unidade === "de cada 100" ? null : unidadeKpi(metricKey ?? "", value)

  if (loading) {
    return (
      <Card role="status" aria-busy="true" aria-label={label} className="flex h-full min-h-[7rem] flex-col gap-1 p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-28" />
      </Card>
    )
  }

  const shown = display ?? (value == null ? "—" : bareNumber(value, format, mode, metricKey))
  const deltaText = metricKey ? formatDelta(delta ?? null, metricKey) : ""

  const numeric = typeof value === "number" && display == null
  return (
    <Reveal className="h-full">
    <Card
      ref={cardRef}
      data-kpi={metricKey}
      data-population={metricKey === "pop_t" || metricKey === "populacao" ? value ?? undefined : undefined}
      className="flex h-full min-h-[7rem] flex-col gap-1 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <CharFade className="truncate text-sm text-muted-foreground" text={label} />
        <span className="flex items-center gap-1">
          {status ? (
            <EndFade>
              <StatusBadge status={status} />
            </EndFade>
          ) : null}
          {metricKey ? <GlossaryPopover metricKey={metricKey} cardRef={cardRef} /> : null}
        </span>
      </div>
      <div className="flex min-w-0 items-baseline gap-1.5">
        {numeric ? (
          <CountUp
            className="text-2xl font-semibold tabular-nums"
            value={value}
            metricKey={metricKey}
            format={format}
            renderValue={(current) => bareNumber(current, format, mode, metricKey)}
          />
        ) : (
          <span className="text-2xl font-semibold tabular-nums">{shown}</span>
        )}
        {unit ? <span className="truncate text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {reference ? <p className="truncate text-xs text-muted-foreground">{reference}</p> : null}
      <p className="truncate text-sm text-muted-foreground">{deltaText || "\u00a0"}</p>
    </Card>
    </Reveal>
  )
}
