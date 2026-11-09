import { create } from "zustand"
import { persist } from "zustand/middleware"

export const PREFERENCES_KEY = "ibge-preferences"

export type ThemeChoice = "light" | "dark" | "system"
export type Density = "comfortable" | "compact"
export type ContrastChoice = "normal" | "high" | null
export type NavigationMode = "technical" | "simple"

export type PreferenceValues = {
  theme: ThemeChoice
  density: Density
  contrast: ContrastChoice
  mode: NavigationMode
}

export const initialPreferences: PreferenceValues = {
  theme: "system",
  density: "comfortable",
  contrast: null,
  mode: "technical",
}

type PreferencesState = PreferenceValues & {
  setTheme: (theme: ThemeChoice) => void
  setDensity: (density: Density) => void
  setContrast: (contrast: ContrastChoice) => void
  setMode: (mode: NavigationMode) => void
}

export function readStoredPreferences(raw: string | null): PreferenceValues {
  if (!raw) return initialPreferences
  try {
    const parsed = JSON.parse(raw) as { state?: Partial<PreferenceValues> }
    const state = parsed.state ?? {}
    const contrast = state.contrast === "high" || state.contrast === "normal" || state.contrast === null ? state.contrast ?? null : null
    return {
      theme: state.theme === "light" || state.theme === "dark" || state.theme === "system" ? state.theme : "system",
      density: state.density === "compact" ? "compact" : "comfortable",
      contrast,
      mode: state.mode === "simple" ? "simple" : "technical",
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

export function systemPrefersContrast() {
  return window.matchMedia("(prefers-contrast: more)").matches
}

export function resolveContrast(contrast: ContrastChoice) {
  if (contrast === "high") return true
  if (contrast === "normal") return false
  return systemPrefersContrast()
}

export function applyDocumentPreferences(state: PreferenceValues) {
  const root = document.documentElement
  const dark = resolveTheme(state.theme) === "dark"
  root.classList.toggle("dark", dark)
  root.dataset.density = state.density
  root.dataset.mode = state.mode
  if (resolveContrast(state.contrast)) root.dataset.contrast = "high"
  else delete root.dataset.contrast
  root.style.colorScheme = dark ? "dark" : "light"
}

export function useMode() {
  return usePreferences((state) => state.mode)
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...storedNow(),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setContrast: (contrast) => set({ contrast }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: PREFERENCES_KEY,
      skipHydration: import.meta.env.MODE === "test",
      partialize: (state) => ({
        theme: state.theme,
        density: state.density,
        contrast: state.contrast,
        mode: state.mode,
      }),
    },
  ),
)
