import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { DatabricksPage } from "@/features/databricks/page"

describe("página databricks", () => {
  it("mostra só o iframe do painel", () => {
    render(<DatabricksPage />)
    const frame = screen.getByTitle("Painel Databricks")
    expect(frame.tagName).toBe("IFRAME")
    expect(frame).toHaveAttribute("src", expect.stringContaining("/embed/dashboardsv3/"))
    expect(screen.queryByRole("region", { name: "Tabela" })).not.toBeInTheDocument()
  })
})
