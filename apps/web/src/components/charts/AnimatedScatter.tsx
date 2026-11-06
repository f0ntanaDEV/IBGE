import { useEffect, useMemo, useRef, useState } from "react"
import { Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useChartTheme } from "@/hooks/useChartTheme"
import { formatValue } from "@/lib/format"

export type ScatterPoint = {
  ano: number
  cod: number
  sigla: string
  local: string
  e0: number
  tft: number
  populacao: number
}

const config: ChartConfig = {
  e0: { label: "Esperança de vida" },
  tft: { label: "Filhos por mulher" },
}

export function AnimatedScatter({
  points,
  summary,
  selected = [],
  onSelect,
}: {
  points: ScatterPoint[]
  summary: string
  selected?: number[]
  onSelect?: (cod: number) => void
}) {
  const { colors } = useChartTheme()
  const years = useMemo(() => [...new Set(points.map((point) => point.ano))].sort((a, b) => a - b), [points])
  const [year, setYear] = useState(years[0] ?? 0)
  const [playing, setPlaying] = useState(false)
  const [showTrail, setShowTrail] = useState(false)
  const history = useRef(new Map<string, { x: number; y: number }>())
  const current = years.includes(year) ? year : (years[0] ?? 0)
  const shown = points
    .filter((point) => point.ano === current)
    .map((point) => ({ ...point, tamanho: Math.sqrt(Math.max(point.populacao, 0)) }))

  useEffect(() => {
    if (!playing || years.length < 2) return
    const timer = window.setInterval(() => {
      setYear((value) => {
        const index = years.indexOf(value)
        return years[(index + 1) % years.length]
      })
    }, 800)
    return () => window.clearInterval(timer)
  }, [playing, years])

  return (
    <div role="img" aria-label={summary} className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className="rounded-md border border-border px-2 py-1" onClick={() => setPlaying((value) => !value)}>
          {playing ? "Pausar" : "Reproduzir"}
        </button>
        <input
          aria-label="Ano"
          type="range"
          min={0}
          max={Math.max(years.length - 1, 0)}
          value={Math.max(years.indexOf(current), 0)}
          onChange={(event) => setYear(years[Number(event.target.value)] ?? current)}
        />
        <span className="tabular-nums">{current}</span>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={showTrail} onChange={(event) => setShowTrail(event.target.checked)} />
          Mostrar trajetória
        </label>
      </div>
      <ChartContainer config={config} className="h-full min-h-0 flex-1">
        <ScatterChart margin={{ left: 8, right: 8, top: 8 }}>
          <XAxis dataKey="tft" type="number" name="TFT" stroke="hsl(var(--muted-foreground))" />
          <YAxis dataKey="e0" type="number" name="e0" stroke="hsl(var(--muted-foreground))" width={40} />
          <ZAxis dataKey="tamanho" range={[40, 400]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, key) =>
                  formatValue(value, { key, kind: key === "populacao" ? "count" : "years" })
                }
              />
            }
          />
          <Scatter
            data={shown}
            fill={colors[0] || "hsl(var(--chart-1))"}
            fillOpacity={0.85}
            isAnimationActive={false}
            onClick={(point: ScatterPoint) => onSelect?.(point.cod)}
            shape={(props: { cx?: number; cy?: number; size?: number; payload?: ScatterPoint }) => {
              const payload = props.payload
              const faded = selected.length > 0 && payload && !selected.includes(payload.cod)
              const radius = Math.sqrt(Math.max(props.size ?? 40, 0) / Math.PI)
              const fill = colors[0] || "hsl(var(--chart-1))"
              if (payload && props.cx != null && props.cy != null) {
                history.current.set(`${payload.cod}:${current}`, { x: props.cx, y: props.cy })
              }
              const trail =
                showTrail && payload && selected.includes(payload.cod)
                  ? years
                      .filter((item) => item <= current)
                      .flatMap((item) => {
                        const point = history.current.get(`${payload.cod}:${item}`)
                        return point ? [point] : []
                      })
                  : []
              const bubble = <circle cx={props.cx} cy={props.cy} r={radius} fill={fill} fillOpacity={faded ? 0.35 : 0.85} />
              return (
                <g>
                  {trail.slice(0, -1).map((point, index) => {
                    const next = trail[index + 1]
                    if (!next) return null
                    return (
                      <line
                        key={`${point.x}-${point.y}`}
                        x1={point.x}
                        y1={point.y}
                        x2={next.x}
                        y2={next.y}
                        stroke={fill}
                        strokeOpacity={(index + 1) / trail.length}
                      />
                    )
                  })}
                  {bubble}
                </g>
              )
            }}
          />
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
