import { CountUp } from "@/motion/CountUp"
import { Reveal } from "@/motion/useMotion"
import { buildHeadline, type HeadlineInput } from "@/lib/narratives/headline"

export function Headline({ pageId, input }: { pageId: string; input: HeadlineInput }) {
  const segments = buildHeadline(pageId, input).filter((segment) => segment.text)
  if (!segments.length) return null
  return (
    <Reveal>
      <p data-headline className="text-xl leading-snug text-foreground">
        {segments.map((segment, index) =>
          segment.strong ? (
            <strong key={index} className="font-bold tabular-nums">
              {segment.value != null && segment.metric ? (
                <CountUp value={segment.value} metric={segment.metric} compact={segment.compact} className="font-bold tabular-nums" />
              ) : (
                segment.text
              )}
            </strong>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
    </Reveal>
  )
}
