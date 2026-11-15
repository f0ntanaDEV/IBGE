import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { bottomNav, mainNav, type NavItem } from "@/app/navigation"
import { pickFilters } from "@/features/datasets/search"
import { cn } from "@/lib/cn"

type SidebarProps = {
  collapsed?: boolean
  onNavigate?: () => void
  onToggle?: () => void
}

function itemClass(isActive: boolean) {
  return cn(
    "flex items-center rounded-md py-2 pl-4 pr-3 text-sm",
    isActive && "bg-muted font-medium",
    !isActive && "hover:bg-muted",
  )
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="relative flex h-14 shrink-0 items-center overflow-hidden pl-6">
      <span data-sidebar-mark className={cn("pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2", collapsed ? "opacity-100" : "opacity-0")}>
        <img src="/brand/mark-light.png" alt="" className="size-4 object-contain dark:hidden" />
        <img src="/brand/mark-dark.png" alt="" className="hidden size-4 object-contain dark:block" />
      </span>
      <span data-sidebar-fade className={cn("min-w-0 overflow-hidden", collapsed ? "max-w-0 opacity-0" : "max-w-24 opacity-100")}>
        <img src="/brand/wordmark-light.png" alt="" className="h-4 w-auto dark:hidden" />
        <img src="/brand/wordmark-dark.png" alt="" className="hidden h-4 w-auto dark:block" />
      </span>
      <span className="sr-only">Projeções IBGE</span>
    </div>
  )
}

function NavItems({ items, search, collapsed, onNavigate }: { items: NavItem[]; search: string; collapsed: boolean; onNavigate?: () => void }) {
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
      <span data-sidebar-fade className={cn("overflow-hidden whitespace-nowrap", collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100")}>
        <span className="pl-2">{item.label}</span>
      </span>
    </NavLink>
  ))
}

export function Sidebar({ collapsed = false, onNavigate, onToggle }: SidebarProps) {
  const { search } = useLocation()
  const kept = pickFilters(search)

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <Brand collapsed={collapsed} />
      <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          <NavItems items={mainNav} search={kept} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
        <div className="flex shrink-0 flex-col gap-1 px-2 pb-2">
          <NavItems items={bottomNav} search={kept} collapsed={collapsed} onNavigate={onNavigate} />
          {onToggle ? (
            <button type="button" className={itemClass(false)} aria-pressed={collapsed} aria-label={collapsed ? "Expandir menu" : "Retrair menu"} onClick={onToggle}>
              {collapsed ? <PanelLeftOpen className="size-4 shrink-0" aria-hidden /> : <PanelLeftClose className="size-4 shrink-0" aria-hidden />}
              <span data-sidebar-fade className={cn("overflow-hidden whitespace-nowrap", collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100")}>
                <span className="pl-2">Retrair menu</span>
              </span>
            </button>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
