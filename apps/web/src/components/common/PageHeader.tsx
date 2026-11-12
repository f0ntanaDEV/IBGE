import { type ReactNode, useEffect } from "react"
import { CharFade } from "@/motion/WordReveal"

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
        <CharFade as="h1" className="text-xl font-medium" text={title} />
        {lead ? <CharFade as="p" className="lead mt-1 text-lg text-foreground" text={lead} /> : null}
        {meta ? <div className="meta mt-1 text-sm text-muted-foreground">{meta}</div> : null}
        {audience ? <CharFade as="p" className="mt-1 text-xs text-muted-foreground" text={`Para: ${audience}`} /> : null}
        {description ? <CharFade as="p" className="mt-1 text-sm text-muted-foreground" text={description} /> : null}
      </div>
      {actions}
    </header>
  )
}
