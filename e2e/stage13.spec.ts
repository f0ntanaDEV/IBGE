import { expect, test } from "@playwright/test"
import { prepare, settle } from "./support"

const DATA_PAGES = ["/", "/datasets/ds1", "/datasets/ds2", "/datasets/ds3", "/datasets/ds4", "/datasets/ds5"]

test("status e ações do Brasil e da Bahia em 2026", async ({ page }) => {
  await prepare(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator('[data-kpi="e0_t"] [data-status="good"]')).toBeVisible()
  await expect(page.locator('[data-kpi="tft"] [data-status="bad"]')).toBeVisible()
  await expect(page.locator('[data-kpi="ie60"] [data-status="warn"]')).toBeVisible()
  await expect(page.getByRole("region", { name: "O que fazer" })).toContainText("Crítico")
  await page.goto("/?cod=29&ano=2026")
  await settle(page)
  await expect(page.locator('[data-kpi="e0_t"] [data-status="warn"]')).toBeVisible()
})

test("primeira dobra em 1280×800", async ({ page }) => {
  await prepare(page)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  const inside = await page.evaluate(() => {
    const nodes = [
      document.querySelector("p.lead"),
      document.querySelector("[data-headline]"),
      ...Array.from(document.querySelectorAll("[data-status]")).slice(0, 4),
      Array.from(document.querySelectorAll("p")).find((item) => item.textContent?.includes("Revisão 2024")) ?? null,
    ]
    return nodes.every((node) => {
      if (!node) return false
      const box = node.getBoundingClientRect()
      return box.height > 0 && box.top >= 0 && box.bottom <= 800
    })
  })
  expect(inside).toBe(true)
})

test("linha de atualização, contexto, anos e atípicos", async ({ page }) => {
  test.setTimeout(180_000)
  await prepare(page)
  for (const path of DATA_PAGES) {
    await page.goto(`${path}?cod=0&ano=2026`)
    await settle(page)
    await expect(page.getByText("Revisão 2024 (divulgada em 22/08/2024)")).toBeVisible()
    await expect(page.getByRole("button", { name: /Ver no gráfico:/ }).first()).toBeVisible({ timeout: 30_000 })
    const text = await page.locator("body").innerText()
    expect(text).not.toMatch(/\b2\.0\d{2}\b(?!\.\d)/)
    expect(text).not.toMatch(/\d\.\d{5,}/)
  }
  await page.goto("/datasets/ds1?cod=0&ano=2026")
  await settle(page)
  const outlierCells = page.locator("table tbody tr td:last-child")
  await expect(outlierCells.first()).toBeVisible()
  const values = await outlierCells.allTextContents()
  expect(values.length).toBeGreaterThan(0)
  expect(values.every((value) => value.trim() === "Não")).toBe(true)
  await page.goto("/qualidade?dataset=ds1&source=original")
  await settle(page)
  await expect(page.getByText(/\d+ de \d+ aprovadas/)).toBeVisible()
})
