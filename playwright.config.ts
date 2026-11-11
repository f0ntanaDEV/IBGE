import { resolve } from "node:path"
import { defineConfig, devices } from "@playwright/test"

const dataDir = resolve(process.cwd(), "data")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: "apps/api",
      env: { DATA_DIR: dataDir, MYSQL_REQUIRED: "false" },
      url: "http://127.0.0.1:8000/api/v1/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort",
      cwd: "apps/web",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
