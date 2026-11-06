import { formatDate } from "@/lib/format"

type NewsCardProps = {
  title: string
  summary: string
  date: string | Date
  url: string
  image?: string
  relatedMetric?: string
}

export function NewsCard({ title, summary, date, url, image, relatedMetric }: NewsCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      {image ? <img src={image} alt="" className="mb-3 h-32 w-full rounded-md object-cover" /> : null}
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        <time dateTime={typeof date === "string" ? date : date.toISOString()}>{formatDate(date)}</time>
      </p>
      {relatedMetric ? <p className="mt-2 text-xs">{relatedMetric}</p> : null}
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm underline" aria-label={`${title} (abre em nova aba)`}>
        Ler notícia
      </a>
    </article>
  )
}
