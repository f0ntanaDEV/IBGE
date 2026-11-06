import { memo, useEffect, useMemo, useState, type Ref } from "react"
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { calendarYear, crossingYear, peakPoint } from "@/features/datasets/derive"
import { useChartTheme } from "@/hooks/useChartTheme"
import { decadeDomain, decadeTicks, formatAxis, labelSide, niceDomain, niceTicks, yAxisWidth, YEAR_TICKS, YEAR_TICKS_MOBILE } from "@/lib/chart-axes"
import { formatValue, metricFromFormat, type NumberFormat } from "@/lib/format"

export type LinePoint = { ano: number } & Record<string, number | null>

type Series = { key: string; label: string; format: NumberFormat }

type ProjectionLineProps = {
  data: LinePoint[]
  series: Series[]
  variant: "line" | "area" | "area100"
  refLine?: { y: number; label: string }
  markCrossing?: [string, string]
  markMax?: boolean
  logY?: boolean
  summary: string
  syncId?: string
  yDomain?: [number, number]
  compact?: boolean
  band?: { x1: number; x2: number }
  markYear?: number
}

function ProjectionLineView({
  data,
  series,
  variant,
  refLine,
  markCrossing,
  markMax,
  logY,
  summary,
  syncId,
  yDomain,
  compact = false,
  band,
  markYear,
}: ProjectionLineProps) {
  const { colors, isAnimationActive } = useChartTheme()
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())
  const [inside, setInside] = useState(false)
  const simple = false
  const narrow = useNarrow()
  const candidates = simple ? series.slice(0, 3) : series
  const shown = candidates.filter((item) => !hidden.has(item.key))
  const log = Boolean(logY) && !simple
  const current = calendarYear()
  const config = useMemo<ChartConfig>(() => {
    const next: ChartConfig = {}
    shown.forEach((item, index) => {
      next[item.key] = { label: item.label, color: colors[index] || "var(--color-chart-1)" }
    })
    return next
  }, [colors, shown])

  const chartData = useMemo(() => {
    return data.map((row) => {
      const next: LinePoint = { ano: row.ano }
      for (const item of shown) {
        const value = row[item.key] ?? null
        if (value != null) next[item.key] = value
        if (row.ano <= current && value != null) next[`${item.key}:observado`] = value
        if (row.ano >= current && value != null) next[`${item.key}:projetado`] = value
      }
      if (variant === "area" && shown.length === 2) {
        const high = row[shown[0].key]
        const low = row[shown[1].key]
        if (high != null && low != null) {
          next.bandaBase = Math.min(high, low)
          next.banda = Math.abs(high - low)
        }
      }
      return next
    })
  }, [current, data, shown, variant])

  const peak = markMax ? peakPoint(data.map((row) => ({ ano: row.ano, valor: row[shown[0]?.key ?? ""] ?? null }))) : null
  const cross =
    markCrossing == null
      ? null
      : crossingYear(data.map((row) => ({ ano: row.ano, a: row[markCrossing[0]] ?? null, b: row[markCrossing[1]] ?? null })))
  const crossValue = cross == null || markCrossing == null ? null : (data.find((row) => row.ano === cross)?.[markCrossing[0]] ?? null)
  const yFormat = shown[0]?.format ?? "decimal"
  const axisMetric = metricFromFormat(variant === "area100" || yFormat === "percent" ? "percent" : yFormat, shown[0]?.key)
  const life = shown.some((item) => item.key.startsWith("e0"))
  const formatTick = (value: number) => (life ? String(Math.round(value)) : formatAxis(value, axisMetric))
  const yValues = shown.flatMap((item) => data.map((row) => row[item.key]).filter((value): value is number => typeof value === "number"))
  const computedDomain = variant === "area100" ? ([0, 1] as [number, number]) : log ? undefined : life ? decadeDomain(yValues) : niceDomain(yValues.length ? yValues : [0, 1])
  const domain = yDomain ?? computedDomain
  const ticks = domain ? (life ? decadeTicks(domain) : niceTicks(domain, narrow ? 4 : 5)) : undefined
  const directLabels = Boolean(markCrossing) || shown.some((item) => item.key.startsWith("e0_"))
  const endShift = new Map<string, number>()
  if (directLabels) {
    const last = shown
      .map((item) => ({ key: item.key, value: data[data.length - 1]?.[item.key] }))
      .filter((item): item is { key: string; value: number } => typeof item.value === "number")
      .sort((a, b) => a.value - b.value)
    let previous = Number.NEGATIVE_INFINITY
    const span = domain ? domain[1] - domain[0] || 1 : 1
    for (const item of last) {
      const close = item.value - previous < span * 0.04
      endShift.set(item.key, close ? 14 : 0)
      previous = item.value
    }
  }
  const formatPoint = (value: number, key: string) => {
    const seriesKey = key.split(":")[0] ?? key
    const item = shown.find((entry) => entry.key === seriesKey)
    const format = variant === "area100" || item?.format === "percent" ? "percent" : (item?.format ?? yFormat)
    return formatValue(value, metricFromFormat(format, seriesKey))
  }

  return (
    <div role="img" aria-label={summary} className="flex h-full min-h-0 flex-col">
      <ChartContainer config={config} className={compact ? "aspect-auto h-36 w-full" : "h-full min-h-0 w-full flex-1"}>
        <ComposedChart
          data={chartData}
          margin={{ left: 8, right: directLabels ? 72 : 16, top: 18 }}
          syncId={syncId ?? "page"}
          onMouseEnter={() => setInside(true)}
          onMouseLeave={() => setInside(false)}
        >
          <CartesianGrid stroke="hsl(var(--border))" vertical={!simple} />
          <XAxis
            dataKey="ano"
            type="number"
            domain={[2000, 2070]}
            ticks={narrow ? YEAR_TICKS_MOBILE : YEAR_TICKS}
            allowDecimals={false}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            scale={log ? "log" : "auto"}
            domain={domain ?? ["auto", "auto"]}
            ticks={log ? undefined : ticks}
            tickFormatter={(value) => formatTick(Number(value))}
            stroke="hsl(var(--muted-foreground))"
            width={ticks ? yAxisWidth(ticks, formatTick) : 48}
          />
          <ChartTooltip
            {...(inside ? {} : { active: false, cursor: false })}
            content={<LineTooltip formatter={formatPoint} gap={shown.some((item) => item.key === "e0_h") && shown.some((item) => item.key === "e0_m")} />}
          />
          <ReferenceLine
            x={current}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.45}
            label={{ value: "Projeção →", position: "insideTopRight", fill: "hsl(var(--muted-foreground))" }}
          />
          {life ? <CovidNote /> : null}
          {band ? <ReferenceArea x1={band.x1} x2={band.x2} /> : null}
          {markYear != null ? <ReferenceLine x={markYear} stroke={colors[1] || "hsl(var(--chart-2))"} /> : null}
          {refLine ? <ReferenceLine y={refLine.y} stroke={colors[2] || "var(--color-chart-3)"} label={refLine.label} /> : null}
          {variant === "area" && shown.length === 2 && !simple ? (
            <>
              <Area dataKey="bandaBase" stackId="banda" stroke="none" fill="transparent" isAnimationActive={isAnimationActive} legendType="none" />
              <Area dataKey="banda" stackId="banda" stroke="none" fill={colors[2] || "var(--color-chart-3)"} fillOpacity={0.35} isAnimationActive={isAnimationActive} name="Crescimento vegetativo" />
            </>
          ) : null}
          {shown.map((item, index) => {
            const color = colors[index] || "hsl(215 24% 62%)"
            if (variant === "area100") {
              return (
                <Area
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  stackId="faixa"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.55}
                  isAnimationActive={isAnimationActive}
                />
              )
            }
            return (
              <Line
                key={`${item.key}-obs`}
                dataKey={`${item.key}:observado`}
                name={item.label}
                stroke={color}
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
                connectNulls={false}
                legendType="none"
                shape={(props: DrawShapeProps) => <SeriesShape {...props} />}
              />
            )
          })}
          {variant !== "area100"
            ? shown.map((item, index) => (
                <Line
                  key={`${item.key}-proj`}
                  dataKey={`${item.key}:projetado`}
                  name={item.label}
                  stroke={colors[index] || "hsl(215 24% 62%)"}
                  dot={false}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  connectNulls={false}
                  legendType="none"
                  shape={(props: DrawShapeProps) => <SeriesShape {...props} dashed />}
                  label={
                    directLabels
                      ? (props: { index?: number; x?: number; y?: number }) =>
                          props.index === chartData.length - 1 ? (
                            <EndLabel x={Number(props.x)} y={Number(props.y) + (endShift.get(item.key) ?? 0)} text={item.label} />
                          ) : (
                            <g />
                          )
                      : undefined
                  }
                />
              ))
            : null}
          {peak ? (
            <ReferenceDot
              x={peak.ano}
              y={peak.valor}
              r={3}
              fill={colors[0] || "var(--color-chart-1)"}
              stroke="none"
              label={{
                value: `Pico: ${formatAxis(peak.valor, axisMetric, 1)} (${peak.ano})`,
                position: labelSide(peak.ano, [2000, 2070]),
                fill: "currentColor",
                fontSize: 11,
              }}
            />
          ) : null}
          {cross != null && crossValue != null ? (
            <ReferenceDot
              x={cross}
              y={crossValue}
              r={0}
              shape={(props: { cx?: number; cy?: number }) => <CrossingMark cx={props.cx} cy={props.cy} stroke={colors[3] || "var(--color-chart-4)"} />}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
      {!directLabels && candidates.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {candidates.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={!hidden.has(item.key)}
              className="rounded-md border border-border px-2 py-1 text-xs"
              onClick={() =>
                setHidden((current) => {
                  const next = new Set(current)
                  if (next.has(item.key)) next.delete(item.key)
                  else next.add(item.key)
                  return next
                })
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {simple && variant === "area100" ? <p className="text-sm">{shown.map((item) => item.label).join(" · ")}</p> : null}
    </div>
  )
}

type CurvePoint = { x?: number | null; y?: number | null }

type DrawShapeProps = {
  d?: string
  points?: readonly CurvePoint[]
  stroke?: string
  strokeWidth?: number | string
  pathRef?: Ref<SVGPathElement>
}

function pathFromPoints(points?: readonly CurvePoint[]) {
  if (!points?.length) return ""
  let path = ""
  let open = false
  for (const point of points) {
    if (point.x == null || point.y == null) {
      open = false
      continue
    }
    path += `${open ? "L" : "M"}${point.x},${point.y}`
    open = true
  }
  return path
}

function SeriesShape({ points, stroke, strokeWidth = 1.5, d, dashed }: DrawShapeProps & { dashed?: boolean }) {
  const path = d || pathFromPoints(points)
  if (!path) return <g />
  return <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dashed ? "4 4" : undefined} />
}

function CovidNote() {
  const x1: number = 2020
  const x2: number = 2021
  return (
    <ReferenceArea
      x1={x1}
      x2={x2}
      shape={(props: { x?: number; y?: number; width?: number; height?: number }) => (
        <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="none" />
      )}
      label={{ value: "Covid-19", position: "insideTop", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
    />
  )
}

function EndLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x + 6} y={y} fill="currentColor" fontSize={12}>
      {text}
    </text>
  )
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const apply = () => setNarrow(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])
  return narrow
}

