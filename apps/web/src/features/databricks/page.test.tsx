import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DatabricksPage } from "@/features/databricks/page"

const { instances, initialized } = vi.hoisted(() => ({
  instances: [] as {
    opts: {
      instanceUrl: string
      token: string
      workspaceId: string
      dashboardId: string
      container: HTMLElement
      getNewToken?: () => Promise<string>
    }
  }[],
  initialized: [] as number[],
}))

vi.mock("@databricks/aibi-client", () => ({
  DatabricksDashboard: class {
    opts: {
      instanceUrl: string
      token: string
      workspaceId: string
      dashboardId: string
      container: HTMLElement
      getNewToken?: () => Promise<string>
    }
    constructor(opts: {
      instanceUrl: string
      token: string
      workspaceId: string
      dashboardId: string
      container: HTMLElement
      getNewToken?: () => Promise<string>
    }) {
      this.opts = opts
      instances.push(this)
    }
    initialize() {
      initialized.push(instances.length)
    }
    destroy() {}
  },
}))

describe("página databricks", () => {
  it("monta o cliente do painel no espaço da página", async () => {
    instances.length = 0
    initialized.length = 0
    sessionStorage.clear()
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => ({
        ok: true,
        json: async () => ({
          token: input ? "emitido-pelo-servidor" : "",
          instance_url: "https://dbc-e7ffba4b-1a76.cloud.databricks.com",
          workspace_id: "7474648187013488",
          dashboard_id: "01f1e08bd1d71ca9b49a4604ee008ce0",
        }),
    }))
    vi.stubGlobal("fetch", fetchMock)
    render(<DatabricksPage />)
    const box = document.getElementById("dashboard-container")
    expect(box).toBeTruthy()
    expect(box).toHaveClass("h-full", "w-full", "flex-1")
    await waitFor(() => expect(instances).toHaveLength(1))
    expect(instances[0]?.opts.instanceUrl).toBe("https://dbc-e7ffba4b-1a76.cloud.databricks.com")
    expect(instances[0]?.opts.token).toBe("emitido-pelo-servidor")
    expect(instances[0]?.opts.workspaceId).toBe("7474648187013488")
    expect(instances[0]?.opts.dashboardId).toBe("01f1e08bd1d71ca9b49a4604ee008ce0")
    expect(instances[0]?.opts.container).toBe(box)
    expect(initialized).toEqual([1])
    expect(document.querySelector('iframe[src*="dashboardsv3"]')).toBeNull()
    const called = String(fetchMock.mock.calls[0]?.[0])
    expect(called).toContain("external_viewer_id=")
    expect(called).not.toContain("@")
    await instances[0]?.opts.getNewToken?.()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole("region", { name: "Tabela" })).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
