import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { logGroup, motionDebug } from "@/motion/debug"
import { resetCountMemory } from "@/motion/count"
import { MOTION, motionEmergency, type MotionGroup } from "@/motion/tokens"
import { resetWordMemory } from "@/motion/words"
import { usePreferences } from "@/stores/preferences"

type Api = {
  enabled: boolean
  emergency: boolean
  generation: number
  page: MotionGroup | null
  update: MotionGroup | null
  reportReady: (ready: boolean) => void
  bumpUpdate: () => void
  observe: (node: Element, onEnter: (group: MotionGroup) => void) => () => void
}

const MotionApiContext = createContext<Api>({
  enabled: false,
  emergency: motionEmergency(),
  generation: 0,
  page: null,
  update: null,
  reportReady: () => undefined,
  bumpUpdate: () => undefined,
  observe: () => () => undefined,
})

export function useMotionApi() {
  return useContext(MotionApiContext)
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const preference = usePreferences((state) => state.motion)
  const emergency = motionEmergency()
  const enabled = !emergency && preference === "on" && pathname !== "/configuracoes"
  const [page, setPage] = useState<MotionGroup | null>(null)
  const [update, setUpdate] = useState<MotionGroup | null>(null)
  const [generation, setGeneration] = useState(0)
  const readyRef = useRef(false)
  const armed = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const callbacks = useRef(new Map<Element, (group: MotionGroup) => void>())
  const updateCount = useRef(0)

  const armPage = () => {
    if (!enabled || armed.current) return
    armed.current = true
    const group: MotionGroup = { id: "page", start: performance.now(), duration: MOTION.page }
    logGroup(group)
    setPage(group)
  }

  useLayoutEffect(() => {
    armed.current = false
    readyRef.current = false
    updateCount.current = 0
    setPage(null)
    setUpdate(null)
    resetCountMemory()
    resetWordMemory()
    observerRef.current?.disconnect()
    observerRef.current = null
    callbacks.current.clear()
    if (!enabled) return
    const timer = window.setTimeout(armPage, MOTION.readyTimeout)
    setGeneration((value) => value + 1)
    return () => window.clearTimeout(timer)
  }, [enabled, pathname])

  const api = useMemo<Api>(() => {
    return {
      enabled,
      emergency,
      generation,
      page,
      update,
      reportReady(ready: boolean) {
        readyRef.current = ready
        if (ready) armPage()
      },
      bumpUpdate() {
        if (!enabled) return
        updateCount.current += 1
        const group: MotionGroup = {
          id: `update-${updateCount.current}`,
          start: performance.now(),
          duration: MOTION.update,
        }
        logGroup(group)
        setUpdate(group)
      },
      observe(node, onEnter) {
        if (!enabled || typeof IntersectionObserver === "undefined") {
          onEnter({ id: "visible", start: performance.now(), duration: 0 })
          return () => undefined
        }
        if (!observerRef.current) {
          observerRef.current = new IntersectionObserver(
            (entries) => {
              const start = performance.now()
              const group: MotionGroup = { id: `reveal-${start}`, start, duration: MOTION.reveal }
              let used = false
              for (const entry of entries) {
                if (!entry.isIntersecting) continue
                const callback = callbacks.current.get(entry.target)
                if (!callback) continue
                if (!used) {
                  logGroup(group)
                  used = true
                }
                callback(group)
                observerRef.current?.unobserve(entry.target)
                callbacks.current.delete(entry.target)
              }
            },
            { threshold: 0.15 },
          )
          const debug = motionDebug()
          if (debug) debug.observers += 1
        }
        callbacks.current.set(node, onEnter)
        observerRef.current.observe(node)
        return () => {
          observerRef.current?.unobserve(node)
          callbacks.current.delete(node)
        }
      },
    }
  }, [emergency, enabled, generation, page, update])

  return <MotionApiContext.Provider value={api}>{children}</MotionApiContext.Provider>
}
