# Etapa 8: Design

## 1. Busca: checklist de remoção
Rodar na raiz e zerar os resultados (exceto `integrations/ibge_news.py`, que usa `busca=` internamente):
```bash
rg -n -i "type=\"search\"|CommandInput|CommandDialog|cmdk|CommandPalette|Buscar|placeholder=\"Digite|useDebounce|searchTerm|onSearch|[?&]q=|\bq:\s|Query\(.*alias=\"q\"" apps/
rg -n "ctrl\+k|meta\+k|'k'.*(metaKey|ctrlKey)" apps/web/src
```
- API: remover `q` dos routers, dos services/repositories, do schema OpenAPI, e regenerar `packages/shared`.

## 2. Modo simplificado: checklist de remoção
```bash
rg -n "view\b|'simple'|visao|data-view|ViewToggle|WelcomeView|onboardingSeen|rotuloSimples|simple:|InShort|Ver dados completos|leiga|lay" apps/web/src
```
- `formatValue(value, metric)`: remover o parâmetro `view` e os ramos compactos que não sejam de eixo (`formatAxis` permanece).
- `glossary.ts`: remover `rotuloSimples` e `analogia`; o `GlossaryEntry` fica com `key`, `kind`, `rotuloTecnico`, `explicacao` e `unidade`.
- `lib/narratives/templates.ts`: manter apenas o registro técnico.
- Remover `tests/simple-mode-leak.test.tsx` e as entradas de `e2e` com a visão simplificada.

## 3. Popover lateral ao card
Remover `components/overlay/*` (`OverlayHost`, `CardModal`, `CardMenu`, `overlay-store`) e o `inert` do `Card`.

```tsx
// components/common/CardPopover.tsx
export function CardPopover({ cardRef, trigger, children, title }: Props) {
  const side = useCardSide(cardRef);                       // 'right' | 'left' | 'bottom'
  return (
    <Popover>
      <PopoverAnchor virtualRef={cardRef} />               {/* âncora = card inteiro */}
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side={side} align="start" sideOffset={8}
        collisionPadding={16} avoidCollisions
        className="w-[min(20rem,var(--radix-popover-content-available-width))] max-h-[var(--radix-popover-content-available-height)] overflow-auto">
        …
      </PopoverContent>
    </Popover>
  );
}
```
```ts
// hooks/useCardSide.ts
const MIN = 280;
function computeSide(card: DOMRect, area: DOMRect): Side {
  const center = card.left + card.width / 2;
  const prefer = center < area.left + area.width / 2 ? 'right' : 'left';
  const space = { right: area.right - card.right - 16, left: card.left - area.left - 16 };
  if (space[prefer] >= MIN) return prefer;
  const other = prefer === 'right' ? 'left' : 'right';
  return space[other] >= MIN ? other : 'bottom';
}
// area = rect do <main> (descontando a sidebar). Recalcula com ResizeObserver(main) + evento da sidebar.
```
- Como `avoidCollisions` do Radix inverte o lado sozinho, passar o lado já resolvido e manter `avoidCollisions` só como proteção.
- Com `side="bottom"`, a largura é igual à do card (`w-[var(--radix-popper-anchor-width)]`).
- `GlossaryPopover` e o menu do card passam a usar `CardPopover`. `UploadDialog`, `AlertDialog` e confirmações voltam ao `Dialog` padrão do shadcn.

## 4. Alturas
```css
:root {
  --card-h-kpi: 7.5rem;
  --card-h-chart: 25rem;
  --card-h-chart-mobile: 20rem;
  --card-h-info: 11rem;
}
```
- `ChartCard`: `h-[--card-h-chart] flex flex-col` → header fixo, corpo `flex-1 min-h-0`, narrativa com `line-clamp-2`.
- Recharts: `ResponsiveContainer width="100%" height="100%"` dentro do corpo.
- `RankingBars`: `barSize = floor((alturaCorpo − eixos) / n − gap)`, com fonte dos rótulos de 11 px e `interval={0}` no `YAxis` (todos os rótulos).
- `BrazilMap`: `projection.fitSize([w, h], featureCollection)` com `w`/`h` medidos por `ResizeObserver`.
- `KpiCard`: `h-[--card-h-kpi]` com 3 linhas fixas (rótulo · valor+unidade · variação, reservada).

## 5. Layouts por página (≥ 1280 px)
Notação: cada linha entre colchetes; números = colunas.

