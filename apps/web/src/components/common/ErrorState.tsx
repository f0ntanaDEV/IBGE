import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  action?: ReactNode
}

export function ErrorState({ title = "Algo deu errado", message, onRetry, action }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
      {action}
    </div>
  )
}
