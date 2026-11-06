import { type ComponentProps, type ReactElement, type ReactNode, createContext, useContext, useMemo } from "react"
import * as RechartsPrimitive from "recharts"
import { chartDefaults } from "@/lib/chartDefaults"
import { formatLoose } from "@/lib/format"
import { cn } from "@/lib/cn"

export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>

type ChartContextValue = { config: ChartConfig; isAnimationActive: boolean }

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
  const style = useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [key, item] of Object.entries(config)) {
      if (item.color) vars[`--color-${key}`] = item.color
    }
    return vars
  }, [config])

  return (
    <ChartContext.Provider value={{ config, isAnimationActive: chartDefaults.isAnimationActive }}>
      <div data-chart={id} className={cn("flex h-full min-h-0 w-full justify-center text-xs", className)} style={style}>
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
      animationDuration={chartDefaults.animationDuration}
      isAnimationActive={chartDefaults.isAnimationActive}
      allowEscapeViewBox={{ x: false, y: false }}
      wrapperStyle={{ maxWidth: 240, ...wrapperStyle }}
    />
  )
}
export const ChartLegend = RechartsPrimitive.Legend

type TooltipItem = { color?: string; name?: string; value?: number | string; dataKey?: string | number }

export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  formatter?: (value: number, key: string) => string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return (
    <div className="grid gap-1 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
      {label != null ? <div className="font-medium">{label}</div> : null}
      <ul className="grid gap-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "")
          const value =
            typeof item.value === "number" ? (formatter ? formatter(item.value, key) : formatLoose(item.value)) : item.value
          return (
            <li key={key} className="flex items-center gap-2">
              <span className="size-2 rounded-sm" style={{ background: item.color ?? config[key]?.color }} aria-hidden />
              <span>{config[key]?.label ?? item.name ?? key}</span>
              <span className="ml-auto tabular-nums">{value}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
