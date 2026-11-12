import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { markWordDone, wordDone } from "@/motion/words"
import { useMotion } from "@/motion/useMotion"
import { useMotionApi } from "@/motion/MotionProvider"

type Control = {
  register: (finish: () => void) => () => void
  finishAll: () => void
}

const WordContext = createContext<Control>({
  register: () => () => undefined,
  finishAll: () => undefined,
})

export function useWordRevealControl() {
  return useContext(WordContext)
}

export function WordRevealControl({ children }: { children: ReactNode }) {
  const finishes = useRef(new Set<() => void>())
  const control = useMemo<Control>(
    () => ({
      register(finish) {
        finishes.current.add(finish)
        return () => finishes.current.delete(finish)
      },
      finishAll() {
        finishes.current.forEach((finish) => finish())
      },
    }),
    [],
  )
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") control.finishAll()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [control])
  return <WordContext.Provider value={control}>{children}</WordContext.Provider>
}

export function CharFade({
  text,
  className,
  as: Tag = "span",
  onClick,
  id,
  insight = false,
}: {
  text: string
  className?: string
  as?: "p" | "span" | "h1" | "h2" | "h3"
  onClick?: () => void
  id?: string
  insight?: boolean
}) {
  const { enabled } = useMotionApi()
  const motion = useMotion()
  const chars = useMemo(() => Array.from(text), [text])
  const mark = insight ? { "data-insight-answer": "" } : undefined
  if (!enabled || !motion.animate || !text) {
    return (
      <Tag id={id} className={className} onClick={onClick} {...mark}>
        {text}
      </Tag>
    )
  }
  return (
    <Tag id={id} className={className} onClick={onClick} {...mark}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {chars.map((char, index) => (
          <span key={`${index}-${char}`} data-anim="char" style={{ animationDelay: `${Math.min(index, 40) * 16}ms` }}>
            {char}
          </span>
        ))}
      </span>
    </Tag>
  )
}

export function WordReveal({
  text,
  className,
  as: Tag = "p",
}: {
  text: string
  className?: string
  as?: "p" | "span"
}) {
  const { enabled, generation } = useMotionApi()
  const motion = useMotion()
  const control = useWordRevealControl()
  const [finished, setFinished] = useState(false)

  const finish = () => {
    markWordDone(text)
    setFinished(true)
  }

  useLayoutEffect(() => {
    setFinished(false)
  }, [generation, text])

  useEffect(() => control.register(finish), [control, text])

  const play = enabled && motion.animate && !finished && !wordDone(text)
  if (!play) return <Tag className={className}>{text}</Tag>
  return <CharFade as={Tag} className={className} text={text} onClick={finish} />
}
