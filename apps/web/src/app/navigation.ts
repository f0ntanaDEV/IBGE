import { Activity, HeartPulse, Layers, LayoutDashboard, Lightbulb, Newspaper, Settings, ShieldCheck, Users, UsersRound, type LucideIcon } from "lucide-react"

export type NavItem = {
  to: string
  label: string
  title: string
  icon: LucideIcon
  end?: boolean
}

export const datasetNav: NavItem[] = [
  { to: "/datasets/ds1", label: "População por idade", title: "População por idade", icon: Users },
  { to: "/datasets/ds2", label: "Grupos quinquenais", title: "Grupos quinquenais", icon: Layers },
  { to: "/datasets/ds3", label: "Grupos etários", title: "Grupos etários", icon: UsersRound },
  { to: "/datasets/ds4", label: "Indicadores", title: "Indicadores", icon: Activity },
  { to: "/datasets/ds5", label: "Tábuas de mortalidade", title: "Tábuas de mortalidade", icon: HeartPulse },
]

export const mainNav: NavItem[] = [
  { to: "/", label: "Visão geral", title: "Visão geral", icon: LayoutDashboard, end: true },
  ...datasetNav,
  { to: "/qualidade", label: "Qualidade de dados", title: "Qualidade de dados", icon: ShieldCheck },
  { to: "/insights", label: "Insights", title: "Insights", icon: Lightbulb },
  { to: "/noticias", label: "Notícias IBGE", title: "Notícias IBGE", icon: Newspaper },
  { to: "/configuracoes", label: "Configurações", title: "Configurações", icon: Settings },
]

export function datasetById(id: string | undefined) {
  return datasetNav.find((item) => item.to === `/datasets/${id}`)
}
