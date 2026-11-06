export const WIDTHS = [375, 768, 1280, 1920] as const

export const VIEWS = [{ id: "completa", search: "" }] as const

export type RouteCase = { path: string; name: string; charts: boolean }

export const ROUTES: RouteCase[] = [
  { path: "/", name: "visao-geral", charts: true },
  { path: "/datasets/ds1", name: "ds1", charts: true },
  { path: "/datasets/ds2", name: "ds2", charts: true },
  { path: "/datasets/ds3", name: "ds3", charts: true },
  { path: "/datasets/ds4", name: "ds4", charts: true },
  { path: "/datasets/ds5", name: "ds5", charts: true },
  { path: "/qualidade", name: "qualidade", charts: false },
  { path: "/noticias", name: "noticias", charts: false },
  { path: "/configuracoes", name: "configuracoes", charts: false },
]

export function routeUrl(route: RouteCase, search: string) {
  if (!search) return route.path
  return route.path === "/" ? `/${search}` : `${route.path}${search}`
}
