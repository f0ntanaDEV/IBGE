import { expect, test, type Page } from "@playwright/test"
import { prepare, settle } from "./support"

const DATA_PAGES = ["/", "/datasets/ds1", "/datasets/ds2", "/datasets/ds3", "/datasets/ds4", "/datasets/ds5"]

async function prefs(page: Page, motion: "on" | "off", theme: "light" | "dark", mode: "technical" | "simple") {
  await prepare(page, theme)
  await page.addInitScript(
    ({ motion: choice, mode: navigation }) => {
      const raw = localStorage.getItem("ibge-preferences")
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
      parsed.state.motion = choice
      parsed.state.mode = navigation
      localStorage.setItem("ibge-preferences", JSON.stringify(parsed))
    },
    { motion, mode },
  )
}

async function scrollEnd(page: Page) {
  await page.evaluate(async () => {
    const step = () =>
      new Promise<void>((resolve) => {
        window.scrollBy(0, window.innerHeight)
        requestAnimationFrame(() => resolve())
      })
    for (let index = 0; index < 12; index += 1) {
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) break
      await step()
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
  })
}

test("animações desligadas não registram movimento", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await prefs(page, "off", "dark", "technical")
  await page.goto("/?cod=0&ano=2026&motion-debug=1")
  await settle(page)
  await page.waitForTimeout(400)
  const report = await page.evaluate(() => ({
    animations: document.getAnimations().length,
    observers: window.__motion?.observers ?? 0,
    motion: document.documentElement.dataset.motion,
  }))
  expect(report.motion).toBe("off")
  expect(report.animations).toBe(0)
  expect(report.observers).toBe(0)
  expect(errors).toEqual([])
})

test("entrada da primeira dobra compartilha o instante", async ({ page }) => {
  await prefs(page, "on", "dark", "technical")
  await page.goto("/?cod=0&ano=2026&motion-debug=1")
  const sync = await page.evaluate(async () => {
    const deadline = performance.now() + 2500
    let best = { count: 0, spread: 0 }
    while (performance.now() < deadline) {
      const animations = document.getAnimations().filter((item) => item.playState === "running")
      const starts = animations.map((item) => Number(item.startTime ?? 0))
      if (starts.length > best.count) {
        best = { count: starts.length, spread: Math.max(...starts) - Math.min(...starts) }
      }
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    return best
  })
  expect(sync.count).toBeGreaterThan(1)
  expect(sync.spread).toBeLessThanOrEqual(16)
})

test("depois da rolagem nada fica transparente e o estado final coincide", async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const bucket = { value: 0 }
    ;(window as unknown as { __cls: number }).__cls = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean }
        if (!shift.hadRecentInput && shift.value) bucket.value += shift.value
      }
      ;(window as unknown as { __cls: number }).__cls = bucket.value
    }).observe({ type: "layout-shift", buffered: true })
  })
  await prefs(page, "off", "dark", "technical")
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/?cod=0&ano=2026")
  await settle(page)
  await scrollEnd(page)
  const off = await page.screenshot({ fullPage: true })
  await prefs(page, "on", "dark", "technical")
  await page.goto("/?cod=0&ano=2026&motion-debug=1")
  await settle(page)
  await page.waitForTimeout(3000)
  await scrollEnd(page)
  await page.waitForTimeout(600)
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-anim]")].filter((node) => {
      const opacity = Number(getComputedStyle(node).opacity)
      return opacity < 1
    }).length,
  )
  const cls = await page.evaluate(() => (window as unknown as { __cls?: number }).__cls ?? 0)
  const on = await page.screenshot({ fullPage: true })
  const ratio = await page.evaluate(
    async ({ left, right }) => {
      const read = (src: string) =>
        new Promise<Uint8ClampedArray>((resolve) => {
          const image = new Image()
          image.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = image.width
            canvas.height = image.height
            const context = canvas.getContext("2d")
            if (!context) return resolve(new Uint8ClampedArray())
            context.drawImage(image, 0, 0)
            resolve(context.getImageData(0, 0, canvas.width, canvas.height).data)
          }
          image.src = src
        })
      const [a, b] = await Promise.all([read(left), read(right)])
      const pixels = Math.floor(Math.min(a.length, b.length) / 4)
      let diff = 0
      for (let index = 0; index < pixels; index += 1) {
        const offset = index * 4
        if (a[offset] !== b[offset] || a[offset + 1] !== b[offset + 1] || a[offset + 2] !== b[offset + 2]) diff += 1
      }
      return pixels ? diff / pixels : 1
    },
    { left: `data:image/png;base64,${off.toString("base64")}`, right: `data:image/png;base64,${on.toString("base64")}` },
  )
  expect(hidden).toBe(0)
  expect(cls).toBeLessThan(0.01)
  expect(errors).toEqual([])
  expect(ratio).toBeLessThanOrEqual(0.001)
})

test("modo simples mostra o texto inteiro, sem fade por palavra", async ({ page }) => {
  await prefs(page, "on", "light", "simple")
  await page.goto("/?cod=0&ano=2026&motion-debug=1")
  await settle(page)
  await expect(page.getByRole("button", { name: "Mostrar tudo" })).toHaveCount(0)
  await expect(page.getByText("Esta página mostra o tamanho da população")).toBeVisible()
})

for (const theme of ["light", "dark"] as const) {
  for (const mode of ["technical", "simple"] as const) {
    test(`páginas de dados com motion ${theme} ${mode}`, async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on("pageerror", (error) => errors.push(error.message))
      await prefs(page, "on", theme, mode)
      for (const path of DATA_PAGES) {
        await page.goto(`${path}?cod=0&ano=2026`)
        await settle(page)
        await expect(page.locator("main")).toBeVisible()
      }
      expect(errors).toEqual([])
    })
  }
}
