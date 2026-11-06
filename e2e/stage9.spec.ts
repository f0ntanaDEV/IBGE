import { expect, test, type Page } from "@playwright/test"
import { mkdirSync } from "node:fs"
import { ROUTES, WIDTHS, routeUrl } from "./routes"
import { expectNoHorizontalScroll, openFirstGlossary, prepare, settle } from "./support"

const THEMES = ["light", "dark"] as const

async function animations(page: Page) {
  return page.evaluate(() => document.getAnimations().length)
}

async function containment(page: Page) {
  return page.evaluate(() => {
    const bad: string[] = []
    for (const card of document.querySelectorAll<HTMLElement>("[data-card]")) {
      const cardOverflow = getComputedStyle(card).overflowY
      if (cardOverflow === "auto" || cardOverflow === "scroll") continue
      const box = card.getBoundingClientRect()
      for (const node of card.querySelectorAll<HTMLElement>("*")) {
        const style = getComputedStyle(node)
        if (style.display === "none" || style.visibility === "hidden") continue
        let parent = node.parentElement
        let scrolls = false
        while (parent && parent !== card) {
          const overflow = getComputedStyle(parent).overflowY
          if (overflow === "auto" || overflow === "scroll") {
            scrolls = true
            break
          }
          parent = parent.parentElement
        }
        if (scrolls) continue
        const rect = node.getBoundingClientRect()
        if (!rect.width || !rect.height) continue
        if (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1) {
          bad.push(`${card.querySelector("h2,h3")?.textContent?.trim() ?? "card"} · ${node.tagName}`)
        }
      }
    }
    return bad.slice(0, 6)
  })
}

async function gridReport(page: Page) {
  return page.evaluate(() => {
    if (window.innerWidth < 1280) return []
    const problems: string[] = []
    for (const board of document.querySelectorAll<HTMLElement>(".chart-board")) {
      let used = 0
      let row: number[] = []
      for (const child of board.children) {
        const span = Number((getComputedStyle(child).gridColumn || "").match(/span\s+(\d+)/)?.[1] ?? 12)
        row.push(span)
        used += span
        if (used > 12) {
          problems.push(`estouro ${row.join("+")}`)
          row = []
          used = 0
        } else if (used === 12) {
          const key = row.join("+")
          if (!["12", "6+6", "4+4+4", "8+4"].includes(key)) problems.push(key)
          if (row.length === 1 && row[0] === 4) problems.push("fatos-isolado")
          row = []
          used = 0
        }
      }
      if (used !== 0) problems.push(`sobra ${row.join("+")}`)
    }
    return problems
  })
}

for (const theme of THEMES) {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route.name} · ${theme} · ${width}px`, async ({ page }) => {
        await prepare(page, theme)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(routeUrl(route, ""))
        await settle(page)
        expect(await animations(page)).toBe(0)
        await expectNoHorizontalScroll(page)
        expect(await containment(page)).toEqual([])
        expect(await gridReport(page)).toEqual([])
        const fatos = await page.evaluate(
          () => [...document.querySelectorAll("[data-card]")].filter((card) => card.querySelector("h2")?.textContent?.trim() === "Fatos").length,
        )
        expect(fatos).toBe(0)
        if (width === 1280) {
          mkdirSync(`e2e/__screenshots__/${theme}`, { recursive: true })
          await page.screenshot({ path: `e2e/__screenshots__/${theme}/${route.name}.png`, fullPage: true })
        }
      })
    }
  }
}

test("popover, filtro e drill não criam animação", async ({ page }) => {
  await prepare(page, "light")
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/datasets/ds1")
  await settle(page)
  await openFirstGlossary(page)
  expect(await animations(page)).toBe(0)
  const year = page.getByRole("combobox", { name: "Ano" })
  if (await year.count()) {
    await year.selectOption("2030")
    await settle(page)
  }
  const bar = page.locator("svg rect").first()
  if (await bar.count()) await bar.click()
  expect(await animations(page)).toBe(0)
})
