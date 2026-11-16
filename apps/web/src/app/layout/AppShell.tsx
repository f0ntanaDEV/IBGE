import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Footer } from "@/app/layout/Footer"
import { MotionProvider } from "@/motion/MotionProvider"
import { Header } from "@/app/layout/Header"
import { Sidebar } from "@/app/layout/Sidebar"
import { MobileDrawer } from "@/app/layout/MobileDrawer"
import { cn } from "@/lib/cn"
import { usePreferences } from "@/stores/preferences"

function useMaxWidth(max: number) {
  const query = `(max-width: ${max}px)`
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [query])
  return matches
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const mobile = useMaxWidth(767)
  const embedded = useLocation().pathname === "/databricks"
  const collapsed = usePreferences((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = usePreferences((state) => state.setSidebarCollapsed)

  return (
    <div className="flex h-dvh overflow-hidden bg-muted text-foreground">
      <a
        href="#conteudo"
        className="absolute top-2 left-2 z-50 -translate-y-16 bg-background px-3 py-2 focus:translate-y-0"
      >
        Ir para o conteúdo
      </a>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {mobile ? null : (
          <aside data-allow-motion="sidebar" data-collapsed={collapsed ? "true" : "false"} className={cn("hidden h-full shrink-0 overflow-hidden flex-col md:flex", collapsed ? "w-16" : "w-60")}>
            <Sidebar collapsed={collapsed} onToggle={() => setSidebarCollapsed(!collapsed)} />
          </aside>
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          <div className={embedded ? "mx-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background" : "mx-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background p-1"}>
            <main id="conteudo" className={embedded ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" : "page-pad min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"}>
              <MotionProvider>
                <Outlet />
              </MotionProvider>
            </main>
          </div>
          <Footer />
        </div>
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </MobileDrawer>
    </div>
  )
}