| Página | Linhas |
|---|---|
| Visão Geral | KPIs ×4 · [População 2000–2070 8 · Marcos 4] · [cards de datasets 4 · 4 · 4] · [cards de datasets 6 · 6] · [Fatos confirmados 6 · Últimas do IBGE 6] |
| ds1 | KPIs ×4 · [Pirâmide 8 · Contexto 4] · [Mapa de calor 12] · [Notícias 4 · 4 · 4] · [DataTable 12] |
| ds2 | KPIs ×4 · [Pirâmide 8 · Contexto 4] · [Composição 100% 6 · Comparação 2000/2070 6] · [Notícias 4 · 4 · 4] · [DataTable 12] |
| ds3 | KPIs ×4 · [0–14 e 60+ 8 · Contexto 4] · [Ranking 6 · Mapa 6] · [Slope 6 · Bônus 6] · [Observações finais 12] · [Notícias 4 · 4 · 4] · [DataTable 12] |
| ds4 | KPIs ×4 · [e0 H×M 8 · Contexto 4] · [TFT 6 · TBN×TBM 6] · [Mapa 4 · Dispersão 4 · Slope 4] · [Small multiples 12] · [Barras divergentes 6 · Ranking 6] · [Observações finais 12] · [Notícias 4 · 4 · 4] · [DataTable 12] |
| ds5 | KPIs ×4 · [Sobrevivência lx 8 · Contexto 4] · [nqx 6 · ex 6] · [Observações finais 12] · [Notícias 4 · 4 · 4] · [DataTable 12] |
| Qualidade | KPIs ×4 (linhas, nulos, duplicatas, outliers) · [Antes/depois 8 · Validações 4] · [Nulos por coluna 6 · Histórico 6] |
| Notícias | [cards 4 · 4 · 4] × n, com a última linha completada por `packRows` (R6.3) |
| Configurações | [Aparência 6 · Desempenho 6] |

- "Contexto" = Censo 2022 (quando aplicável) + Fatos do dataset, em um card. A ds5 não tem Censo: usar Fatos + resumo do glossário.
- DataTable e Observações finais têm altura própria (fora do `--card-h-chart`), com 10 linhas por página na tabela.
- `packRows` aceita somente os padrões do R6.2 e emite um erro em desenvolvimento se a configuração gerar outro.

## 6. Timeline de animação da página
```ts
// lib/motion.ts (acréscimos)
export const pageMotion = { duration: 0.7, update: 0.4, ease: ease.out, readyTimeout: 1200 } as const;

// app/PageMotionProvider.tsx
type PageMotion = { startedAt: number | null; phase: 'waiting' | 'running' | 'done'; updateKey: number };
```
- `usePageReady(queries)`: cada página registra as queries essenciais. Quando todas resolvem (ou estoura o `readyTimeout`), o provider grava `startedAt = performance.now()`.
- `usePageAnimation()` → `{ animate: boolean, duration, ease, delay: 0 }`. Componentes montados com `phase === 'done'` recebem `animate: false` (estado final direto).
- Framer Motion: `transition={{ duration, ease, delay: 0 }}` vindo do hook; remover qualquer `staggerChildren`/`delayChildren`/`delay` fixo.
- Recharts: `isAnimationActive={animate}`, `animationBegin={0}`, `animationDuration={duration * 1000}`, `animationEasing="ease-out"`.
- `useCountUp`: duração = `pageMotion.duration` e início sincronizado com `startedAt`.
- Updates (filtro/drill/crossfilter): o provider incrementa `updateKey`, e todos os componentes afetados usam `pageMotion.update`.
- Modo teste: `window.__motionLog` registra `{id, start, duration}` para o teste do R10.2.

## 7. Sidebar recolhida
Renderizar **markups diferentes** por estado, em vez de esconder o rótulo:
```tsx
{collapsed ? (
  <Tooltip><TooltipTrigger asChild>
    <NavLink className="relative mx-auto grid size-10 place-items-center rounded-md">
      {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-md bg-muted" />}
      <Icon className="relative size-5" />
    </NavLink>
  </TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip>
) : ( /* item expandido atual */ )}
```
- `aside` recolhida: `w-16 px-0`; `nav`: `flex flex-col items-center gap-1 px-0`; `overflow-y-auto` com `scrollbar-width: none` / `::-webkit-scrollbar { display: none }` quando recolhida e `scrollbar-gutter: auto`.
- Monograma: `div.h-14.grid.place-items-center > span.size-8.grid.place-items-center.rounded-md.border.font-semibold "P"`.
- Toggle: `mx-auto size-10` no rodapé.
