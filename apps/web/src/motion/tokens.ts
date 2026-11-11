export const MOTION = {
  page: 800,
  reveal: 500,
  update: 400,
  word: 100,
  readyTimeout: 1200,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const

export type MotionGroup = { id: string; start: number; duration: number }

export function motionEmergency() {
  return import.meta.env.VITE_MOTION_ENABLED === "false"
}

export function easeOutExpo(t: number) {
  if (t >= 1) return 1
  if (t <= 0) return 0
  return 1 - 2 ** (-10 * t)
}