type TooltipPayload = { dataKey?: string | number; value?: number | string; name?: string; color?: string }

function LineTooltip({
  active,
  payload,
  label,
  formatter,
  gap,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  formatter: (value: number, key: string) => string
  gap: boolean
}) {
  const men = payload?.find((item) => String(item.dataKey).startsWith("e0_h"))
  const women = payload?.find((item) => String(item.dataKey).startsWith("e0_m"))
  const diff =
    gap && typeof men?.value === "number" && typeof women?.value === "number"
      ? `Diferença: ${formatValue(women.value - men.value, { key: "e0", kind: "years" })}`
      : null
  return (
    <>
      <ChartTooltipContent active={active} payload={payload} label={label} formatter={formatter} />
      {diff ? <p className="px-3 pb-2 text-xs text-muted-foreground">{diff}</p> : null}
    </>
  )
}

function CrossingMark({ cx, cy, stroke }: { cx?: number; cy?: number; stroke: string }) {
  if (cx == null || cy == null) return <g />
  const arm = 7
  return (
    <g>
      <line x1={cx - arm} y1={cy - arm} x2={cx + arm} y2={cy + arm} stroke={stroke} strokeWidth={1.5} />
      <line x1={cx - arm} y1={cy + arm} x2={cx + arm} y2={cy - arm} stroke={stroke} strokeWidth={1.5} />
    </g>
  )
}

export const ProjectionLine = memo(ProjectionLineView)
