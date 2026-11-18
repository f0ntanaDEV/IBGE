import { expect, test } from "@playwright/test"
import { prepare, settle } from "./support"

test("baixa o relatório da página", async ({ page }) => {
  await prepare(page)
  await page.goto("/datasets/ds4?cod=29&ano=2026")
  await settle(page)
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Relatório" }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const bytes = Buffer.concat(chunks)
  expect(bytes.length).toBeGreaterThan(0)
  expect(bytes.subarray(0, 4).toString()).toBe("%PDF")
})
