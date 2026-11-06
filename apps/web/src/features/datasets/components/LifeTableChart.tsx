import { memo, useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatValue, type MetricKind } from "@/lib/format"

export type LifePoint = { idade: number } & Record<string, number | null>

type LifeTableChartProps = {
  data: LifePoint[]
  series: { key: string; label: string }[]
  logY?: boolean
  summary: string
}

function LifeTableChartView({ data, series, logY = false, summary }: LifeTableChartProps) {
  const { colors, isAnimationActive } = useChartTheme()
  const simple = false
  const shown = simple ? series.slice(0, 3) : series
  const log = logY && !simple
  const kind: MetricKind = log ? "rate" : "count"
  const config = useMemo<ChartConfig>(() => {
    const next: ChartConfig = {}
    shown.forEach((item, index) => {
      next[item.key] = { label: item.label, color: colors[index] || "var(--color-chart-1)" }
    })
    return next
  }, [colors, shown])
  const safe = useMemo(
    () =>
      data.map((row) => {
        if (!log) return row
        const next: LifePoint = { idade: row.idade }
        for (const item of shown) {
          const value = row[item.key]
          next[item.key] = value != null && value > 0 ? value : null
        }
        return next
      }),
    [data, log, shown],
  )
  const formatTick = (value: number) => formatValue(value, { key: "lx", kind })

  return (
    <div role="img" aria-label={summary} className="flex h-full min-h-0 flex-col">
      <ChartContainer config={config} className="h-full min-h-0 w-full flex-1">
        <LineChart data={safe} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={!simple} />
          <XAxis dataKey="idade" stroke="hsl(var(--muted-foreground))" tickCount={simple ? 5 : undefined} />
          <YAxis
            scale={log ? "log" : "auto"}
            domain={["auto", "auto"]}
            stroke="hsl(var(--muted-foreground))"
            width={56}
            tickCount={simple ? 5 : undefined}
            tickFormatter={(value) => formatTick(Number(value))}
          />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatTick(value)} />} />
          {shown.map((item, index) => (
            <Line
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stroke={colors[index] || "var(--color-chart-1)"}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={isAnimationActive}
              connectNulls={false}
              label={
                simple
                  ? (props: { index?: number; x?: number; y?: number }) =>
                      props.index === safe.length - 1 ? (
                        <text x={Number(props.x) + 6} y={Number(props.y)} fill="currentColor" fontSize={12}>
                          {item.label}
                        </text>
                      ) : (
                        <g />
                      )
                  : undefined
              }
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
}

export const LifeTableChart = memo(LifeTableChartView)
