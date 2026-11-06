declare module "d3-geo" {
  export type GeoPermissibleObjects = object
  export function geoMercator(): {
    fitExtent(extent: [[number, number], [number, number]], object: GeoPermissibleObjects): GeoPermissibleObjects
  }
  export function geoPath(projection: unknown): {
    (object: GeoPermissibleObjects): string | null
    area(object: GeoPermissibleObjects): number
  }
  export function geoCentroid(object: GeoPermissibleObjects): [number, number]
}
