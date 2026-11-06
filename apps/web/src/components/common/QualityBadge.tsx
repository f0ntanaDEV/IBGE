import { AlertTriangle, Check, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const content = {
  consistent: { label: "Consistente", Icon: Check },
  minor: { label: "Divergência menor", Icon: Minus },
  relevant: { label: "Divergência relevante", Icon: AlertTriangle },
} as const

export function QualityBadge({ status }: { status: keyof typeof content }) {
  const item = content[status]
  return (
    <Badge>
      <item.Icon className="size-3" aria-hidden />
      {item.label}
    </Badge>
  )
}
