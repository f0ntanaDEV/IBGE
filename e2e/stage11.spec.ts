import { mkdirSync } from "node:fs"
import { expect, test } from "@playwright/test"
import { prepare, settle } from "./support"

const PAGES = [
  { path: "/?ano=2026", name: "visao-geral" },
  { path: "/datasets/ds1?ano=2026", name: "ds1" },
  { path: "/datasets/ds2?ano=2026", name: "ds2" },
  { path: "/datasets/ds3?ano=2026", name: "ds3" },
  { path: "/datasets/ds4?ano=2026", name: "ds4" },
  { path: "/datasets/ds5?ano=2026", name: "ds5" },
  { path: "/qualidade?source=sujo&dataset=ds3", name: "qualidade" },
  { path: "/insights", name: "insights" },
]

for (const theme of ["light", "dark"] as const) {
  test(`screenshots ${theme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1280, height: 900 })
    for (const route of PAGES) {
      await prepare(page, theme)
      await page.goto(route.path)
      await settle(page)
      mkdirSync(`e2e/__screenshots__/${theme}`, { recursive: true })
      await page.screenshot({ path: `e2e/__screenshots__/${theme}/${route.name}.png`, fullPage: true })
    }
  })
}

for (const path of ["/", "/datasets/ds1", "/datasets/ds2", "/datasets/ds3", "/datasets/ds4", "/datasets/ds5"]) {
  test(`contexto ${path}`, async ({ page }) => {
    await prepare(page)
    await page.goto(`${path}?cod=0&ano=2026`)
    await settle(page)
    const chips = page.getByRole("button", { name: /Ver no gráfico:/ })
    await expect(chips.first()).toBeVisible({ timeout: 30_000 })
    const count = await chips.count()
    expect(count).toBeGreaterThanOrEqual(5)
    expect(count).toBeLessThanOrEqual(7)
    await chips.first().click()
    await expect(page.locator(":focus")).toHaveAttribute("data-chart-id", /.+/ )
  })
}

test("contexto da Bahia mostra a população de referência", async ({ page }) => {
  await prepare(page)
  await page.goto("/?cod=29&ano=2026")
  await settle(page)
  await expect(page.locator("[data-population]").first()).toHaveAttribute("data-population", "14889472")
})

test("selos da base de demonstração", async ({ page }) => {
  await prepare(page)
  for (const dataset of ["ds1", "ds2", "ds3", "ds4", "ds5"]) {
    await page.goto(`/qualidade?source=sujo&dataset=${dataset}`)
    await settle(page)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Base de demonstração")
    const seals = page.locator("[data-seal]")
    await expect(seals.first()).toBeVisible()
    const values = await seals.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-seal")))
    expect(values.length).toBeGreaterThan(0)
    expect(values.every((value) => value === "ok")).toBe(true)
  }
})

test("insights expande, recolhe, âncora e teclado", async ({ page }) => {
  await prepare(page)
  await page.goto("/insights")
  await settle(page)
  const first = page.locator("#overview-1 button").first()
  await expect(first).toHaveAttribute("aria-expanded", "true")
  await page.getByRole("button", { name: "Recolher todas" }).first().click()
  await expect(first).toHaveAttribute("aria-expanded", "false")
  await page.getByRole("button", { name: "Expandir todas" }).first().click()
  await expect(page.locator("#overview-2 button").first()).toHaveAttribute("aria-expanded", "true")
  await page.goto("/insights#ds4-3")
  await settle(page)
  const anchored = page.locator("#ds4-3 button").first()
  await expect(anchored).toHaveAttribute("aria-expanded", "true")
  await anchored.focus()
  await page.keyboard.press("Enter")
  await expect(anchored).toHaveAttribute("aria-expanded", "false")
})
