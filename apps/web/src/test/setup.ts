import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"
import { initialPreferences, usePreferences } from "@/stores/preferences"

const queries = new Map<string, boolean>()

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    get matches() {
      return queries.get(query) ?? false
    },
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  }),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub

window.HTMLElement.prototype.scrollIntoView = () => {}
window.HTMLElement.prototype.hasPointerCapture = () => false
window.HTMLElement.prototype.setPointerCapture = () => {}
window.HTMLElement.prototype.releasePointerCapture = () => {}

export function setMedia(query: string, matches: boolean) {
  queries.set(query, matches)
}

beforeEach(() => {
  queries.clear()
  localStorage.clear()
  document.documentElement.className = ""
  delete document.documentElement.dataset.density
  usePreferences.setState({ ...initialPreferences })
})

afterEach(() => {
  cleanup()
})
