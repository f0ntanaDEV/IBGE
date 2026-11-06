import { useEffect, useState } from "react"
import { chartDefaults } from "@/lib/chartDefaults"
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

export function useChartTheme() {
  const theme = usePreferences((state) => state.theme)
  const [colors, setColors] = useState<string[]>(readColors)
  const [sequential, setSequential] = useState<string[]>(readSequential)

  useEffect(() => {
    const read = () => {
      setColors(readColors())
      setSequential(readSequential())
    }
    read()
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", read)
    return () => media.removeEventListener("change", read)
  }, [theme])

  return { colors, sequential, isAnimationActive: chartDefaults.isAnimationActive }
}
