import { expect, test, type Page } from "@playwright/test"
import { prepare, settle } from "./support"

const PAGES = ["/", "/datasets/ds1", "/datasets/ds2", "/datasets/ds3", "/datasets/ds4", "/datasets/ds5"]
const POPULATION: Record<string, string> = {
  "0": "214211951",
  "2": "57366981",
  "29": "14889472",
}

async function expectStep(page: Page, cod: number) {
  await settle(page)
  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(page.getByLabel("Território")).toHaveValue(String(cod))
  const population = page.locator("[data-population]").first()
  if ((await population.count()) && POPULATION[String(cod)]) {
    await expect(population).toHaveAttribute("data-population", POPULATION[String(cod)])
  }
}

for (const mode of ["technical", "simple"] as const) {
  test.describe(`território ${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await prepare(page)
      await page.addInitScript((choice) => {
        const key = "ibge-preferences"
        const current = JSON.parse(localStorage.getItem(key) || "{}")
        localStorage.setItem(key, JSON.stringify({ ...current, state: { ...(current.state ?? {}), mode: choice, theme: "dark", density: "comfortable" }, version: 0 }))
      }, mode)
    })

    for (const path of PAGES) {
      test(`${path} percorre a matriz`, async ({ page }) => {
        test.setTimeout(120_000)
        await page.goto(`${path}?cod=0&ano=2026`)
        await expectStep(page, 0)
        for (const cod of ["2", "0", "29", "0", "29", "2", "35", "0", "5", "53", "5"]) {
          await page.getByLabel("Território").selectOption(cod)
          await expectStep(page, Number(cod))
        }
        await page.reload()
        await expectStep(page, 5)
        await page.goto(`${path}?cod=29&ano=2026`)
        await page.reload()
        await expectStep(page, 29)
        await page.goto(`${path}?cod=99&ano=2026`)
        await expect(page.getByText("Território inválido, exibindo Brasil").first()).toBeVisible()
        await expectStep(page, 0)
      })
    }
  })
}

test("voltar no histórico e levar o território na navegação", async ({ page }) => {
  await prepare(page)
  await page.goto("/datasets/ds1?cod=0&ano=2026")
  await expect(page.getByLabel("Território")).toBeVisible()
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0, { timeout: 40_000 })
  await page.getByLabel("Território").selectOption("35")
  await expect(page.getByLabel("Território")).toHaveValue("35")
  await page.goBack()
  await expect(page.getByLabel("Território")).toHaveValue("0")
  await page.goto("/datasets/ds1?cod=35&ano=2026")
  await settle(page)
  await page.getByRole("link", { name: "Indicadores" }).click()
  await expect(page).toHaveURL(/\/datasets\/ds4\?.*cod=35/)
  await page.goto("/datasets/ds1?cod=35&ano=2026&sel_uf=29&d_map=1")
  await settle(page)
  await page.getByLabel("Território").selectOption("29")
  await expect(page).toHaveURL(/cod=29/)
  await expect(page).not.toHaveURL(/sel_uf|d_map/)
})
