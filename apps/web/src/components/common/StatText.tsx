export function StatText({ text }: { text: string }) {
  if (!text) return null
  return <p className="mt-2 max-w-[46ch] text-sm leading-5 text-muted-foreground">{text}</p>
}
