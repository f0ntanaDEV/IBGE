import { toast } from "sonner"
import { PageHeader } from "@/components/common/PageHeader"
import { usePreferences, type Density, type ThemeChoice } from "@/stores/preferences"

export function SettingsPage() {
  const theme = usePreferences((state) => state.theme)
  const density = usePreferences((state) => state.density)
  const setTheme = usePreferences((state) => state.setTheme)
  const setDensity = usePreferences((state) => state.setDensity)

  return (
    <div className="page-stack">
      <PageHeader title="Configurações" description="Tema e densidade da interface." />
      <fieldset className="grid gap-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Tema</legend>
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
        <legend className="px-1 text-sm font-medium">Densidade</legend>
        {(
          [
            ["comfortable", "Confortável"],
            ["compact", "Compacta"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="density"
              value={value}
              checked={density === value}
              onChange={() => {
                setDensity(value as Density)
                toast("Densidade atualizada")
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </div>
  )
}
