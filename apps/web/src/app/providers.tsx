import { QueryClientProvider } from "@tanstack/react-query"
import { useEffect, type ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { queryClient } from "@/lib/queryClient"
import { applyDocumentPreferences, usePreferences } from "@/stores/preferences"

export function PreferencesSync() {
  const theme = usePreferences((state) => state.theme)
  const density = usePreferences((state) => state.density)

  applyDocumentPreferences({ theme, density })

  useEffect(() => {
    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyDocumentPreferences(usePreferences.getState())
    themeMedia.addEventListener("change", onChange)
    return () => themeMedia.removeEventListener("change", onChange)
  }, [theme, density])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <PreferencesSync />
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
