import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { UploadDialog } from "@/features/datasets/components/UploadDialog"
import { queryClient } from "@/lib/queryClient"

function Host() {
  const [open, setOpen] = useState(true)
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UploadDialog datasetId="ds1" open={open} onOpenChange={setOpen} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  queryClient.clear()
})

describe("upload", () => {
  it("mostra a prévia e pede confirmação para cap", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith("/upload")) {
        return new Response(JSON.stringify({ columns: ["idade"], preview: [{ idade: 0, populacao: 10 }], filename: "ds1.csv", bytes: 4, dataset_id: "ds1" }), { status: 200 })
      }
      if (url.endsWith("/process")) {
        expect(JSON.parse(String(init?.body)).confirm).toBe(true)
        expect(JSON.parse(String(init?.body)).cleaning.outlier_strategy).toBe("cap")
        return new Response(JSON.stringify({ rows_before: 2, rows_after: 2, validations: [{ rule: "sexo", ok: true }] }), { status: 200 })
      }
      return new Response("{}", { status: 404 })
    })
    vi.stubGlobal("fetch", fetchMock)
    render(<Host />)
    const input = document.querySelector("input[type=file]") as HTMLInputElement
    await user.upload(input, new File(["idade\n0"], "amostra.csv", { type: "text/csv" }))
    expect(await screen.findByText("Prévia de 1 linhas")).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText("Estratégia de outliers"), "cap")
    await user.click(screen.getByRole("button", { name: "Processar" }))
    expect(await screen.findByRole("heading", { name: "Alterar valores publicados?" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Confirmar alteração" }))
    expect(await screen.findByText(/Linhas:/)).toBeInTheDocument()
  })
})
