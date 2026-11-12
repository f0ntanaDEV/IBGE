import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { CharFade } from "@/motion/WordReveal"
import { Reveal } from "@/motion/useMotion"
import { INSIGHTS, PATTERNS } from "@/content/insights"
import { PAGE_COPY } from "@/content/pages"
import { cn } from "@/lib/cn"

export function InsightsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const first = `${INSIGHTS[0]?.pageId}-1`
  const [open, setOpen] = useState<string[]>(() => [first])

  useEffect(() => {
    const id = location.hash.replace("#", "")
    if (!id || id === "padroes") return
    setOpen((current) => (current.includes(id) ? current : [...current, id]))
    const node = document.getElementById(id)
    node?.scrollIntoView({ block: "center" })
    node?.focus()
  }, [location.hash])

  function toggle(id: string) {
    setOpen((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      const hash = next.includes(id) ? `#${id}` : ""
      navigate({ hash }, { replace: true })
      return next
    })
  }

  return (
    <div className="page-stack">
      <PageHeader title="Insights" description="Valores das Projeções da População, Revisão 2024; ano de referência 2026." />
      <nav aria-label="Perguntas centrais" className="grid gap-2 text-sm">
        {PAGE_COPY.map((item) => (
          <Link key={item.id} to={item.to} className="underline">
            {item.question}
          </Link>
        ))}
      </nav>
      <nav aria-label="Seções" className="flex flex-wrap gap-3 text-sm">
        {INSIGHTS.map((section) => (
          <a key={section.pageId} href={`#${section.pageId}`} className="underline">
            {section.title}
          </a>
        ))}
        <a href="#padroes" className="underline">
          Padrões dos dados
        </a>
      </nav>
      {INSIGHTS.map((section) => {
        const ids = section.items.map((_, index) => `${section.pageId}-${index + 1}`)
        return (
          <section key={section.pageId} id={section.pageId} className="page-stack">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{section.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">{section.items.length} perguntas</span>
                <button type="button" className="underline" onClick={() => setOpen((current) => [...new Set([...current, ...ids])])}>
                  Expandir todas
                </button>
                <button type="button" className="underline" onClick={() => setOpen((current) => current.filter((id) => !ids.includes(id)))}>
                  Recolher todas
                </button>
                <Link to={section.route} className="underline">
                  Ir para a página
                </Link>
              </div>
            </div>
            {section.items.map((item, index) => {
              const id = `${section.pageId}-${index + 1}`
              const expanded = open.includes(id)
              return (
                <Reveal key={item.q}>
                <article id={id} tabIndex={-1} className="rounded-lg border border-border hc:border-2">
                  <h3>
                  <button
                    type="button"
                    className="flex w-full items-start gap-4 px-5 py-4 text-left"
                    aria-expanded={expanded}
                    aria-controls={`${id}-panel`}
                    onClick={() => toggle(id)}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border text-sm tabular-nums">{index + 1}</span>
                    <span className="flex-1">
                      <CharFade className="block font-semibold leading-snug" text={item.q} />
                      <CharFade className="mt-1 block text-sm text-muted-foreground" text={`Por que esta pergunta importa: ${item.why}`} />
                    </span>
                    <ChevronDown className={cn("mt-1 size-4 shrink-0", expanded && "rotate-180")} aria-hidden />
                  </button>
                  </h3>
                  {expanded ? (
                    <div id={`${id}-panel`} className="px-5 pb-5 pl-16">
                      <div className="max-w-[72ch] space-y-3">
                        {item.a.map((paragraph) => (
                          <CharFade as="p" insight key={paragraph.slice(0, 24)} className="text-sm leading-6" text={paragraph} />
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.keyNumbers.map((chip, chipIndex) => (
                          <span key={`${chip.label}-${chipIndex}`} className="rounded-md border border-border px-2 py-1 text-xs">
                            {chip.label}: {chip.value}
                          </span>
                        ))}
                      </div>
                      <Link className="mt-4 inline-flex text-sm underline" to={`${item.route}?cod=0#chart-${item.chartId}`}>
                        Ver na página: {item.chartLabel}
                      </Link>
                    </div>
                  ) : null}
                </article>
                </Reveal>
              )
            })}
          </section>
        )
      })}
      <section id="padroes" className="page-stack" aria-label="Padrões dos dados">
        <h2 className="text-lg font-medium">Padrões dos dados</h2>
        {PATTERNS.map((item, index) => {
          const id = `padrao-${index + 1}`
          const expanded = open.includes(id)
          return (
            <Reveal key={item.title}>
            <article id={id} tabIndex={-1} className="rounded-lg border border-border hc:border-2">
              <button type="button" className="flex w-full items-start gap-4 px-5 py-4 text-left" aria-expanded={expanded} aria-controls={`${id}-panel`} onClick={() => toggle(id)}>
                <CharFade className="flex-1 font-semibold" text={item.title} />
                <ChevronDown className={cn("size-4", expanded && "rotate-180")} aria-hidden />
              </button>
              {expanded ? (
                <CharFade as="p" id={`${id}-panel`} className="max-w-[72ch] px-5 pb-5 text-sm leading-6" text={item.text} />
              ) : null}
            </article>
            </Reveal>
          )
        })}
      </section>
    </div>
  )
}
