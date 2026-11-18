import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function hslToRgb(h: number, s: number, l: number) {
  const sat = s / 100
  const lig = l / 100
  const a = sat * Math.min(lig, 1 - lig)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    return lig - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [channel(0), channel(8), channel(4)]
}

function luminance(rgb: number[]) {
  const curve = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * curve(rgb[0]) + 0.7152 * curve(rgb[1]) + 0.0722 * curve(rgb[2])
}

function contrast(a: number[], b: number[]) {
  const left = luminance(a)
  const right = luminance(b)
  const [hi, lo] = left > right ? [left, right] : [right, left]
  return (hi + 0.05) / (lo + 0.05)
}

function block(css: string, selector: string) {
  const start = css.indexOf(selector)
  const slice = css.slice(start, css.indexOf("}", start))
  const tokens = new Map<string, [number, number, number]>()
  for (const match of slice.matchAll(/--(chart-\d+|card):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
    tokens.set(match[1], [Number(match[2]), Number(match[3]), Number(match[4])])
  }
  return tokens
}

describe("contraste dos gráficos", () => {
  const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf8")

  for (const [name, selector] of [
    ["claro", ":root {"],
    ["escuro", ".dark {"],
  ] as const) {
    it(`séries do tema ${name} contrastam com o card e entre si`, () => {
      const tokens = block(css, selector)
      const card = hslToRgb(...tokens.get("card")!)
      const series = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6"].map((key) => tokens.get(key)!)
      for (const token of series) {
        expect(contrast(hslToRgb(...token), card)).toBeGreaterThanOrEqual(3)
      }
      for (let index = 0; index < series.length - 1; index += 1) {
        const [hueA, , lightA] = series[index]
        const [hueB, , lightB] = series[index + 1]
        const hue = Math.min(Math.abs(hueA - hueB), 360 - Math.abs(hueA - hueB))
        expect(Math.abs(lightA - lightB) >= 15 || hue >= 60).toBe(true)
      }
    })
  }
})
