import { Bar, BarChart, Cell, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatAxis } from "@/lib/chart-axes"
import { formatValue } from "@/lib/format"

export type GapItem = {
  cod: number
  sigla: string
  local: string
  e0_h: number | null
  e0_m: number | null
  e60_h: number | null
  e60_m: number | null
}

function gap(women: number | null, men: number | null) {
  if (women == null || men == null) return null
  return women - men
}

export function DivergingBars({
  items,
  summary,
  selected = [],
  onSelect,
}: {
  items: GapItem[]
  summary: string
  selected?: number[]
  onSelect?: (cod: number) => void
}) {
  const { colors, chartAnim } = useChartTheme()
  const simple = false
  const rows = items.map((item) => ({
    ...item,
    e0: gap(item.e0_m, item.e0_h),
    e60: gap(item.e60_m, item.e60_h),
  }))
  const config: ChartConfig = {
    e0: { label: simple ? "Ao nascer" : "Ao nascer, mulheres − homens", color: colors[0] },
    e60: { label: "Aos 60 anos, mulheres − homens", color: colors[1] },
  }
  const extent = Math.max(1, ...rows.flatMap((row) => [Math.abs(row.e0 ?? 0), simple ? 0 : Math.abs(row.e60 ?? 0)]))

  return (
    <div role="img" aria-label={summary} className="flex h-full min-h-0 flex-col">
      <ChartContainer config={config} className="h-full min-h-0 flex-1">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 8, top: 8 }}>
          <XAxis type="number" domain={[-extent, extent]} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatAxis(Number(value), { key: "e0", kind: "years" })} />
          <YAxis type="category" dataKey="sigla" stroke="hsl(var(--muted-foreground))" width={36} />
          <ReferenceLine x={0} stroke="hsl(var(--foreground))" />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatValue(value, { key: "e0", kind: "years" })} />} />
          <Bar dataKey="e0" fill={colors[0] || "hsl(var(--chart-1))"} {...chartAnim} onClick={(row) => onSelect?.(Number(row.cod))}>
            {rows.map((row) => (
              <Cell
                key={row.cod}
                fillOpacity={selected.length > 0 && !selected.includes(row.cod) ? 0.35 : 1}
              />
            ))}
          </Bar>
          {simple ? null : (
            <Bar dataKey="e60" fill={colors[1] || "hsl(var(--chart-2))"} {...chartAnim} onClick={(row) => onSelect?.(Number(row.cod))}>
              {rows.map((row) => (
                <Cell
                key={row.cod}
                fillOpacity={selected.length > 0 && !selected.includes(row.cod) ? 0.35 : 1}
              />
              ))}
            </Bar>
          )}
        </BarChart>
      </ChartContainer>
    </div>
  )
}
