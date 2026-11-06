import { create } from "zustand"
import { persist } from "zustand/middleware"

export const PREFERENCES_KEY = "ibge-preferences"

export type ThemeChoice = "light" | "dark" | "system"
export type Density = "comfortable" | "compact"

export type PreferenceValues = {
  theme: ThemeChoice
  density: Density
}

export const initialPreferences: PreferenceValues = {
  theme: "system",
  density: "comfortable",
}

type PreferencesState = PreferenceValues & {
  setTheme: (theme: ThemeChoice) => void
  setDensity: (density: Density) => void
}

export function readStoredPreferences(raw: string | null): PreferenceValues {
  if (!raw) return initialPreferences
  try {
    const parsed = JSON.parse(raw) as { state?: Partial<PreferenceValues> }
    const state = parsed.state ?? {}
    return {
      theme: state.theme === "light" || state.theme === "dark" || state.theme === "system" ? state.theme : "system",
      density: state.density === "compact" ? "compact" : "comfortable",
    }
  } catch {
    return initialPreferences
  }
}

function storedNow() {
  if (typeof window === "undefined") return initialPreferences
  return readStoredPreferences(localStorage.getItem(PREFERENCES_KEY))
}

export function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function resolveTheme(theme: ThemeChoice) {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light"
  return theme
}

export function applyDocumentPreferences(state: PreferenceValues) {
  const root = document.documentElement
  const dark = resolveTheme(state.theme) === "dark"
  root.classList.toggle("dark", dark)
  root.dataset.density = state.density
  root.style.colorScheme = dark ? "dark" : "light"
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...storedNow(),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: PREFERENCES_KEY,
      skipHydration: import.meta.env.MODE === "test",
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
      }),
    },
  ),
)
