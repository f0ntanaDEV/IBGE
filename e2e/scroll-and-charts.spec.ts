import { expect, test } from "@playwright/test"
import { ROUTES, VIEWS, WIDTHS, routeUrl } from "./routes"
import { chartMarks, expectNoHorizontalScroll, openFirstGlossary, prepare, settle } from "./support"

for (const route of ROUTES) {
  for (const view of VIEWS) {
    for (const width of WIDTHS) {
      test(`${route.name} · ${view.id} · ${width}px sem rolagem horizontal`, async ({ page }) => {
        await prepare(page)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(routeUrl(route, view.search))
        await settle(page)
        await expectNoHorizontalScroll(page)
        await openFirstGlossary(page)
        await expectNoHorizontalScroll(page)
      })
    }
  }
}

for (const route of ROUTES) {
  for (const view of VIEWS) {
    test(`${route.name} · ${view.id} · fumaça de gráficos`, async ({ page }) => {
      test.skip(!route.charts, "rota sem gráfico")
      await prepare(page)
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(routeUrl(route, view.search))
      await settle(page)
      await expect.poll(async () => (await chartMarks(page)).empty.length, { timeout: 2_000 }).toBeGreaterThanOrEqual(0)
      const marks = await chartMarks(page)
      expect(marks.hosts, "página de gráfico sem marcas").toBeGreaterThan(0)
      expect(marks.empty, marks.empty.join(", ")).toEqual([])
    })
  }
}
