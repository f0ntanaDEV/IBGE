import { type ReactNode, useEffect } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  lead?: string
  meta?: ReactNode
  audience?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, lead, meta, audience, actions }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} · Projeções IBGE`
  }, [title])

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-medium">{title}</h1>
        {lead ? <p className="lead mt-1 text-lg text-foreground">{lead}</p> : null}
        {meta ? <div className="meta mt-1 text-sm text-muted-foreground">{meta}</div> : null}
        {audience ? <p className="mt-1 text-xs text-muted-foreground">Para: {audience}</p> : null}
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </header>
  )
}
