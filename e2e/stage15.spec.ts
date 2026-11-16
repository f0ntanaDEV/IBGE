import { expect, test } from "@playwright/test"
import { prepare, settle } from "./support"

const API = "http://127.0.0.1:8000/api/v1"
const PAGES = ["overview", "ds1", "ds2", "ds3", "ds4", "ds5"]
const ROUTES: Record<string, string> = {
  overview: "/",
  ds1: "/datasets/ds1",
  ds2: "/datasets/ds2",
  ds3: "/datasets/ds3",
  ds4: "/datasets/ds4",
  ds5: "/datasets/ds5",
}
const CODES = [0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 35, 41, 42, 43, 50, 51, 52, 53]

test("qualidade com 113 de 113 e status favorável", async ({ page }) => {
  await prepare(page)
  await page.goto("/qualidade?dataset=ds4&ano=2026")
  await settle(page)
  await expect(page.getByText("113 de 113 aprovadas")).toBeVisible()
  const fact = page.locator('[aria-label="Fatos"] li', { hasText: "Validações aprovadas" })
  await expect(fact).toContainText("Favorável")
  await expect(page.getByRole("button", { name: "Sobre o arredondamento da fonte" }).first()).toBeVisible()
})

test("base de demonstração com selos ok", async ({ page }) => {
  await prepare(page)
  await page.goto("/qualidade?dataset=ds1&source=sujo&ano=2026")
  await settle(page)
  await expect(page.getByRole("heading", { name: "Inserido · Detectado · Corrigido" })).toBeVisible()
  const seals = page.locator("[data-seal]")
  await expect(seals.first()).toBeVisible()
  const values = await seals.allTextContents()
  expect(values.length).toBeGreaterThan(0)
  expect(values.every((value) => value.trim() === "ok")).toBe(true)
  const demo = page.locator('[aria-label="Fatos"] li', { hasText: "Base de demonstração" })
  const demoText = await demo.innerText()
  expect(demoText).toContain("duplicatas removidas")
  expect(demoText).not.toContain("execução ainda não registrada")
  expect(demoText).not.toMatch(/0 duplicatas removidas · 0 nulos/)
})

test("fatos do Brasil e do Nordeste sem 2026 repetido", async ({ page, request }) => {
  test.setTimeout(120_000)
  await prepare(page)
  for (const id of PAGES) {
    for (const cod of [0, 2]) {
      const response = await request.get(`${API}/facts?page=${id}&cod=${cod}`)
      expect(response.ok()).toBeTruthy()
      const facts = (await response.json()) as { label: string; reference_year?: number; detail?: string; parts?: { label?: string; value: unknown }[] }[]
      for (const fact of facts) {
        const text = JSON.stringify(fact)
        if (fact.reference_year === 2026) expect(text).not.toContain("2026:")
      }
    }
  }
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator('[aria-label="Fatos"]')).toContainText("em relação ao pico")
  await page.goto("/datasets/ds4?cod=0&ano=2026")
  await settle(page)
  const facts = page.locator('[aria-label="Fatos"]')
  await expect(facts).toContainText("queda de 3,44 anos")
  await expect(facts).toContainText("nascimentos 11,17")
  await expect(facts).not.toContainText("2026:")
})

test("manchetes golden do Brasil e da Bahia", async ({ page }) => {
  test.setTimeout(120_000)
  await prepare(page)
  await page.goto("/datasets/ds1?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator("[data-headline]")).toContainText("17,1%")
  await expect(page.locator("[data-headline]")).toContainText("24,3%")
  await page.goto("/datasets/ds1?cod=29&ano=2026")
  await settle(page)
  await expect(page.locator("[data-headline]")).toContainText("16,6%")
  await expect(page.locator("[data-headline]")).toContainText("25,1%")
  await page.goto("/datasets/ds2?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator("[data-headline]")).toContainText("90+")
  await expect(page.locator("[data-headline]")).toContainText("+576,0%")
  await expect(page.locator("[data-headline]")).toContainText("−43,8%")
  await page.goto("/datasets/ds2?cod=29&ano=2026")
  await settle(page)
  await expect(page.locator("[data-headline]")).toContainText("+542,0%")
  await expect(page.locator("[data-headline]")).toContainText("−49,7%")
  await page.goto("/datasets/ds4?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator("[data-headline]")).toContainText("77,03")
  await expect(page.locator("[data-headline]")).toContainText("filho")
  await expect(page).toHaveTitle(/Projeções IBGE/)
})

test("idade mediana oficial é 36,1 no Brasil", async ({ page }) => {
  await prepare(page)
  await page.goto("/datasets/ds1?cod=0&ano=2026")
  await settle(page)
  await expect(page.locator('[data-kpi="idade_mediana"]')).toContainText("36,1")
  await expect(page.getByRole("region", { name: "Tabela" })).toBeVisible()
  await expect(page.getByRole("button", { name: "População" })).toBeVisible()
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  const median = page.locator('[aria-label="Fatos"] li', { hasText: "Idade mediana" })
  await expect(median).toContainText("36,1")
})

test("títulos e subtítulos sem lx, ex e TFT", async ({ page }) => {
  await prepare(page)
  await page.goto("/datasets/ds5?cod=0&ano=2026")
  await settle(page)
  const headings = await page.locator("main [data-chart-id] h2, main [data-chart-id] p").allTextContents()
  const blob = headings.join("\n")
  expect(blob).toContain("Sobreviventes de cada 100 nascidos")
  expect(blob).toContain("Anos de vida restantes por idade")
  expect(blob).not.toMatch(/\blx\b/)
  expect(blob).not.toMatch(/\bex\b/)
  expect(blob).not.toMatch(/\bTFT\b/)
})

test("painel databricks mostra só o iframe", async ({ page }) => {
  await prepare(page)
  await page.goto("/databricks")
  await expect(page.getByText("Carregando…")).toHaveCount(0)
  await expect(page.getByTitle("Painel Databricks")).toBeVisible()
  await expect(page.locator("iframe")).toHaveCount(1)
  await expect(page.getByRole("region", { name: "Tabela" })).toHaveCount(0)
  await expect(page).toHaveTitle(/Projeções IBGE/)
})

test("contexto dos 33 territórios fica abaixo de 2s no segundo passe", async ({ request }) => {
  test.setTimeout(720_000)
  for (const pageId of PAGES) {
    for (const cod of CODES) {
      const warm = await request.get(`${API}/context?page=${pageId}&cod=${cod}&ano=2026&sexo=T`)
      expect(warm.ok(), `${pageId} ${cod}`).toBeTruthy()
    }
  }
  for (const pageId of PAGES) {
    for (const cod of CODES) {
      const started = Date.now()
      const again = await request.get(`${API}/context?page=${pageId}&cod=${cod}&ano=2026&sexo=T`)
      expect(again.ok()).toBeTruthy()
      expect(Date.now() - started, `${pageId} ${cod}`).toBeLessThan(2000)
    }
  }
})

test("a busca permanece na barra", async ({ page }) => {
  await prepare(page)
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  await expect(page.getByPlaceholder("Buscar página ou território")).toBeVisible()
})
