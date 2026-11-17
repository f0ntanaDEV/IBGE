import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ApiStatus, mysqlLabel } from "@/app/layout/Footer"

vi.mock("@/lib/api", () => ({
  fetchHealth: vi.fn(),
}))

import { fetchHealth, type HealthStatus } from "@/lib/api"

const fetchHealthMock = vi.mocked(fetchHealth)

function health(mysql: HealthStatus["mysql"], seeding = false): HealthStatus {
  return { api: "ok", mysql, mysql_required: true, seeding }
}

function renderStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ApiStatus />
    </QueryClientProvider>,
  )
}

describe("rodapé", () => {
  beforeEach(() => {
    fetchHealthMock.mockReset()
  })

  it("traduz os quatro estados do MySQL", () => {
    expect(mysqlLabel(health("ok"))).toBe("MySQL ok")
    expect(mysqlLabel(health("vazio"))).toBe("MySQL sem dados")
    expect(mysqlLabel(health("carregando"))).toBe("MySQL carregando")
    expect(mysqlLabel(health("down"))).toBe("MySQL indisponível")
  })

  it("mostra o rótulo carregando enquanto a semeadura corre", async () => {
    fetchHealthMock.mockResolvedValue(health("carregando", true))
    renderStatus()
    expect(await screen.findByText(/MySQL carregando/)).toBeInTheDocument()
  })
})
