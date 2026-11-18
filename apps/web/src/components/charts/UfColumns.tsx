import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { ZoneBand, zoneColor } from "@/components/charts/ZoneBand"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { niceTicks, valueDomain } from "@/lib/chart-axes"
import { xAxisDefaults, yAxisDefaults } from "@/lib/chartDefaults"
import { formatValue, type MetricMeta } from "@/lib/format"
import type { Zone } from "@/lib/zones"

export type UfRow = { cod: number; sigla: string; valores: Record<string, number | null> }
export type UfSeries = { key: string; label: string; color: string }

export function UfColumns({
  rows,
  series,
  metric,
  selectedCods = [],
  zones,
  summary,
  onSelect,
}: {
  rows: UfRow[]
  series: UfSeries[]
  metric: MetricMeta
  selectedCods?: number[]
  zones?: Zone[] | null
  summary: string
  onSelect?: (cod: number) => void
}) {
  const { chartAnim } = useChartTheme()
  const host = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const data = useMemo(() => {
    const key = series[0]?.key ?? ""
    return [...rows]
      .sort((a, b) => (b.valores[key] ?? 0) - (a.valores[key] ?? 0))
      .map((row) => ({ cod: row.cod, sigla: row.sigla, ...row.valores }) as { cod: number; sigla: string } & Record<string, number | null>)
  }, [rows, series])
  const values = data.flatMap((row) => series.map((item) => row[item.key])).filter((value): value is number => typeof value === "number")
  const domain = valueDomain(values)
  const ticks = niceTicks(domain, 5)
  const rotate = width / Math.max(data.length, 1) < 28
  const config: ChartConfig = Object.fromEntries(series.map((item) => [item.key, { label: item.label, color: item.color }]))
  const selected = new Set(selectedCods)
  return (
    <div ref={host} className="flex h-full min-h-0 flex-col" role="img" aria-label={summary}>
      <ChartContainer config={config} className="min-h-0 w-full flex-1">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: rotate ? 28 : 8, left: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.35} vertical={false} />
          {zones?.map((zone) => (
            <ZoneBand key={zone.label} zone={zone} y1={zone.from ?? domain[0]} y2={zone.to ?? domain[1]} />
          ))}
          <XAxis dataKey="sigla" interval={0} angle={rotate ? -45 : 0} textAnchor={rotate ? "end" : "middle"} height={rotate ? 48 : 24} tickMargin={xAxisDefaults.tickMargin} padding={xAxisDefaults.padding} stroke="hsl(var(--muted-foreground))" />
          <YAxis domain={domain} ticks={ticks} tickMargin={yAxisDefaults.tickMargin} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatValue(Number(value), metric)} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatValue(value, metric)} />} />
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} {...chartAnim} onClick={(row) => onSelect?.(Number(row.cod))}>
              {data.map((row) => (
                <Cell key={row.cod} fill={item.color} fillOpacity={selected.size === 0 || selected.has(row.cod) ? 1 : 0.35} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
      {series.length > 1 ? (
        <ul className="mt-2 flex flex-wrap gap-3 text-xs">
          {series.map((item) => (
            <li key={item.key} className="flex items-center gap-1">
              <span className="size-2" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      {zones?.length ? (
        <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {zones.map((zone) => (
            <li key={zone.label} className="flex items-center gap-1">
              <span className="size-2" style={{ background: zoneColor(zone.status) }} />
              {zone.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
