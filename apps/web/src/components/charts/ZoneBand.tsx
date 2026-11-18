import { ReferenceArea } from "recharts"
import type { Zone } from "@/lib/zones"

const FILL = { good: "hsl(var(--status-good))", warn: "hsl(var(--status-warn))", bad: "hsl(var(--status-bad))" }

export function zoneColor(status: Zone["status"]) {
  return FILL[status]
}

/** Faixa de alerta pintada com a cor do status, em opacidade baixa. */
export function ZoneBand({ zone, y1, y2 }: { zone: Zone; y1: number; y2: number }) {
  return (
    <ReferenceArea
      y1={y1}
      y2={y2}
      ifOverflow="hidden"
      shape={(props: { x?: number; y?: number; width?: number; height?: number }) => (
        <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={FILL[zone.status]} fillOpacity={0.16} />
      )}
      label={{ value: zone.label, position: "insideTopRight", fontSize: 11, fill: FILL[zone.status] }}
    />
  )
}
