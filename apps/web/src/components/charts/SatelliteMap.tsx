import { useEffect, useRef, useState } from "react"
import { HeldTip, TipList } from "@/components/ui/chart"
import "maplibre-gl/dist/maplibre-gl.css"

type Geo = { type: "FeatureCollection"; features: { properties: { cod: number } }[] }

/** Imagem Esri sob as UFs. Três erros seguidos devolvem falha para o card voltar ao mapa. */
export function SatelliteMap({ selected, onSelect, onFail }: { geo?: Geo; selected: number[]; onSelect?: (cod: number) => void; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState(true)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  useEffect(() => {
    const node = host.current
    if (!node) return
    let map: { remove: () => void } | null = null
    let errors = 0
    let cancel = false
    void Promise.all([import("maplibre-gl"), fetch("/geo/br-uf.json").then((response) => response.json())]).then(([lib, geo]) => {
      if (cancel) return
      const created = new lib.Map({
        container: node,
        center: [-52, -14],
        zoom: 3.2,
        minZoom: 3,
        maxZoom: 8,
        attributionControl: { compact: false },
        style: {
          version: 8,
          sources: {
            sat: {
              type: "raster",
              tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
              tileSize: 256,
              attribution: "Esri, Maxar, Earthstar Geographics",
            },
          },
          layers: [{ id: "sat", type: "raster", source: "sat" }],
        },
      })
      map = created
      created.on("load", () => {
        created.addSource("uf", { type: "geojson", data: geo })
        created.addLayer({
          id: "uf-fill",
          type: "fill",
          source: "uf",
          paint: {
            "fill-color": "#94a3b8",
            "fill-opacity": ["case", ["in", ["get", "cod"], ["literal", selected]], 0.85, 0.35],
          },
        })
        created.addLayer({ id: "uf-line", type: "line", source: "uf", paint: { "line-color": "#0f172a", "line-width": 1 } })
      })
      created.on("click", "uf-fill", (event: { features?: { properties?: { cod?: number } }[] }) => {
        const cod = event.features?.[0]?.properties?.cod
        if (cod != null) onSelect?.(cod)
      })
      created.on("mousemove", "uf-fill", (event: { features?: { properties?: { sigla?: string; cod?: number } }[]; originalEvent?: { clientX: number; clientY: number } }) => {
        const props = event.features?.[0]?.properties
        const text = props?.sigla ?? (props?.cod != null ? String(props.cod) : "")
        if (!text || !event.originalEvent) return
        setTip({ text, x: event.originalEvent.clientX, y: event.originalEvent.clientY })
      })
      created.on("mouseleave", "uf-fill", () => setTip(null))
      created.on("error", () => {
        errors += 1
        if (errors >= 3) {
          setNote(false)
          onFail()
        }
      })
    })
    return () => {
      cancel = true
      map?.remove()
    }
  }, [onFail, onSelect, selected])
  return (
    <div className="relative h-full min-h-48">
      <div ref={host} className="h-full min-h-48" />
      {note ? <p className="pointer-events-none absolute bottom-1 left-1 text-[10px]">Esri, Maxar, Earthstar Geographics</p> : null}
      <HeldTip open={tip != null} x={tip?.x ?? 0} y={tip?.y ?? 0} title={tip?.text}>
        {tip ? <TipList rows={[{ key: "uf", label: "Território", value: tip.text, color: "hsl(var(--chart-1))" }]} /> : null}
      </HeldTip>
    </div>
  )
}
