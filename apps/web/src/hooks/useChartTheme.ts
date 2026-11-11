import { useEffect, useState } from "react"
import { chartMotion } from "@/motion/chartMotion"
import { useMotionClock } from "@/motion/useMotion"
import { usePreferences } from "@/stores/preferences"

function readScale(prefix: string, count: number) {
  if (typeof document === "undefined") return []
  const styles = getComputedStyle(document.documentElement)
  return Array.from({ length: count }, (_, index) => {
    const raw = styles.getPropertyValue(`${prefix}${index + 1}`).trim()
    return raw ? `hsl(${raw})` : ""
  })
}

function readColors() {
  return readScale("--chart-", 6)
}

function readSequential() {
  return readScale("--chart-seq-", 5)
}

const DASH = ["0", "6 4", "2 3", "10 4 2 4"]
const MARKERS = ["circle", "square", "triangle", "diamond"] as const

function readHighContrast() {
  if (typeof document === "undefined") return false
  return document.documentElement.dataset.contrast === "high"
}

function readHcColors() {
  if (typeof document === "undefined") return []
  const styles = getComputedStyle(document.documentElement)
  return Array.from({ length: 6 }, (_, index) => styles.getPropertyValue(`--hc-chart-${index + 1}`).trim())
}

export function useChartTheme() {
  const theme = usePreferences((state) => state.theme)
  const contrast = usePreferences((state) => state.contrast)
  const { motion, live } = useMotionClock(true)
  const chartAnim = chartMotion(live ? motion : { animate: false, delayMs: 0, durationMs: motion.durationMs })
  const [colors, setColors] = useState<string[]>(readColors)
  const [sequential, setSequential] = useState<string[]>(readSequential)
  const [highContrast, setHighContrast] = useState(readHighContrast)

  useEffect(() => {
    const read = () => {
      const hc = readHighContrast()
      setHighContrast(hc)
      setColors(hc ? readHcColors() : readColors())
      setSequential(readSequential())
    }
    read()
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const contrastMedia = window.matchMedia("(prefers-contrast: more)")
    media.addEventListener("change", read)
    contrastMedia.addEventListener("change", read)
    return () => {
      media.removeEventListener("change", read)
      contrastMedia.removeEventListener("change", read)
    }
  }, [theme, contrast])

  return {
    colors,
    sequential,
    highContrast,
    strokeWidth: highContrast ? 2.5 : 1.5,
    dash: DASH,
    markers: MARKERS,
    isAnimationActive: chartAnim.isAnimationActive,
    chartAnim,
  }
}
