import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MilestonesTimeline } from "@/components/charts/MilestonesTimeline"

describe("MilestonesTimeline", () => {
  it("ordena os marcos e seleciona o ano", async () => {
    const onSelectYear = vi.fn()
    render(
      <MilestonesTimeline
        summary="Marcos"
        onSelectYear={onSelectYear}
        items={[
          { id: "tft", ano: 2004, label: "Fecundidade abaixo da reposição" },
          { id: "pico", ano: null, label: "Pico" },
          { id: "nasc", ano: 2040, label: "Nascimentos abaixo dos óbitos" },
        ]}
      />,
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent("2004")
    await userEvent.click(buttons[1])
    expect(onSelectYear).toHaveBeenCalledWith(2040)
  })
})
