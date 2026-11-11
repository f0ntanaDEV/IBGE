import { MOTION } from "@/motion/tokens"

export function splitWords(text: string) {
  return text.split(/(\s+)/)
}

export function wordCount(parts: string[]) {
  return parts.filter((part) => part.trim()).length
}

export function shownPartsAt(elapsed: number, parts: string[]) {
  const total = wordCount(parts)
  if (total === 0) return parts.length
  const visible = Math.min(total, Math.floor(Math.max(0, elapsed) / MOTION.word) + 1)
  let seen = 0
  for (let index = 0; index < parts.length; index += 1) {
    if (parts[index]?.trim()) seen += 1
    if (seen >= visible) {
      let end = index + 1
      while (end < parts.length && !parts[end]?.trim()) end += 1
      return end
    }
  }
  return parts.length
}

const done = new Set<string>()

export function resetWordMemory() {
  done.clear()
}

export function wordDone(text: string) {
  return done.has(text)
}

export function markWordDone(text: string) {
  done.add(text)
}
