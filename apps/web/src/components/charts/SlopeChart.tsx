import { useMemo } from "react"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { placeLabels } from "@/components/charts/labelPlace"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatValue, type MetricMeta } from "@/lib/format"

export type SlopeItem = {
  cod: number
  sigla: string
  local: string
  valor_a: number | null
  valor_b: number | null
  delta?: number | null
}

export function SlopeChart({
  items,
  anoA,
  anoB,
  metric,
  summary,
  selected = [],
  onSelect,
}: {
  items: SlopeItem[]
  anoA: number
  anoB: number
  metric: MetricMeta
  summary: string
  selected?: number[]
  onSelect?: (cod: number) => void
}) {
  const { colors, chartAnim } = useChartTheme()
  const usable = items.filter((item) => item.valor_a != null && item.valor_b != null)
  const rows = useMemo(
    () => [
      Object.fromEntries(usable.map((item) => [String(item.cod), item.valor_a])),
      Object.fromEntries(usable.map((item) => [String(item.cod), item.valor_b])),
    ].map((row, index) => ({ ...row, ano: index === 0 ? anoA : anoB })),
    [anoA, anoB, usable],
  )
  const values = usable.flatMap((item) => [item.valor_a as number, item.valor_b as number])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const labels = placeLabels(
    usable.map((item) => ({ cod: item.cod, y: (max - (item.valor_b as number)) / span })),
  )
  const byCod = new Map(usable.map((item) => [item.cod, item]))
  const config: ChartConfig = {}

  return (
    <div role="img" aria-label={summary} className="grid h-full min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_4.5rem] gap-2">
      <ChartContainer config={config} className="h-full min-h-0 min-w-0">
        <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <XAxis dataKey="ano" stroke="hsl(var(--muted-foreground))" />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            width={56}
            domain={[min, max]}
            tickFormatter={(value: number) => formatValue(value, metric)}
          />
          {usable.map((item, index) => {
            const faded = selected.length > 0 && !selected.includes(item.cod)
            return (
              <Line
                key={item.cod}
                dataKey={String(item.cod)}
                stroke={colors[index % colors.length] || "hsl(var(--chart-1))"}
                strokeOpacity={faded ? 0.35 : 1}
                dot={{ r: 3, cursor: "pointer", onClick: () => onSelect?.(item.cod) }}
                strokeWidth={1.5}
                {...chartAnim}
              />
            )
          })}
        </LineChart>
      </ChartContainer>
      <div className="relative min-h-0 flex-1">
        {labels.map((label) => {
          const item = byCod.get(label.cod)
          if (!item) return null
          return (
            <button
              key={label.cod}
              type="button"
                className="absolute left-0 max-w-full truncate text-xs"
              style={{ top: `${label.y * 100}%`, opacity: selected.length > 0 && !selected.includes(label.cod) ? 0.35 : 1 }}
              onClick={() => onSelect?.(label.cod)}
            >
              {item.sigla} {formatValue(item.valor_b, metric)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
