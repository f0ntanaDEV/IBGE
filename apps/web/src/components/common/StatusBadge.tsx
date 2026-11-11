import { CircleAlert, CircleCheck, CircleX } from "lucide-react"
import { STATUS_LABEL, type Status } from "@/content/kpi-rules"

const ICON = { good: CircleCheck, warn: CircleAlert, bad: CircleX }

export function StatusBadge({ status }: { status: Status }) {
  const Icon = ICON[status]
  return (
    <span data-status={status} className={`inline-flex items-center gap-1 text-xs text-[hsl(var(--status-${status}))]`}>
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}
