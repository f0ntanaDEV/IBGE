export const chartDefaults = {
  isAnimationActive: false,
  animationDuration: 0,
} as const

export const xAxisDefaults = { tickMargin: 8, padding: { left: 12, right: 12 } }
export const yAxisDefaults = { tickMargin: 8, width: "auto" as const }

export const SEX_COLORS = { homens: "hsl(var(--chart-1))", mulheres: "hsl(var(--chart-4))" }
export const BAND_COLORS = { "0-14": "hsl(var(--chart-2))", "15-64": "hsl(var(--chart-6))", "60+": "hsl(var(--chart-3))" }
