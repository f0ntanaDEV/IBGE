import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { AppShell } from "@/app/layout/AppShell"
import { Providers } from "@/app/providers"
import { OverviewPage } from "@/features/overview/page"

function hsl(h: number, s: number, l: number) {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

function contrast(a: number[], b: number[]) {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const lum = (rgb: number[]) => 0.2126 * lin(rgb[0]!) + 0.7152 * lin(rgb[1]!) + 0.0722 * lin(rgb[2]!)
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)]
  return (hi + 0.05) / (lo + 0.05)
}

function tokens(block: string) {
  const found = new Map<string, [number, number, number]>()
  for (const match of block.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g)) {
    found.set(match[1] ?? "", [Number(match[2]), Number(match[3]), Number(match[4])])
  }
  return found
}

function color(palette: Map<string, [number, number, number]>, name: string) {
  const value = palette.get(name)
  if (!value) throw new Error(name)
  return hsl(value[0], value[1], value[2])
}

describe("acessibilidade", () => {
  it("mantém contraste AA nos dois temas", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf8")
    const root = tokens(css.slice(css.indexOf(":root"), css.indexOf(".dark {")))
    const dark = tokens(css.slice(css.indexOf(".dark {")))
    for (const palette of [root, dark]) {
      const bg = color(palette, "background")
      const fg = color(palette, "foreground")
      const muted = color(palette, "muted-foreground")
      const primary = color(palette, "primary")
      const onPrimary = color(palette, "primary-foreground")
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(muted, bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(onPrimary, primary)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("nomeia botões de ícone", () => {
    render(
      <MemoryRouter>
        <Providers>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<OverviewPage />} />
            </Route>
          </Routes>
        </Providers>
      </MemoryRouter>,
    )
    for (const name of ["Abrir menu", "Selecionar tema"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument()
    }
  })
})
