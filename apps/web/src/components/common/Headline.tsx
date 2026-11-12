import { CountUp } from "@/motion/CountUp"
import { Reveal } from "@/motion/useMotion"
import { CharFade, WordReveal } from "@/motion/WordReveal"
import { useMode } from "@/stores/preferences"
import { buildHeadline, type HeadlineInput } from "@/lib/narratives/headline"

export function Headline({ pageId, input }: { pageId: string; input: HeadlineInput }) {
  const mode = useMode()
  const segments = buildHeadline(pageId, input).filter((segment) => segment.text)
  if (!segments.length) return null
  const text = segments.map((segment) => segment.text).join("")
  return (
    <Reveal>
      {mode === "simple" ? (
        <p data-headline className="text-xl leading-snug text-foreground">
          <WordReveal as="span" text={text} />
        </p>
      ) : (
        <p data-headline className="text-xl leading-snug text-foreground">
          {segments.map((segment, index) =>
            segment.strong ? (
              <strong key={index} className="font-bold tabular-nums">
                {segment.value != null && segment.metric ? (
                  <CountUp value={segment.value} metric={segment.metric} compact={segment.compact} className="font-bold tabular-nums" />
                ) : (
                  <CharFade text={segment.text} />
                )}
              </strong>
            ) : (
              <CharFade key={index} text={segment.text} />
            ),
          )}
        </p>
      )}
    </Reveal>
  )
}
