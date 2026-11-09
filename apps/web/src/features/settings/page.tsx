import { toast } from "sonner"
import { PageHeader } from "@/components/common/PageHeader"
import { usePreferences, type ThemeChoice } from "@/stores/preferences"

export function SettingsPage() {
  const theme = usePreferences((state) => state.theme)
  const contrast = usePreferences((state) => state.contrast)
  const mode = usePreferences((state) => state.mode)
  const setTheme = usePreferences((state) => state.setTheme)
  const setContrast = usePreferences((state) => state.setContrast)
  const setMode = usePreferences((state) => state.setMode)
  const high = contrast === "high"

  return (
    <div className="page-stack">
      <PageHeader title="Configurações" description="Aparência, acessibilidade e modo de navegação." />
      <div className="grid gap-4 xl:grid-cols-2">
        <fieldset className="grid gap-2 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">Aparência</legend>
          {(
            [
              ["light", "Claro"],
              ["dark", "Escuro"],
              ["system", "Sistema"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => {
                  setTheme(value as ThemeChoice)
                  toast("Tema atualizado")
                }}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="grid gap-2 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">Acessibilidade</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={high}
              onChange={() => {
                setContrast(high ? "normal" : "high")
                toast("Contraste atualizado")
              }}
            />
            Alto contraste
          </label>
        </fieldset>
      </div>
      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Modo de navegação</legend>
        <div className="flex gap-2" role="group" aria-label="Modo de navegação">
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm" aria-pressed={mode === "technical"} onClick={() => setMode("technical")}>
            Técnico
          </button>
          <button type="button" className="h-9 rounded-md border border-border px-3 text-sm" aria-pressed={mode === "simple"} onClick={() => setMode("simple")}>
            Simples
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Técnico mostra gráficos, tabelas e números exatos.</p>
        <p className="text-sm text-muted-foreground">Simples mostra os mesmos filtros e indicadores em frases curtas, sem gráficos.</p>
      </fieldset>
    </div>
  )
}
