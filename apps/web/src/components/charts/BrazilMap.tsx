import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { HeldTip, TipList } from "@/components/ui/chart"
import { glossaryByKey } from "@/features/glossary/glossary"
import { useChartTheme } from "@/hooks/useChartTheme"
import { motionVars, useMotion } from "@/motion/useMotion"
import { formatValue, type MetricMeta } from "@/lib/format"
import { classOf, quantileBreaks, quantizeBreaks } from "@/lib/quantiles"

export type BrazilMapItem = {
  cod: number
  sigla: string
  local: string
  valor: number | null
}

type MeshFeature = {
  type: "Feature"
  properties: { cod: number; sigla: string }
  geometry: GeoPermissibleObjects
}

type Mesh = { type: "FeatureCollection"; features: MeshFeature[] }

const WIDTH = 320
const HEIGHT = 320

function classLabel(index: number, edges: number[], format: (value: number) => string) {
  if (!edges.length) return ""
  if (index <= 0) return `até ${format(edges[0])}`
  if (index >= edges.length) return `acima de ${format(edges[edges.length - 1])}`
  return `${format(edges[index - 1])}–${format(edges[index])}`
}

export function mapPaint(state: "selecionado" | "contexto" | "normal") {
  if (state === "selecionado") return { fillOpacity: 1, strokeWidth: 2.5, stroke: "hsl(var(--foreground))" }
  if (state === "contexto") return { fillOpacity: 0.08, strokeWidth: 1, stroke: "hsl(var(--muted-foreground))" }
  return { fillOpacity: 1, strokeWidth: 1, stroke: "hsl(var(--muted-foreground))" }
}

export function BrazilMap({
  items,
  metric,
  summary,
  selected = [],
  onSelect,
  ufs,
  highlight,
  outline = false,
}: {
  items: BrazilMapItem[]
  metric: MetricMeta
  summary: string
  selected?: number[]
  onSelect?: (cod: number, multi: boolean) => void
  ufs?: number[]
  highlight?: number
  outline?: boolean
}) {
  const { sequential, highContrast } = useChartTheme()
  const motion = useMotion()
  const [neutral, setNeutral] = useState(false)
  useLayoutEffect(() => {
    if (!motion.animate) {
      setNeutral(false)
      return
    }
    setNeutral(true)
    const frame = requestAnimationFrame(() => setNeutral(false))
    return () => cancelAnimationFrame(frame)
  }, [motion.animate, motion.groupId])
  const host = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: WIDTH, h: HEIGHT })
  const [mesh, setMesh] = useState<Mesh | null>(null)
  const [tip, setTip] = useState<{ name: string; value: string; color: string; x: number; y: number } | null>(null)
  const byCod = useMemo(() => new Map(items.map((item) => [item.cod, item])), [items])
  const edges = useMemo(
    () => {
      const values = items.map((item) => item.valor).filter((value): value is number => value != null)
      return highContrast ? quantizeBreaks(values) : quantileBreaks(values)
    },
    [highContrast, items],
  )
  const scoped = useMemo(() => {
    if (!mesh) return null
    if (!ufs) return mesh
    const allow = new Set(ufs)
    return { ...mesh, features: mesh.features.filter((feature) => allow.has(feature.properties.cod)) }
  }, [mesh, ufs])
  const paths = useMemo(() => {
    if (!scoped) return []
    const projection = geoMercator() as ReturnType<typeof geoMercator> & {
      fitSize(size: [number, number], object: GeoPermissibleObjects): void
    }
    projection.fitSize([Math.max(size.w, 1), Math.max(size.h, 1)], scoped as unknown as GeoPermissibleObjects)
    const path = geoPath(projection)
    return scoped.features.map((feature) => {
      const object = feature as unknown as GeoPermissibleObjects
      return {
        cod: feature.properties.cod,
        sigla: feature.properties.sigla,
        d: path(object) ?? "",
      }
    })
  }, [scoped, size.h, size.w])

  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setSize({ w: Math.max(1, Math.floor(box.width)), h: Math.max(1, Math.floor(box.height)) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    fetch("/geo/br-uf.json")
      .then((response) => response.json())
      .then((data: Mesh) => {
        if (active) setMesh(data)
      })
      .catch(() => {
        if (active) setMesh(null)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div role="img" aria-label={summary} className="flex h-full min-h-0 flex-col gap-3">
      <div ref={host} className="min-h-0 flex-1">
      <svg
        viewBox={`0 0 ${Math.max(size.w, 1)} ${Math.max(size.h, 1)}`}
        className="h-full w-full"
        data-anim={motion.animate ? "map" : undefined}
        style={motion.animate ? motionVars(motion) : undefined}
      >
        {paths.map((shape) => {
          const item = byCod.get(shape.cod)
          const value = item?.valor
          const chosen = highlight != null ? [highlight] : selected
          const state = chosen.length === 0 ? "normal" : chosen.includes(shape.cod) ? "selecionado" : "contexto"
          const paint = mapPaint(state)
          const painted = value == null ? "hsl(var(--muted))" : sequential[classOf(value, edges)] || "hsl(var(--chart-seq-3))"
          const fill = outline || state === "contexto" ? "transparent" : neutral ? "hsl(var(--muted))" : painted
          const label = item ? `${item.local}: ${formatValue(item.valor, metric)}` : shape.sigla
          const shared = {
            d: shape.d,
            tabIndex: 0,
            role: "button" as const,
            "aria-label": label,
            fill,
            stroke: paint.stroke,
            strokeWidth: paint.strokeWidth,
            onClick: (event: MouseEvent<SVGPathElement>) => onSelect?.(shape.cod, event.ctrlKey || event.metaKey),
            onPointerMove: (event: MouseEvent<SVGPathElement>) => setTip({
              name: item?.local ?? shape.sigla,
              value: item ? formatValue(item.valor, metric) : "—",
              color: painted,
              x: event.clientX,
              y: event.clientY,
            }),
            onPointerLeave: () => setTip(null),
            onKeyDown: (event: KeyboardEvent<SVGPathElement>) => {
              if (event.key === "Enter") onSelect?.(shape.cod, false)
            },
          }
          return (
            <path
              key={shape.cod}
              {...shared}
              data-allow-motion={motion.animate ? "fill" : undefined}
              style={motion.animate ? { transitionDuration: `${motion.durationMs}ms` } : undefined}
              fillOpacity={paint.fillOpacity}
            />
          )
        })}
      </svg>
      </div>
      <HeldTip open={tip != null} x={tip?.x ?? 0} y={tip?.y ?? 0} title={tip?.name}>
        {tip ? <TipList rows={[{ key: metric.key, label: glossaryByKey(metric.key)?.rotuloTecnico ?? metric.key, value: tip.value, color: tip.color }]} /> : null}
      </HeldTip>
      <div className="grid grid-cols-5 gap-1 text-[11px] text-muted-foreground">
        {sequential.map((color, index) => (
          <div key={color || index} className="grid gap-1">
            <span className="h-2" style={{ background: color || `hsl(var(--chart-seq-${index + 1}))` }} />
            <span>{classLabel(index, edges, (value) => formatValue(value, metric))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
