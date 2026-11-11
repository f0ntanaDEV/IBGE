import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Footer } from "@/app/layout/Footer"
import { MotionProvider } from "@/motion/MotionProvider"
import { Header } from "@/app/layout/Header"
import { Sidebar } from "@/app/layout/Sidebar"
import { MobileDrawer } from "@/app/layout/MobileDrawer"

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#conteudo"
        className="absolute top-2 left-2 z-50 -translate-y-16 bg-background px-3 py-2 focus:translate-y-0"
      >
        Ir para o conteúdo
      </a>
      {mobile ? null : (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border md:flex">
          <Sidebar />
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main id="conteudo" className="page-pad min-w-0 flex-1">
          <MotionProvider>
            <Outlet />
          </MotionProvider>
        </main>
        <Footer />
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </MobileDrawer>
    </div>
  )
}
