import { useEffect, useState } from "react"
import { YEAR_MAX, YEAR_MIN } from "@/features/datasets/derive"

/** Avança só o ano deste gráfico, a cada 600 ms, até 2070. */
export function YearPlayer({ year, onYear }: { year: number; onYear: (year: number) => void }) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (year >= YEAR_MAX) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(() => onYear(year + 1), 600)
    return () => window.clearTimeout(timer)
  }, [onYear, playing, year])
  return (
    <div className="flex items-center gap-3 text-xs">
      <label className="grid flex-1 gap-1">
        Ano {year}
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={year}
          aria-label="Ano do time-lapse"
          onPointerUp={() => onYear(year)}
          onChange={(event) => {
            setPlaying(false)
            onYear(Number(event.target.value))
          }}
        />
      </label>
      <button type="button" className="h-8 rounded-md border border-border px-3" aria-pressed={playing} onClick={() => setPlaying((current) => !current)}>
        {playing ? "Pausar" : "Reproduzir"}
      </button>
    </div>
  )
}
