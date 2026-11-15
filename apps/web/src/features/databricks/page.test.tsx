import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DatabricksPage } from "@/features/databricks/page"

vi.mock("@/features/datasets/api", () => ({
  fetchData: vi.fn(async () => ({
    page: 1,
    page_size: 10,
    total: 1,
    items: [{ ano: 2026, idade: 0, sexo: "Ambos", local: "Brasil", sigla: "BR", populacao: 1000 }],
  })),
}))

describe("página databricks", () => {
  it("mostra só a tabela da população", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <DatabricksPage />
      </QueryClientProvider>,
    )
    expect(await screen.findByRole("region", { name: "Tabela" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "População" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Databricks/ })).not.toBeInTheDocument()
    expect(screen.queryByTitle("Painel Databricks")).not.toBeInTheDocument()
  })
})
