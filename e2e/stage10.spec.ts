import { expect, test } from "@playwright/test"
import { prepare, settle } from "./support"

const routes = ["/", "/datasets/ds1", "/datasets/ds2", "/datasets/ds3", "/datasets/ds4", "/datasets/ds5", "/qualidade", "/insights"]

test("anos sem ponto e rodapé do GitHub", async ({ page }) => {
  await prepare(page)
  for (const route of routes) {
    await page.goto(route)
    await settle(page)
    const leaked = await page.evaluate(() => {
      const pattern = /\b2\.0[0-7]\d\b/
      const nodes = document.querySelectorAll("body *")
      for (const node of nodes) {
        if (pattern.test(node.textContent ?? "")) return node.textContent
        for (const attr of node.getAttributeNames()) {
          if (attr.startsWith("aria-") || attr === "title") {
            const value = node.getAttribute(attr) ?? ""
            if (pattern.test(value)) return value
          }
        }
      }
      return ""
    })
    expect(leaked).toBe("")
  }
  await expect(page.getByRole("link", { name: "Perfil de f0ntanaDEV no GitHub (abre em nova aba)" })).toHaveAttribute("href", "https://github.com/f0ntanaDEV")
})

test("voltar para o Brasil não esvazia a página", async ({ page }) => {
  await prepare(page)
  await page.goto("/datasets/ds1")
  await settle(page)
  const territory = page.getByLabel("Território")
  await territory.selectOption("29")
  await territory.selectOption("0")
  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(page.getByText("Tentar novamente")).toHaveCount(0)
})
