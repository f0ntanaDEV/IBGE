import { type ComponentProps, type ReactElement, type ReactNode, type RefObject, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import * as RechartsPrimitive from "recharts"
import { chartDefaults } from "@/lib/chartDefaults"
import { formatLoose } from "@/lib/format"
import { cn } from "@/lib/cn"

export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>

type ChartContextValue = { config: ChartConfig; isAnimationActive: boolean; containerRef: RefObject<HTMLDivElement | null> }

const ChartContext = createContext<ChartContextValue | null>(null)

export function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("useChart deve ficar dentro de ChartContainer")
  return context
}

export function ChartContainer({
  id,
  className,
  config,
  children,
}: {
  id?: string
  className?: string
  config: ChartConfig
  children: ReactElement
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const style = useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [key, item] of Object.entries(config)) {
      if (item.color) vars[`--color-${key}`] = item.color
    }
    return vars
  }, [config])

  return (
    <ChartContext.Provider value={{ config, isAnimationActive: chartDefaults.isAnimationActive, containerRef }}>
      <div ref={containerRef} data-chart={id} className={cn("flex h-full min-h-0 w-full justify-center text-xs", className)} style={style}>
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export function ChartTooltip({ wrapperStyle, ...props }: ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return (
    <RechartsPrimitive.Tooltip
      {...props}
      trigger="hover"
      cursor={props.cursor ?? { stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.35 }}
      animationDuration={chartDefaults.animationDuration}
      isAnimationActive={chartDefaults.isAnimationActive}
      allowEscapeViewBox={{ x: true, y: true }}
      contentStyle={{ background: "transparent", border: "none", padding: 0, boxShadow: "none" }}
      wrapperStyle={{ zIndex: 50, pointerEvents: "none", maxWidth: "20rem", ...wrapperStyle }}
    />
  )
}

const TIP_GAP = 8

function placeTip(x: number, y: number, width: number, height: number) {
  let left = x + TIP_GAP
  let top = y + TIP_GAP
  if (left + width > window.innerWidth - TIP_GAP) left = Math.max(TIP_GAP, x - width - TIP_GAP)
  if (top + height > window.innerHeight - TIP_GAP) top = Math.max(TIP_GAP, y - height - TIP_GAP)
  return { left, top }
}

/** Painel com as mesmas classes do popover das KPIs, ao lado do ponto. */
export function HoverTip({
  title,
  children,
  x,
  y,
  onEnter,
  onLeave,
}: {
  title?: ReactNode
  children: ReactNode
  x?: number
  y?: number
  onEnter?: () => void
  onLeave?: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState({ left: (x ?? 0) + TIP_GAP, top: (y ?? 0) + TIP_GAP })
  useLayoutEffect(() => {
    const node = panelRef.current
    if (!node || x == null) return
    const box = node.getBoundingClientRect()
    setSpot(placeTip(x, y ?? 0, box.width, box.height))
  }, [x, y, title, children])
  const panel = (
    <div
      ref={panelRef}
      className="z-50 max-h-80 w-max max-w-xs overflow-auto rounded-md border border-border bg-popover p-3 text-sm text-popover-foreground shadow-sm outline-none"
      style={x == null ? undefined : { position: "fixed", left: spot.left, top: spot.top }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {title ? <p className="mb-2 text-sm font-medium">{title}</p> : null}
      {children}
    </div>
  )
  if (x == null || typeof document === "undefined") return panel
  return createPortal(panel, document.body)
}

/** Mantém o painel aberto enquanto o ponteiro está sobre ele. */
export function HeldTip({
  open,
  x,
  y,
  title,
  children,
}: {
  open: boolean
  x: number
  y: number
  title?: ReactNode
  children: ReactNode
}) {
  const over = useRef(false)
  const last = useRef({ x, y, title, children })
  const [held, setHeld] = useState(open)
  if (open) last.current = { x, y, title, children }
  useEffect(() => {
    if (open) {
      setHeld(true)
      return
    }
    const id = window.setTimeout(() => {
      if (!over.current) setHeld(false)
    }, 160)
    return () => window.clearTimeout(id)
  }, [open])
  if (!held) return null
  const view = open ? { x, y, title, children } : last.current
  return (
    <HoverTip
      title={view.title}
      x={view.x}
      y={view.y}
      onEnter={() => {
        over.current = true
      }}
      onLeave={() => {
        over.current = false
        if (!open) setHeld(false)
      }}
    >
      {view.children}
    </HoverTip>
  )
}
export const ChartLegend = RechartsPrimitive.Legend

export function TipList({ rows }: { rows: { key: string; label: ReactNode; value: ReactNode; color?: string; suffix?: string }[] }) {
  return (
    <ul className="grid gap-1">
      {rows.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          {item.color ? <span className="size-2 shrink-0 rounded-sm" style={{ background: item.color }} aria-hidden /> : null}
          <span>{item.label}</span>
          <span className="ml-auto tabular-nums">
            {item.value}
            {item.suffix ?? ""}
          </span>
        </li>
      ))}
    </ul>
  )
}

type TooltipItem = { color?: string; name?: string; value?: number | string | null; dataKey?: string | number }

function baseKey(key: string) {
  return key.replace(/_(obs|proj|dash|solid)$/i, "").replace(/:(observado|projetado)$/i, "")
}

export function dedupeTooltip(payload: TooltipItem[], label?: string | number) {
  const year = Number(label)
  const projected = Number.isFinite(year) && year > new Date().getFullYear()
  const seen = new Map<string, TooltipItem>()
  for (const item of payload) {
    const name = String(item.name ?? "")
    if (/projeção|covid|reposição|zona/i.test(name)) continue
    const key = baseKey(String(item.dataKey ?? name))
    if (!key || key === "banda" || key === "bandaBase") continue
    const current = seen.get(key)
    if (!current || current.value == null || current.value === "") seen.set(key, item)
  }
  return [...seen.entries()].map(([key, item]) => ({ ...item, dataKey: key, projected }))
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  footer,
  coordinate,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  formatter?: (value: number, key: string) => string
  footer?: ReactNode
  coordinate?: { x?: number; y?: number }
}) {
  const { config, containerRef } = useChart()
  const pointer = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const move = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    node.addEventListener("pointermove", move)
    return () => node.removeEventListener("pointermove", move)
  }, [containerRef])
  const rows = dedupeTooltip(payload ?? [], label)
  const box = containerRef.current?.querySelector(".recharts-wrapper")?.getBoundingClientRect()
  const x = box && coordinate?.x != null ? box.left + coordinate.x : pointer.current?.x
  const y = box && coordinate?.y != null ? box.top + coordinate.y : pointer.current?.y
  const live = Boolean(active && rows.length && x != null && y != null)
  return (
    <HeldTip open={live} x={x ?? 0} y={y ?? 0} title={label}>
      <TipList
        rows={rows.map((item) => {
          const key = String(item.dataKey ?? "")
          const numeric = typeof item.value === "number" ? item.value : Number(item.value)
          const printed = Number.isFinite(numeric) ? (formatter ? formatter(numeric, key) : formatLoose(numeric)) : item.value
          return {
            key,
            label: config[key]?.label ?? item.name ?? key,
            value: printed,
            color: item.color ?? config[key]?.color,
            suffix: item.projected ? " (projeção)" : "",
          }
        })}
      />
      {footer}
    </HeldTip>
  )
}
