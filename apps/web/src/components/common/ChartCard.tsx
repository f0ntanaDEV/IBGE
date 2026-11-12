import { toPng } from "html-to-image"
import { MotionBoundary } from "@/motion/MotionBoundary"
import { Reveal } from "@/motion/useMotion"
import { CharFade } from "@/motion/WordReveal"
import { Download } from "lucide-react"
import { type ReactNode, useRef } from "react"
import { ErrorState } from "@/components/common/ErrorState"
import { GlossaryPopover } from "@/features/glossary/GlossaryPopover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ChartCardProps = {
  title: string
  description?: string
  metricKey?: string
  chartId?: string
  actions?: ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  narrative?: string
  children?: ReactNode
  pinned?: boolean
}

export function ChartCard({ title, description, metricKey, chartId, actions, loading, error, onRetry, narrative, children, pinned = true }: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  async function exportPng() {
    const node = frameRef.current
    if (!node) return
    const backgroundColor = getComputedStyle(document.body).backgroundColor
    const url = await toPng(node, { backgroundColor })
    const link = document.createElement("a")
    link.href = url
    link.download = "grafico.png"
    link.click()
  }

  return (
    <Reveal className="h-full min-h-0">
    <MotionBoundary fallback={<div className="flex min-h-0 flex-1 flex-col">{children}</div>}>
    <Card
      ref={cardRef}
      id={chartId ? `chart-${chartId}` : undefined}
      data-chart-id={chartId}
      tabIndex={chartId ? -1 : undefined}
      className="flex h-[var(--card-h-chart)] min-h-48 flex-col overflow-hidden"
    >
      <CardHeader className="shrink-0 flex-row items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-1">
            <CardTitle>
              <CharFade text={title} />
            </CardTitle>
            {metricKey ? <GlossaryPopover metricKey={metricKey} cardRef={cardRef} /> : null}
          </div>
          {description ? (
            <CardDescription>
              <CharFade text={description} />
            </CardDescription>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {actions}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Exportar imagem"
                onClick={() => void exportPng()}
              >
                <Download className="size-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exportar imagem</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className={pinned ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "min-h-40 flex-1 overflow-y-auto"}>
        {loading ? (
          <Skeleton className="min-h-40 w-full flex-1" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : pinned ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div ref={frameRef} className="flex min-h-0 flex-1 flex-col">{children}</div>
            {narrative ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{narrative}</p> : null}
          </div>
        ) : (
          <div ref={frameRef}>
            {children}
            {narrative ? <p className="mt-2 text-sm text-muted-foreground">{narrative}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
    </MotionBoundary>
    </Reveal>
  )
}
