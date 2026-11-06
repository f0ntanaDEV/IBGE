# Etapa 6: Design

## Tokens de movimento: `lib/motion.ts`
```ts
export const duration = { instant: 0.1, fast: 0.15, base: 0.25, slow: 0.4, draw: 0.9, countMin: 0.4, countMax: 1.2 } as const;
export const ease = {
  out: [0.22, 1, 0.36, 1],        // easeOutQuint: entradas
  inOut: [0.65, 0, 0.35, 1],      // trocas de estado
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),  // count-up
} as const;
export const spring = {
  sidebar: { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 },
  pill:    { type: 'spring', stiffness: 500, damping: 40 },
  gentle:  { type: 'spring', stiffness: 220, damping: 28 },
} as const;
export const stagger = (n: number, each = 0.02, max = 0.4) => (n > 30 ? 0 : Math.min(each, max / n));
```
Variantes reutilizáveis em `lib/motion-variants.ts`: `fadeUp`, `fadeIn`, `collapse`, `chipInOut`, `pageTransition`.

## Controle central
- `useMotionEnabled()` = `!reducedMotion` (store + `prefers-reduced-motion`). Todo componente desta etapa consulta esse hook.
- `MotionConfig reducedMotion={enabled ? 'never' : 'always'}` no provider (substitui o da Etapa 2, porque agora o controle é explícito).
- `useSeenOnce(key)`: `Set` em memória da sessão para animações de entrada únicas (R1.4).

## Count-up: `hooks/useCountUp.ts` + `components/common/AnimatedNumber.tsx`
```ts
function useCountUp(target: number, opts?: { from?: number; duration?: number; startOnView?: boolean }): number;
```
- Usa `requestAnimationFrame` e `ease.expoOut`; a duração é `clamp(0.4, 0.4 + log10(|Δ| + 1) * 0.1, 1.2)`.
- Guarda o último valor exibido em `ref` para animar do anterior para o novo (R3.2); `startOnView` usa `IntersectionObserver`.
- Desligado → retorna `target` imediatamente.

```tsx
<AnimatedNumber value={v} metric={m} />
// <span aria-hidden className="tabular-nums" style={{ minWidth: `${chars}ch` }}>{formatValue(current, m, view)}</span>
// <span className="sr-only" aria-live="polite">{formatValue(v, m, view)}</span>
```
`chars` é calculado com o valor final formatado, para reservar a largura.

## Sidebar
```
<motion.aside layout transition={spring.sidebar} data-collapsed>
  <nav> item → <motion.span layoutId="nav-pill" transition={spring.pill}/> (só no ativo)
         rótulo → <AnimatePresence> fadeUp com stagger
```
O `main` usa `layout` para acompanhar. Mobile: Radix Sheet trocado por `motion.div` com `drag="x"`, `dragConstraints`, e fechamento se `offset.x < -80` ou `velocity.x < -500`. O overlay tem `opacity` derivada de `useTransform(x)`.

## Gráficos
| Animação | Técnica |
|---|---|
| Pirâmide (R4.1) | Barras SVG próprias (substituem o BarChart do Recharts na pirâmide) com `motion.rect` e `scaleX` a partir do eixo central (`originX` no centro). O morph entre anos usa `animate` nos valores; o play percorre os anos com `useInterval` de 140 ms. |
| Linhas (R4.2) | `pathLength` 0 → 1 do Framer Motion em `motion.path`. No Recharts, `Line` com `dot={false}` customizado e `strokeDasharray` animado via `ref`; o projetado tem `delay = draw + 0,15`. |
| Marcos (R4.3) | `ReferenceDot` customizado: `motion.g` com `y: -8 → 0`; anel com `scale 1 → 2,2` e `opacity 0,4 → 0` uma única vez. |
| Mapa (R4.4) | `motion.path` por UF com `delay = norm(lat) * 0.4`; troca de cor via transição de `fill`. |
| Dispersão (R4.5) | `motion.circle` com `animate={{ cx, cy, r }}` e `spring.gentle`; rastro = `polyline` com opacidade decrescente. |
| Filtros cruzados (R4.6) | `fill-opacity` animado; não selecionados com `delay: 0.15`. |

## Expandir (R4.7)
`ChartCard` e `ChartDialog` compartilham `layoutId={'chart-' + id}`. O dialog usa um overlay próprio (`motion.div`) para a transição de layout funcionar e mantém o foco e o `Esc` da Etapa 5.

## Tema (R4.8)
```ts
if (!enabled || !document.startViewTransition) { setTheme(next); return; }
const t = document.startViewTransition(() => setTheme(next));
t.ready.then(() => document.documentElement.animate(
  { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
  { duration: 450, easing: 'cubic-bezier(0.22,1,0.36,1)', pseudoElement: '::view-transition-new(root)' }));
```

## Páginas e visão (R4.11, R4.12)
- `AnimatePresence mode="wait"` no `Outlet` com a variante `pageTransition`.
- KPIs com `layoutId={'kpi-' + metricKey}`, envolvidos em `LayoutGroup` no AppShell.
- Troca de visão: `LayoutGroup` + `AnimatePresence` nos blocos condicionais; `AnimatedNumber` faz o morph naturalmente porque o formato muda junto com o valor exibido.

## Página `/dev/motion`
Rota carregada só com `import.meta.env.DEV`. Lista cada animação com "Repetir" e um seletor de velocidade (multiplica os tokens via contexto `MotionSpeedContext`).
