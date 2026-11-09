import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { INSIGHTS, PATTERNS } from "@/content/insights"

export function InsightsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Insights"
        description="Valores das Projeções da População, Revisão 2024; ano de referência 2026."
      />
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
      {INSIGHTS.map((section) => (
        <section key={section.pageId} id={section.pageId} className="page-stack">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium">{section.title}</h2>
            <Link to={section.route} className="text-sm underline">
              Ir para a página
            </Link>
          </div>
          {section.items.map((item) => (
            <article key={item.q} className="max-w-[72ch]">
              <h3 className="text-base font-medium">{item.q}</h3>
              {item.a.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} data-insight-answer className="mt-2 max-w-[72ch] text-sm leading-6">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </section>
      ))}
      <section id="padroes" className="page-stack" aria-label="Padrões dos dados">
        <h2 className="text-lg font-medium">Padrões dos dados</h2>
        {PATTERNS.map((item) => (
          <article key={item.title} className="max-w-[72ch]">
            <h3 className="text-base font-medium">{item.title}</h3>
            <p className="mt-2 text-sm leading-6">{item.text}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
