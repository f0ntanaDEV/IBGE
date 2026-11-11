import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { markWordDone, shownPartsAt, splitWords, wordDone } from "@/motion/words"
import { useMotion } from "@/motion/useMotion"
import { useMotionApi } from "@/motion/MotionProvider"
import { MOTION } from "@/motion/tokens"
import { useMode } from "@/stores/preferences"

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

export function WordReveal({
  text,
  className,
  as: Tag = "p",
}: {
  text: string
  className?: string
  as?: "p" | "span"
}) {
  const mode = useMode()
  const { enabled } = useMotionApi()
  const motion = useMotion()
  const control = useWordRevealControl()
  const parts = useMemo(() => splitWords(text), [text])
  const play = mode === "simple" && enabled && motion.animate && !wordDone(text)
  const [shown, setShown] = useState(parts.length)

  const finish = () => {
    markWordDone(text)
    setShown(parts.length)
  }

  useLayoutEffect(() => {
    if (!play) {
      setShown(parts.length)
      return
    }
    const elapsed = () => performance.now() - motion.start
    setShown(shownPartsAt(elapsed(), parts))
    const timer = window.setInterval(() => {
      const next = shownPartsAt(elapsed(), parts)
      setShown(next)
      if (next >= parts.length) {
        markWordDone(text)
        window.clearInterval(timer)
      }
    }, MOTION.word)
    return () => window.clearInterval(timer)
  }, [motion.groupId, motion.start, parts, play, text])

  useEffect(() => control.register(finish), [control, text])

  if (!(mode === "simple" && enabled && motion.animate)) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag className={className} onClick={finish}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {parts.map((part, index) => (
          <span key={`${index}-${part}`} style={{ opacity: index < shown ? 1 : 0 }}>
            {part}
          </span>
        ))}
      </span>
    </Tag>
  )
}
