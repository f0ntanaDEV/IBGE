import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { MOTION, type MotionGroup } from "@/motion/tokens"
import { useMotionApi } from "@/motion/MotionProvider"

const GroupContext = createContext<MotionGroup | null>(null)

export type MotionSnapshot = {
  animate: boolean
  delayMs: number
  durationMs: number
  groupId: string | null
  start: number
}

const IDLE: MotionSnapshot = { animate: false, delayMs: 0, durationMs: 0, groupId: null, start: 0 }

export function useMotion(): MotionSnapshot {
  const { enabled, page, update } = useMotionApi()
  const local = useContext(GroupContext)
  if (!enabled) return IDLE
  const now = performance.now()
  const updateLive = update != null && now < update.start + update.duration + 32
  const group = updateLive ? update : (local ?? page)
  if (!group || group.duration <= 0) return IDLE
  if (now >= group.start + group.duration) {
    return { animate: false, delayMs: 0, durationMs: group.duration, groupId: group.id, start: group.start }
  }
  return {
    animate: true,
    delayMs: Math.max(0, group.start - now),
    durationMs: group.duration,
    groupId: group.id,
    start: group.start,
  }
}

export function motionVars(motion: MotionSnapshot) {
  return {
    "--anim-duration": `${motion.durationMs}ms`,
    "--anim-delay": `${motion.delayMs}ms`,
    "--anim-ease": MOTION.ease,
  } as Record<string, string>
}

function liveGroup(group: MotionGroup): MotionGroup {
  const now = performance.now()
  if (now <= group.start + group.duration) return group
  return { id: `${group.id}-replay`, start: now, duration: MOTION.page }
}

export function Reveal({ children, className, fade = true }: { children: ReactNode; className?: string; fade?: boolean }) {
  const { enabled, page, observe, generation } = useMotionApi()
  const ref = useRef<HTMLDivElement>(null)
  const seen = useRef(false)
  const [group, setGroup] = useState<MotionGroup | null>(null)
  const [phase, setPhase] = useState<"off" | "pending" | "run" | "done">("off")

  useLayoutEffect(() => {
    seen.current = false
    setGroup(null)
    setPhase(enabled ? "pending" : "off")
  }, [enabled, generation])

  useLayoutEffect(() => {
    if (!enabled || !page || seen.current) return
    const node = ref.current
    if (!node) return
    const box = node.getBoundingClientRect()
    const visible = box.width > 0 && box.bottom > 0 && box.top < window.innerHeight
    const play = (next: MotionGroup) => {
      seen.current = true
      if (!fade || next.duration <= 0) {
        setGroup(null)
        setPhase("done")
        return
      }
      setGroup(liveGroup(next))
      setPhase("run")
    }
    if (visible) {
      play(page)
      return
    }
    if (fade) setPhase("pending")
    return observe(node, (next) => play(next))
  }, [enabled, fade, generation, observe, page])

  useEffect(() => {
    if (phase !== "run" || !group) return
    const left = group.start + group.duration - performance.now()
    const timer = window.setTimeout(() => setPhase("done"), Math.max(0, left) + 80)
    return () => window.clearTimeout(timer)
  }, [group, phase])

  const run = phase === "run" && group
  const pending = phase === "pending"
  const style = run ? motionVars({ animate: true, delayMs: Math.max(0, group.start - performance.now()), durationMs: group.duration, groupId: group.id, start: group.start }) : undefined

  return (
    <GroupContext.Provider value={group}>
      <div
        ref={ref}
        className={enabled ? className : "contents"}
        data-anim={pending || run ? "reveal" : undefined}
        data-anim-state={pending ? "pending" : run ? "run" : undefined}
        style={style}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}

export function useMotionClock(active: boolean) {
  const motion = useMotion()
  const [live, setLive] = useState(false)
  useLayoutEffect(() => {
    if (!active || !motion.animate) {
      setLive(false)
      return
    }
    setLive(true)
    const timer = window.setTimeout(() => setLive(false), motion.delayMs + motion.durationMs + 80)
    return () => window.clearTimeout(timer)
  }, [active, motion.animate, motion.delayMs, motion.durationMs, motion.groupId])
  return { motion, live }
}
