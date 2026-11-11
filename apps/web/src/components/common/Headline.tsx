import { buildHeadline, type HeadlineInput } from "@/lib/narratives/headline"

export function Headline({ pageId, input }: { pageId: string; input: HeadlineInput }) {
  const segments = buildHeadline(pageId, input).filter((segment) => segment.text)
  if (!segments.length) return null
  return (
    <p data-headline className="text-lg text-foreground">
      {segments.map((segment, index) =>
        segment.strong ? (
          <strong key={index} className="text-3xl font-semibold tabular-nums">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  )
}
