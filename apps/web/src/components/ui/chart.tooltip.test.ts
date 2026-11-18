import { describe, expect, it } from "vitest"
import { dedupeTooltip } from "@/components/ui/chart"

describe("tooltip", () => {
  it("mostra uma linha por métrica numa série partida", () => {
    const rows = dedupeTooltip(
      [
        { dataKey: "e0_t:observado", name: "Esperança", value: 75 },
        { dataKey: "e0_t:projetado", name: "Esperança", value: null },
        { dataKey: "marca", name: "Projeção →", value: 0 },
      ],
      2024,
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.dataKey).toBe("e0_t")
    expect(rows[0]?.value).toBe(75)
  })

  it("marca o ano futuro como projeção", () => {
    const rows = dedupeTooltip([{ dataKey: "tft", name: "Filhos", value: 1.5 }], 2040)
    expect(rows[0]?.projected).toBe(true)
  })
})