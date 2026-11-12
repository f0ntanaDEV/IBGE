import { CircleAlert, CircleCheck, CircleX } from "lucide-react"
import { STATUS_LABEL, type Status } from "@/content/kpi-rules"

const ICON = { good: CircleCheck, warn: CircleAlert, bad: CircleX }

export function StatusBadge({ status, compact = false }: { status: Status; compact?: boolean }) {
  const Icon = ICON[status]
  return (
    <span data-status={status} className={`inline-flex items-center ${compact ? "" : "gap-1 text-xs"}`} style={{ color: `hsl(var(--status-${status}))` }} title={STATUS_LABEL[status]}>
      <Icon className={compact ? "size-4" : "size-3.5"} aria-hidden />
      {compact ? <span className="sr-only">{STATUS_LABEL[status]}</span> : STATUS_LABEL[status]}
    </span>
  )
}
