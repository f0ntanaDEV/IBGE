import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PreferencesSync } from "@/app/providers"
import { setMedia } from "@/test/setup"
import { PREFERENCES_KEY, readStoredPreferences, usePreferences } from "@/stores/preferences"

describe("tema", () => {
  it("aplica claro, escuro e sistema no documento", () => {
    render(<PreferencesSync />)
    act(() => usePreferences.getState().setTheme("dark"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => usePreferences.getState().setTheme("light"))
    expect(document.documentElement.classList.contains("dark")).toBe(false)

    setMedia("(prefers-color-scheme: dark)", true)
    act(() => usePreferences.getState().setTheme("system"))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(readStoredPreferences(localStorage.getItem(PREFERENCES_KEY)).theme).toBe("system")
  })

  it("ignora JSON inválido no armazenamento", () => {
    expect(readStoredPreferences("{")).toEqual({
      theme: "system",
      density: "comfortable",
      contrast: null,
      mode: "technical",
      motion: "off",
    })
  })

  it("desliga animação e transição em qualquer estado", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/globals.css"), "utf8")
    expect(css).toContain("animation: none !important")
    expect(css).toContain("transition: none !important")
    expect(css).toContain("scroll-behavior: auto")
  })
})
