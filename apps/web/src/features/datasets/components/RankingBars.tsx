import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatValue, metricFromFormat, type NumberFormat } from "@/lib/format"

export type RankRow = { cod: number; label: string; value: number }

type MetricOption = { key: string; label: string; format: NumberFormat }

type RankingBarsProps = {
  rowsByMetric: Record<string, RankRow[]>
  options: MetricOption[]
  selectedCod: number
  summary: string
}

function asFormat(format: string): NumberFormat {
  if (format === "int") return "integer"
  if (format === "percent" || format === "permil" || format === "years" || format === "decimal" || format === "number") return format
  return "decimal"
}

function RankingBarsView({ rowsByMetric, options, selectedCod, summary }: RankingBarsProps) {
  const { colors, chartAnim } = useChartTheme()
  const simple = false
  const [metric, setMetric] = useState(options[0]?.key ?? "")
  const format = asFormat(options.find((item) => item.key === metric)?.format ?? "decimal")
  const rows = useMemo(() => {
    const ordered = [...(rowsByMetric[metric] ?? [])].sort((a, b) => b.value - a.value)
    return simple ? ordered.slice(0, 5) : ordered
  }, [metric, rowsByMetric, simple])
  const formatTick = (value: number) => formatValue(value, metricFromFormat(format, metric))
  const plotRef = useRef<HTMLDivElement>(null)
  const [bodyHeight, setBodyHeight] = useState(320)
  useEffect(() => {
    const node = plotRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setBodyHeight(entry.contentRect.height))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const barSize = Math.max(2, Math.floor((bodyHeight - 36) / Math.max(rows.length, 1) - 4))
  const config: ChartConfig = { value: { label: options.find((item) => item.key === metric)?.label, color: colors[0] } }
  const accent = colors[0] || "var(--color-chart-1)"
  const muted = "hsl(var(--muted-foreground))"

  return (
    <div className="flex h-full min-h-0 flex-col gap-3" role="img" aria-label={summary}>
      {options.length > 1 && !simple ? (
        <label className="grid max-w-xs gap-1 text-sm">
          Indicador
          <select
            className="h-9 rounded-md border border-border bg-background px-2"
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div ref={plotRef} className="min-h-0 flex-1">
      <ChartContainer config={config} className="h-full min-h-0 w-full">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 8 }} barCategoryGap={4}>
          <CartesianGrid horizontal={false} vertical={!simple} stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" tickCount={simple ? 5 : undefined} tickFormatter={(value) => formatTick(Number(value))} />
          <YAxis type="category" dataKey="label" width={108} interval={0} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatTick(value)} />} />
          <Bar dataKey="value" barSize={barSize} {...chartAnim}>
            {rows.map((row) => (
              <Cell key={row.cod} fill={row.cod === selectedCod ? accent : muted} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      </div>
    </div>
  )
}

export const RankingBars = memo(RankingBarsView)
