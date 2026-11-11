export function chartMotion(motion: { animate: boolean; delayMs: number; durationMs: number }) {
  return motion.animate
    ? {
        isAnimationActive: true,
        animationBegin: Math.max(0, Math.round(motion.delayMs)),
        animationDuration: Math.max(0, Math.round(motion.durationMs)),
        animationEasing: "ease-out" as const,
      }
    : { isAnimationActive: false }
}
