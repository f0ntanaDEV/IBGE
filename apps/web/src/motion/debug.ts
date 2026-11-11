import type { MotionGroup } from "@/motion/tokens"

export type MotionDebug = {
  observers: number
  groups: MotionGroup[]
  log: { id: string; start: number; duration: number }[]
}

declare global {
  interface Window {
    __motion?: MotionDebug
  }
}

export function motionDebugEnabled() {
  if (typeof window === "undefined") return false
  if (import.meta.env.MODE === "test") return true
  return new URLSearchParams(window.location.search).get("motion-debug") === "1"
}

export function motionDebug() {
  if (!motionDebugEnabled()) return null
  window.__motion ??= { observers: 0, groups: [], log: [] }
  return window.__motion
}

export function logGroup(group: MotionGroup) {
  const debug = motionDebug()
  if (!debug) return
  debug.groups.push(group)
  debug.log.push({ id: group.id, start: group.start, duration: group.duration })
}
