import { expect, type Page } from "@playwright/test"

const PREFERENCES_KEY = "ibge-preferences"

export async function prepare(page: Page, theme: "light" | "dark" = "dark") {
  await page.addInitScript(
    ({ key, theme: choice }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            theme: choice,
            density: "comfortable",
          },
          version: 0,
        }),
      )
    },
    { key: PREFERENCES_KEY, theme },
  )
}

export async function settle(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(page.getByText("Carregando…")).toHaveCount(0)
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0, { timeout: 20_000 })
}

export async function expectNoHorizontalScroll(page: Page) {
  const box = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
}

export async function openFirstGlossary(page: Page) {
  const help = page.getByRole("button", { name: /O que significa/ }).first()
  if ((await help.count()) === 0) return false
  await help.click()
  await expect(page.getByRole("dialog").first()).toBeVisible()
  return true
}

type MarkReport = { hosts: number; empty: string[] }

export async function chartMarks(page: Page): Promise<MarkReport> {
  return page.evaluate(() => {
    const icon = "0 0 24 24"
    const hosts = [
      ...document.querySelectorAll<HTMLElement>("[data-chart]"),
      ...[...document.querySelectorAll<HTMLCanvasElement>("main canvas")].filter((node) => !node.closest("[data-chart]")),
      ...[...document.querySelectorAll<SVGSVGElement>("main svg")].filter((node) => {
        if (node.closest("[data-chart]")) return false
        return (node.getAttribute("viewBox") ?? "") !== icon
      }),
    ]
    const empty: string[] = []
    hosts.forEach((host, index) => {
      if (host instanceof HTMLCanvasElement) {
        if (host.width > 0 && host.height > 0) return
        empty.push(`canvas#${index}`)
        return
      }
      const root = host instanceof SVGSVGElement ? host : host
      const paths = [...root.querySelectorAll("path")].filter((path) => {
        const d = path.getAttribute("d")
        if (!d) return false
        const offset = getComputedStyle(path).strokeDashoffset
        return offset === "0px" || offset === "0"
      })
      const shapes = [...root.querySelectorAll("rect, circle, line, text")].filter((node) => {
        const box = node.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      })
      if (paths.length + shapes.length === 0) {
        const title = host.closest("section, article")?.querySelector("h2, h3")?.textContent?.trim()
        empty.push(title || host.getAttribute("data-chart") || `grafico#${index}`)
      }
    })
    return { hosts: hosts.length, empty }
  })
}
