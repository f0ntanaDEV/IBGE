import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo"
import { describe, expect, it } from "vitest"

type Mesh = { features: { properties: { sigla: string }; geometry: GeoPermissibleObjects }[] }

describe("malha do Brasil", () => {
  it("projeta cada UF com área menor que 10% do SVG", () => {
    const mesh = JSON.parse(readFileSync(resolve(process.cwd(), "public/geo/br-uf.json"), "utf8")) as Mesh
    const width = 320
    const height = 320
    const projection = geoMercator().fitExtent(
      [
        [0, 0],
        [width, height],
      ],
      { type: "FeatureCollection", features: mesh.features } as unknown as GeoPermissibleObjects,
    )
    const path = geoPath(projection)
    const limit = width * height * 0.1
    expect(mesh.features).toHaveLength(27)
    for (const feature of mesh.features) {
      const area = path.area(feature as unknown as GeoPermissibleObjects)
      expect(area, feature.properties.sigla).toBeGreaterThan(0)
      expect(area, feature.properties.sigla).toBeLessThan(limit)
    }
  })
})
