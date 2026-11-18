import { describe, expect, it } from "vitest"
import { migrateLegacyFilters, withFilters } from "@/lib/navLink"

describe("withFilters", () => {
  it("copia território, ano e sexo e preserva a âncora", () => {
    expect(withFilters("/datasets/ds4#grafico", "?cod=29&ano=2026&sexo=Mulheres&fonte=ibge")).toBe(
      "/datasets/ds4?cod=29&ano=2026&sexo=Mulheres#grafico",
    )
  })
})

describe("migrateLegacyFilters", () => {
  it("transforma sel_* em filtros da URL e apaga o drill antigo", () => {
    const params = new URLSearchParams("cod=35&ano=2026&sel_uf=29&sel_ano=2040&sel_sexo=M&sel_faixa=0-4&d_map=1")
    const migrated = migrateLegacyFilters(params)
    expect(migrated?.params.get("cod")).toBe("29")
    expect(migrated?.params.get("ano")).toBe("2040")
    expect(migrated?.params.get("sexo")).toBe("Mulheres")
    expect(migrated?.faixa).toEqual(["0-4"])
    expect(migrated?.params.toString()).not.toMatch(/sel_|d_map/)
  })

  it("não altera uma URL que já está no formato novo", () => {
    expect(migrateLegacyFilters(new URLSearchParams("cod=29&ano=2026"))).toBeNull()
  })
})
