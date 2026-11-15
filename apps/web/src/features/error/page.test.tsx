import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { NotFoundPage, RouteErrorPage } from "@/features/error/page"

describe("página de erro", () => {
  it("descreve o 404 e leva à visão geral", async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/sumiu"]}>
        <Routes>
          <Route path="/" element={<p>Visão geral</p>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeInTheDocument()
    expect(document.title).toBe("Página não encontrada · Projeções IBGE")
    await user.click(screen.getByRole("link", { name: "Ir para a visão geral" }))
    expect(screen.getByText("Visão geral")).toBeInTheDocument()
  })

  it("sai do endereço inexistente para a visão geral", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        {
          path: "/",
          children: [
            {
              children: [
                { index: true, element: <p>Visão geral</p> },
                { path: "*", element: <NotFoundPage /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/sumiu"] },
    )
    render(<RouterProvider router={router} />)
    await user.click(screen.getByRole("link", { name: "Ir para a visão geral" }))
    expect(await screen.findByText("Visão geral")).toBeInTheDocument()
  })

  it("mostra nova tentativa quando a rota falha ao montar", async () => {
    function Boom() {
      throw new Error("falha")
    }
    const router = createMemoryRouter(
      [{ path: "/", element: <Boom />, errorElement: <RouteErrorPage /> }],
      { initialEntries: ["/"] },
    )
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole("heading", { name: "Não foi possível abrir esta página" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument()
    expect(screen.getByText("Detalhe técnico")).toBeInTheDocument()
  })
})
