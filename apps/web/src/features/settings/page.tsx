import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ModeSwitch } from "@/app/layout/Header"
import { PageHeader } from "@/components/common/PageHeader"
import { motionEmergency } from "@/motion/tokens"
import { usePreferences, type ThemeChoice } from "@/stores/preferences"

export function SettingsPage() {
  const theme = usePreferences((state) => state.theme)
  const contrast = usePreferences((state) => state.contrast)
  const setTheme = usePreferences((state) => state.setTheme)
  const setContrast = usePreferences((state) => state.setContrast)
  const motion = usePreferences((state) => state.motion)
  const setMotion = usePreferences((state) => state.setMotion)
  const high = contrast === "high"
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

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
          {motionEmergency() ? null : (
            <label className="grid gap-1 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={motion === "on"}
                  onChange={() => {
                    setMotion(motion === "on" ? "off" : "on")
                    toast(motion === "on" ? "Animações desligadas" : "Animações ligadas")
                  }}
                />
                Animações
              </span>
              <span className="text-muted-foreground">Números contam, gráficos se desenham e o conteúdo aparece ao rolar a página</span>
              {reduced ? <span className="text-muted-foreground">Seu sistema pede menos movimento</span> : null}
            </label>
          )}
        </fieldset>
      </div>
      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Modo de navegação</legend>
        <ModeSwitch />
        <p className="text-sm text-muted-foreground">Técnico mostra gráficos, tabelas e números exatos.</p>
        <p className="text-sm text-muted-foreground">Simples mostra os mesmos filtros e indicadores em frases curtas, sem gráficos.</p>
      </fieldset>
    </div>
  )
}
