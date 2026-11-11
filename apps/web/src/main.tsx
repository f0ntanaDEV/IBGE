import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import "@fontsource/inter/latin-400.css"
import "@fontsource/inter/latin-500.css"
import "@fontsource/inter/latin-600.css"
import { Providers } from "@/app/providers"
import { router } from "@/app/router"
import "@/styles/globals.css"
import "@/motion/motion.css"

if (import.meta.env.VITE_MOTION_ENABLED === "false") document.documentElement.dataset.motion = "off"

const root = document.getElementById("root")
if (!root) throw new Error("Elemento #root ausente")

createRoot(root).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
