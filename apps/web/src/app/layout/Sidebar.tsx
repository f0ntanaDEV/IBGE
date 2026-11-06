import { NavLink, useLocation } from "react-router-dom"
import { mainNav } from "@/app/navigation"
import { cn } from "@/lib/cn"

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { search } = useLocation()

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-3 py-4">
        <p className="text-xs text-muted-foreground">IBGE</p>
        <p className="text-sm font-medium">Projeções</p>
      </div>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={{ pathname: item.to, search }}
            end={item.end}
            title={item.title}
            onClick={onNavigate}
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                isActive && "bg-muted font-medium",
                !isActive && "hover:bg-muted",
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
