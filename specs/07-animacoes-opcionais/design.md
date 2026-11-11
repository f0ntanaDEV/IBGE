# Spec 14: Design

## 1. Estrutura
```
apps/web/src/motion/                 # camada isolada; removível apagando a pasta e os wrappers
├── tokens.ts            # durações e curvas
├── MotionProvider.tsx   # estado on/off + relógio da página (startedAt) + flag de emergência
├── usePageReady.ts      # páginas registram as queries essenciais
├── useMotion.ts         # { enabled, groupStart, duration, phase }
├── Reveal.tsx           # wrapper de fade-in ao rolar (grupo por quadro)
├── CountUp.tsx          # número animado (usa formatValue)
├── WordReveal.tsx       # texto palavra por palavra (modo Simples)
├── chartMotion.ts       # props do Recharts a partir do grupo
├── MotionBoundary.tsx   # ErrorBoundary → versão estática
└── motion.css           # keyframes e estados, todos sob [data-motion="on"]
```
Componentes existentes só ganham wrappers (`<Reveal>`, `<CountUp>`) ou espalham `{...chartMotion(group)}` nas séries. Nenhuma lógica de dados muda.

## 2. Tokens e CSS
```ts
export const MOTION = { page: 800, reveal: 500, update: 400, word: 100, readyTimeout: 1200,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)' } as const;
```
```css
/* a regra global atual vira condicional */
html:not([data-motion="on"]) *, html:not([data-motion="on"]) *::before, html:not([data-motion="on"]) *::after {
  animation: none !important; transition: none !important;
}
@media print { [data-anim] { opacity: 1 !important; transform: none !important; clip-path: none !important; } }

[data-motion="on"] [data-anim-state="pending"] { opacity: 0; transform: translateY(8px); }
[data-motion="on"] [data-anim-state="run"] {
  animation: motion-fade-up var(--anim-duration) var(--anim-ease) var(--anim-delay, 0ms) both;
}
@keyframes motion-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes motion-sweep { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes motion-grow-x-left  { from { transform: scaleX(0); transform-origin: right; } to { transform: scaleX(1); transform-origin: right; } }
@keyframes motion-grow-x-right { from { transform: scaleX(0); transform-origin: left; }  to { transform: scaleX(1); transform-origin: left; } }
@keyframes motion-pop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
```
- Desligado: nenhum elemento recebe `data-anim-state` (P1), então nada fica oculto.
- `--anim-duration`, `--anim-ease` e `--anim-delay` são definidos inline pelo grupo.

## 3. Relógio e grupos
```ts
type Group = { id: string; start: number; duration: number };  // start = performance.now()
// MotionProvider:
//  - page group: criado quando usePageReady resolve (ou timeout); id 'page'
//  - reveal groups: Reveal registra no IntersectionObserver; todas as entradas do mesmo callback
//    formam um grupo com o mesmo start (performance.now() do callback)
//  - update group: criado quando a query key dos filtros muda; id 'update-<n>'
```
- `useMotion(target)` devolve `{ animate, delayMs, durationMs }`, onde `delayMs = group.start − now` (≥ 0), para que todos usem o **mesmo instante absoluto**.
- Elementos montados depois que o grupo terminou recebem `animate: false`.
- Primeira dobra: `Reveal` verifica no mount se o elemento já intersecta o viewport; se sim, entra no grupo `page`, senão fica `pending` até o observer disparar.

## 4. Contagem
```ts
export function countUpStart(v: number): number | null {
  if (!Number.isFinite(v)) return null;
  if (Number.isInteger(v)) return 0;
  if (Math.abs(v) < 0.1) return null;     // não anima
  return v < 0 ? -0.1 : 0.1;
}
export function decimalsOf(v: number, metric: MetricMeta): number;   // do dicionário (casas_decimais)
```
- `useCountUp(value, { group, isFirst })`: rAF, `t = clamp((now − start)/duration)`, `easeOutExpo`; valor exibido = `from + (to − from) × ease(t)`; inteiros com `Math.round`; decimais com as casas do dicionário.
- `isFirst` vem de um `Set` de chaves já exibidas na visita à página (KPI/métrica/território). Na primeira vez, `from = countUpStart(value)`; nas seguintes, `from = valor anterior`.
- `CountUp` renderiza `<span aria-hidden className="tabular-nums" style={{ minWidth: ch(final) }}>{formatValue(atual)}</span><span className="sr-only" aria-live="polite">{formatValue(final)}</span>`.
- Desligado (ou `countUpStart` nulo) → retorna o valor final, sem rAF.

## 5. Gráficos
```ts
export function chartMotion(m: { animate: boolean; delayMs: number; durationMs: number }) {
  return m.animate
    ? { isAnimationActive: true, animationBegin: m.delayMs, animationDuration: m.durationMs, animationEasing: 'ease-out' as const }
    : { isAnimationActive: false };
}
```
- Aplicar em `Line`, `Area`, `Bar` e `Scatter` de todos os gráficos Recharts. Remover qualquer `strokeDasharray` animado por `ref` que ainda exista (a série projetada mantém o tracejado estático; a animação nativa do Recharts usa `stroke-dashoffset` internamente e preserva o tracejado nas versões atuais. Validar com o teste de estado final; se o tracejado quebrar, desligar a animação **só da série projetada** e aplicar nela um fade no fim da janela).
- Marcadores, rótulos e linhas de referência: wrapper `<g data-anim="pop|fade">` com `animation-delay` = `delayMs + 0,8 × durationMs` e duração de `0,2 × durationMs`.
- SVG/canvas próprios:
  - Pirâmide: `<g>` dos homens com `motion-grow-x-left` e das mulheres com `motion-grow-x-right` (origem no eixo central);
  - Mapa de calor e Composição 100%: container com `motion-sweep`; a linha do ano atual com fade quando a varredura chega à sua posição (`delay = delayMs + durationMs × (anoAtual − 2000)/70`);
  - Mapa por UF: `fill` com `transition` (`durationMs`) do tom neutro à cor final e o mapa com escala 0,98 → 1.
- Tudo dentro de `<MotionBoundary fallback={<ChartStatic/>}>`.

## 6. Palavra por palavra
```tsx
function WordReveal({ text, group }: Props) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);   // preserva os espaços
  const [shown, setShown] = useState(enabled ? 0 : words.length);
  // setInterval(MOTION.word) a partir de group.start; ao clicar ou Esc → setShown(words.length)
  return (<p onClick={finish}>
    <span className="sr-only">{text}</span>
    <span aria-hidden>{words.map((w, i) => <span key={i} style={{ opacity: i < shown ? 1 : 0 }}>{w}</span>)}</span>
  </p>);
}
```
- Só no modo Simples **e** com animações ligadas; nos demais casos, renderiza o texto puro.
- Contexto `WordRevealControl` no bloco "Entenda os dados" expõe `finishAll()` para o botão "Mostrar tudo".
- Chave de reinício: hash do texto; se o texto não mudou após o filtro, não reinicia (R6.6).
- `opacity` em `span` inline não altera o layout (R6.3).

## 7. Configurações
- `stores/preferences.ts`: `motion: 'on' | 'off'` (padrão `'off'`).
- Script anti-flash: `document.documentElement.dataset.motion = stored ?? 'off'`.
- `import.meta.env.VITE_MOTION_ENABLED === 'false'` → `MotionProvider` força `off` e a opção some.

## 8. Instrumentação de testes
Em `import.meta.env.MODE === 'test'` ou com `?motion-debug=1`: `window.__motion = { observers: n, groups: [...], log: [{id, start, duration}] }`.
