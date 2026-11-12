import { Toaster as Sonner } from "sonner"
import "sonner/dist/styles.css"
import { usePreferences } from "@/stores/preferences"

export function Toaster() {
  const theme = usePreferences((state) => state.theme)
  return (
    <Sonner
      theme={theme === "system" ? "system" : theme}
      richColors={false}
      closeButton
      expand
      gap={12}
      offset={16}
      visibleToasts={4}
      position="bottom-left"
      toastOptions={{
        closeButtonAriaLabel: "Fechar aviso",
        style: {
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
        },
      }}
    />
  )
}
