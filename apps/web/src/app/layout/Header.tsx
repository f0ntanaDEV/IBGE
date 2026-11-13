import { Menu, Monitor, Moon, Search, Sun } from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { bottomNav, mainNav } from "@/app/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { pickFilters } from "@/features/datasets/search"
import { TERRITORIES } from "@/features/datasets/territories"
import { usePreferences, type NavigationMode, type ThemeChoice } from "@/stores/preferences"

type HeaderProps = {
  onOpenMenu: () => void
}

type Hit = {
  id: string
  label: string
  hint: string
  run: () => void
}

const themeIcon = { light: Sun, dark: Moon, system: Monitor }

const modes = [
  ["technical", "Técnico"],
  ["simple", "Simples"],
] as const

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function ModeSwitch() {
  const mode = usePreferences((state) => state.mode)
  const setMode = usePreferences((state) => state.setMode)
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Modo de navegação">
      <span className="mr-1 text-xs text-muted-foreground">Modo</span>
      {modes.map(([value, label]) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            className={active ? "h-8 rounded-md border border-foreground bg-muted px-2.5 text-sm font-medium" : "h-8 rounded-md border border-border px-2.5 text-sm text-muted-foreground"}
            aria-pressed={active}
            onClick={() => setMode(value as NavigationMode)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function NavSearch() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const [, setParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const listId = useId()
  const pages = useMemo(() => [...mainNav, ...bottomNav], [])
  const hits = useMemo(() => {
    const needle = fold(query.trim())
    if (!needle) return []
    const found: Hit[] = []
    for (const page of pages) {
      if (!fold(page.label).includes(needle)) continue
      found.push({
        id: page.to,
        label: page.label,
        hint: "Página",
        run: () => navigate({ pathname: page.to, search: pickFilters(search) }),
      })
    }
    for (const place of TERRITORIES) {
      const name = `${place.local} ${place.sigla}`
      if (!fold(name).includes(needle)) continue
      found.push({
        id: `cod-${place.cod}`,
        label: place.local,
        hint: place.nivel === "uf" ? "UF" : place.nivel === "regiao" ? "Região" : "Território",
        run: () => {
          const next = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
          next.set("cod", String(place.cod))
          setParams(next)
        },
      })
      if (found.length >= 8) break
    }
    return found.slice(0, 8)
  }, [navigate, pages, query, search, setParams])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [])

  const choose = (hit: Hit | undefined) => {
    if (!hit) return
    hit.run()
    setQuery("")
    setOpen(false)
  }

  return (
    <div ref={box} className="relative w-full">
      <label className="relative block">
        <span className="sr-only">Buscar página ou território</span>
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={query}
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Buscar página ou território"
          className="h-8 w-full rounded-md border border-border bg-background pr-3 pl-8 text-sm"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false)
              return
            }
            if (!hits.length) return
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setActive((index) => (index + 1) % hits.length)
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((index) => (index - 1 + hits.length) % hits.length)
            } else if (event.key === "Enter") {
              event.preventDefault()
              choose(hits[active])
            }
          }}
        />
      </label>
      {open && query.trim() && hits.length ? (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-background py-1">
          {hits.map((hit, index) => (
            <li key={hit.id} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={index === active ? "flex w-full items-baseline justify-between gap-3 bg-muted px-3 py-2 text-left text-sm" : "flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm"}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(hit)}
              >
                <span className="truncate">{hit.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{hit.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && query.trim() && !hits.length ? (
        <p className="absolute z-30 mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Nenhum resultado.</p>
      ) : null}
    </div>
  )
}

export function Header({ onOpenMenu }: HeaderProps) {
  const setTheme = usePreferences((state) => state.setTheme)
  const choice = usePreferences((state) => state.theme)
  const ThemeIcon = themeIcon[choice]

  return (
    <header className="relative flex h-12 shrink-0 items-center px-2 md:px-4">
      <Button variant="ghost" size="icon" className="z-10 md:hidden" aria-label="Abrir menu" onClick={onOpenMenu}>
        <Menu />
      </Button>
      <div className="absolute top-1/2 left-1/2 z-20 w-[min(28rem,calc(100%-5.5rem))] -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%-7.5rem)] md:w-[min(28rem,calc(100vw-31.5rem))]">
        <NavSearch />
      </div>
      <div className="z-10 ml-auto flex">
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
      </div>
    </header>
  )
}
