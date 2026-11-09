import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { useChartTheme } from "@/hooks/useChartTheme"
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

export function BrazilMap({
  items,
  metric,
  summary,
  selected = [],
  onSelect,
}: {
  items: BrazilMapItem[]
  metric: MetricMeta
  summary: string
  selected?: number[]
  onSelect?: (cod: number, multi: boolean) => void
}) {
  const { sequential, highContrast } = useChartTheme()
  const host = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: WIDTH, h: HEIGHT })
  const [mesh, setMesh] = useState<Mesh | null>(null)
  const byCod = useMemo(() => new Map(items.map((item) => [item.cod, item])), [items])
  const edges = useMemo(
    () => {
      const values = items.map((item) => item.valor).filter((value): value is number => value != null)
      return highContrast ? quantizeBreaks(values) : quantileBreaks(values)
    },
    [highContrast, items],
  )
  const paths = useMemo(() => {
    if (!mesh) return []
    const projection = geoMercator() as ReturnType<typeof geoMercator> & {
      fitSize(size: [number, number], object: GeoPermissibleObjects): void
    }
    projection.fitSize([Math.max(size.w, 1), Math.max(size.h, 1)], mesh as unknown as GeoPermissibleObjects)
    const path = geoPath(projection)
    return mesh.features.map((feature) => {
      const object = feature as unknown as GeoPermissibleObjects
      return {
        cod: feature.properties.cod,
        sigla: feature.properties.sigla,
        d: path(object) ?? "",
      }
    })
  }, [mesh, size.h, size.w])

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
      <svg viewBox={`0 0 ${Math.max(size.w, 1)} ${Math.max(size.h, 1)}`} className="h-full w-full">
        {paths.map((shape) => {
          const item = byCod.get(shape.cod)
          const value = item?.valor
          const faded = selected.length > 0 && !selected.includes(shape.cod)
          const fill = value == null ? "hsl(var(--muted))" : sequential[classOf(value, edges)] || "hsl(var(--chart-seq-3))"
          const label = item ? `${item.local}: ${formatValue(item.valor, metric)}` : shape.sigla
          const shared = {
            d: shape.d,
            tabIndex: 0,
            role: "button" as const,
            "aria-label": label,
            fill,
            stroke: "hsl(var(--background))",
            strokeWidth: 0.6,
            onClick: (event: MouseEvent<SVGPathElement>) => onSelect?.(shape.cod, event.ctrlKey || event.metaKey),
            onKeyDown: (event: KeyboardEvent<SVGPathElement>) => {
              if (event.key === "Enter") onSelect?.(shape.cod, false)
            },
          }
          return <path key={shape.cod} {...shared} fillOpacity={faded ? 0.35 : 1} />
        })}
      </svg>
      </div>
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
