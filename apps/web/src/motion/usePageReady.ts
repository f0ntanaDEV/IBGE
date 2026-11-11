import { useLayoutEffect, useRef } from "react"
import { useMotionApi } from "@/motion/MotionProvider"

export function usePageReady(ready: boolean) {
  const api = useMotionApi()
  useLayoutEffect(() => {
    api.reportReady(ready)
  }, [api, ready])
}

export function useMotionFilters(key: string) {
  const api = useMotionApi()
  const previous = useRef(key)
  useLayoutEffect(() => {
    if (previous.current === key) return
    previous.current = key
    api.bumpUpdate()
  }, [api, key])
}
