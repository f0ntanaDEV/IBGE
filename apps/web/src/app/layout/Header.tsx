import { Menu, Monitor, Moon, Sun } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { datasetNav, mainNav } from "@/app/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePreferences, type ThemeChoice } from "@/stores/preferences"

type HeaderProps = {
  onOpenMenu: () => void
}

const themeIcon = { light: Sun, dark: Moon, system: Monitor }

export function Header({ onOpenMenu }: HeaderProps) {
  const { pathname, search } = useLocation()
  const setTheme = usePreferences((state) => state.setTheme)
  const choice = usePreferences((state) => state.theme)
  const ThemeIcon = themeIcon[choice]
  const dataset = datasetNav.find((item) => item.to === pathname)
  const page = mainNav.find((item) => item.to === pathname)
  const current = dataset?.title ?? page?.title ?? "Página"
  const crumbs =
    pathname === "/"
      ? [{ label: "Visão geral", to: "/" }]
      : [
          { label: "Visão geral", to: "/" },
          { label: current, to: pathname },
        ]

  return (
    <header className="flex min-h-14 min-w-0 flex-wrap items-center gap-2 border-b border-border px-2 md:px-4">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={onOpenMenu}>
        <Menu />
      </Button>
      <nav aria-label="Trilha" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-sm">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <li key={crumb.to} className="flex min-w-0 items-center gap-2">
                {index > 0 ? <span aria-hidden className="text-muted-foreground">/</span> : null}
                {last ? (
                  <span aria-current="page" className="truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={{ pathname: crumb.to, search }} className="truncate text-muted-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Selecionar tema">
            <ThemeIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={choice} onValueChange={(value: string) => setTheme(value as ThemeChoice)}>
            <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
