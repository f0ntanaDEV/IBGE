import { NavLink, useLocation } from "react-router-dom"
import { bottomNav, mainNav, type NavItem } from "@/app/navigation"
import { pickFilters } from "@/features/datasets/search"
import { cn } from "@/lib/cn"

type SidebarProps = {
  onNavigate?: () => void
}

function itemClass(isActive: boolean) {
  return cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
    isActive && "bg-muted font-medium",
    !isActive && "hover:bg-muted",
  )
}

function NavItems({ items, search, onNavigate }: { items: NavItem[]; search: string; onNavigate?: () => void }) {
  return items.map((item) => (
    <NavLink
      key={item.to}
      to={{ pathname: item.to, search }}
      end={item.end}
      title={item.title}
      onClick={onNavigate}
      className={({ isActive }: { isActive: boolean }) => itemClass(isActive)}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </NavLink>
  ))
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { search } = useLocation()
  const kept = pickFilters(search)

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="px-3 py-4">
        <p className="text-xs text-muted-foreground">IBGE</p>
        <p className="text-sm font-medium">Analytics</p>
      </div>
      <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          <NavItems items={mainNav} search={kept} onNavigate={onNavigate} />
        </div>
        <div className="flex shrink-0 flex-col gap-1 px-2 pb-2">
          <NavItems items={bottomNav} search={kept} onNavigate={onNavigate} />
        </div>
      </nav>
    </div>
  )
}
