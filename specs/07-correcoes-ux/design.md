# Etapa 7: Design

## 1. Overlays no card

### Componentes
```
components/overlay/
├── OverlayHost.tsx     # contexto + nó de portal dentro do Card / <main>
├── CardModal.tsx       # modal centralizado no hospedeiro
├── CardMenu.tsx        # menu "⋯" (lista de ações dentro do hospedeiro)
└── overlay-store.ts    # id do overlay aberto (garante um por vez)
```

`Card` passa a ser hospedeiro:
```tsx
<div className="relative isolate overflow-clip rounded-lg border bg-card" data-overlay-host>
  <div ref={contentRef} inert={open || undefined}>{children}</div>
  <div ref={portalRef} className="pointer-events-none absolute inset-0 z-20" />
</div>
```
`<main>` também é envolvido por um `OverlayHost` (fallback para ações do header da página e boas-vindas).

`CardModal`:
```tsx
<FocusScope trapped loop asChild>
  <div className="pointer-events-auto absolute inset-0 grid place-items-center p-3">
    <div className="absolute inset-0 bg-background/80" onClick={close} />   {/* véu só no card, sem blur */}
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}
         className="relative w-full max-w-[min(22rem,100%)] max-h-full overflow-auto rounded-md border bg-popover p-4 shadow-sm">
      <header className="mb-2 flex items-start justify-between gap-2"> título · botão × </header>
      {children}
    </div>
  </div>
</FocusScope>
```
- `FocusScope` e `DismissableLayer` vêm de `@radix-ui/react-focus-scope` e `@radix-ui/react-dismissable-layer` (já presentes como dependências do shadcn).
- `Esc` fecha; o foco retorna ao `triggerRef`.
- Entrada: fade + `scale 0.98 → 1` com os tokens de `lib/motion.ts`; sem animação no Modo leve.
- Migrar para `CardModal`: `GlossaryPopover`, confirmação de estratégia (`AlertDialog`), `UploadDialog`, `WelcomeViewDialog`, opções avançadas e qualquer `Popover`/`Dialog` restante. Ao final, `grep` não deve encontrar `DialogPortal`/`PopoverPortal` fora de `components/ui`.
- KPI card: `min-height: 8.25rem` para o glossário (≤ 25 palavras) caber sem rolagem.

### Tooltips
- Recharts: `<Tooltip allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ maxWidth: 240 }} />`.
- Radix Tooltip: `collisionPadding={8}`, `className="max-w-[16rem]"`.

### Proteção global
Remover qualquer `w-screen`, `100vw` ou largura fixa > 100% em componentes. **Não** usar `overflow-x: hidden` no `body` como correção: o teste R8.1 precisa detectar a causa real.

## 2. Gráficos

### `lib/chart-axes.ts`
```ts
export const YEAR_TICKS = [2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070];
export const YEAR_TICKS_MOBILE = [2000, 2020, 2040, 2060, 2070];
export function niceDomain(values: number[], pad = 0.05): [number, number];   // arredonda para 1-2-5 × 10^n
export function niceTicks([min, max]: [number, number], count = 5): number[];
export function yAxisWidth(ticks: number[], fmt: (n: number) => string): number;  // mede com canvas 2D + fonte do tema
```
Formatação de eixo: `formatAxis(value, metric)` → sempre compacto (nas duas visões).

### `ProjectionLine` (correção)
- Dados em **uma** série por métrica, com `observado` e `projetado` derivados:
  `observado = ano <= anoAtual ? v : null`, `projetado = ano >= anoAtual ? v : null` (o ano atual entra nas duas).
- `<Line dataKey="observado" connectNulls={false} />` e `<Line dataKey="projetado" strokeDasharray="4 4" />`.
- Animação de desenho (Etapa 6): aplicar via `pathLength` em `motion.path` (componente `shape` customizado), nunca manipulando `strokeDasharray` por `ref` (conflita com o tracejado). Com o Modo leve, `motion.path` recebe `initial={false}`.
- `XAxis type="number" domain={[2000, 2070]} ticks={YEAR_TICKS} allowDecimals={false}`.
- `ReferenceLine x={anoAtual} label={{ value: 'Projeção →', position: 'insideTopRight' }}`.
- Marcadores: `ReferenceDot x={ano} y={valorDaSérie}` (lidos dos dados, nunca constantes) com rótulo posicionado por `labelSide(x, domain)`.
- Rótulos diretos: componente `EndLabel` na última posição de cada série, com resolução de colisão vertical.

### `AgeYearHeatmap` (reescrita do render)
```ts
const off = new OffscreenCanvas(years.length, ages.length);    // 71 × 90 (sem a linha 90+)
const img = off.getContext('2d')!.createImageData(71, 90);     // 1 pixel por célula, cor via interpolateRgbBasis(tokens)
ctx.imageSmoothingEnabled = false;
canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
ctx.drawImage(off, 0, 0, w, h);
```
- Eixos, rótulos, linha do "hoje" e legenda em SVG absoluto sobre o canvas.
- Hover: converter as coordenadas do mouse em (ano, idade) e mostrar o tooltip HTML.
- A faixa "90 ou mais" é renderizada como uma barra fina separada acima da matriz, com escala própria e nota.

### Narrativas
- `NarrativeContext` ganha `series: { key, label }[]`. As regras `peak`/`trend` exigem `series.length === 1` ou recebem `seriesKey` explícito.
- Prioridade por tipo de gráfico declarada na spec do gráfico (`narrativePriority: ['crossing', 'trend']`).

### KPI delta
`formatValue(…, kind: 'delta')` retorna **somente o módulo** ("16%", "31,7"); `KpiDelta` renderiza o ícone e o `aria-label` ("queda de 16% em 10 anos").

## 3. Drill down

### Modelo
```ts
type DrillLevel = { id: string; label: string; value?: string | number };
type DrillSpec = {
  hierarchy: 'territorio' | 'tempo' | 'idade' | 'coorte' | 'composicao' | 'custom';
  maxDepth: 1 | 2 | 3;
  levels: Array<{
    render: (ctx: DrillContext) => ReactNode;        // componente do nível
    childOf?: (datum: unknown) => DrillLevel | null; // null = não detalhável
  }>;
  crossFilter?: boolean;                              // true só para território
};
```
- `useDrill(chartId, spec)` → `{ path, depth, push(level), pop(), popTo(i), reset() }`, sincronizado com `d_<chartId>` na URL.
- Cada `ChartSpec` em `dashboards.config.ts` ganha `drill?: DrillSpec`. Se `crossFilter` for `true`, `push` também chama `crossfilter.toggle('uf' | 'regiao', …)` e `pop` limpa a seleção.
- `ChartCard` renderiza `DrillBreadcrumb` + botão "Voltar" no header e o nível atual no corpo; teclado (`Backspace`/`Esc`) via `onKeyDown` no card.
- Transição: `AnimatePresence mode="popLayout"`, com o novo nível entrando com `scale 0.96 → 1` a partir do `transformOrigin` do elemento clicado (guardado em `push`).

### Dados
- Território: `dim_territorio` (já carregado) fornece `regiao_cod` → UFs da região. As regiões usam as linhas com `nivel = 'regiao'`.
- Coorte: a partir da matriz do mapa de calor (`/datasets/ds1/heatmap`), pegar a diagonal `idade + (ano − anoBase)`.
- Ano/composição: `/datasets/{id}/data?anos=<ano>&cod=…` (já existe) ou colunas já presentes no payload de `summary`.
- Sparkline do KPI: série já disponível em `summary.series`; se não houver, `/datasets/{id}/data?cod&metric` com cache.

## 4. Busca removida
Arquivos a remover ou alterar: `CommandPalette` (+ atalho e botão no header), campo "Buscar território" na `FilterBar`, prop/coluna de busca da `DataTable`, input da página de Notícias. Limpar imports, rotas e testes associados.

## 5. Layout sem espaços vazios

### Tokens (`globals.css`)
```
--space-page-x: 1.5rem;  (mobile 1rem)
--space-section: 1.5rem;
--gap-grid: 1rem;        (mobile 0.75rem)
--card-pad: 1.25rem;     (mobile 1rem)
--chart-h-sm: 13.75rem; --chart-h-md: 17.5rem; --chart-h-lg: 21.25rem;
```

### `DashboardGrid` (empacotamento por linhas)
```ts
type GridItem = { id: string; span: 4 | 6 | 8 | 12; height: 'sm' | 'md' | 'lg'; node: ReactNode };
function packRows(items: GridItem[]): GridItem[][];   // greedy: agrupa até somar 12
// O último item de cada linha recebe span = 12 − soma dos anteriores.
// A altura da linha é a maior entre os itens.
```
- Renderiza `<div data-grid-row className="grid grid-cols-12 gap-[--gap-grid] items-stretch">` por linha.
- < 768 px: tudo com span 12. Entre 768 e 1279 px: spans 4/8 viram 6.
- Itens condicionais (ex.: ocultos na visão simplificada) são removidos **antes** do empacotamento, então a linha se refaz sem buracos.
- `ChartCard` usa `flex flex-col h-full`, com o gráfico em `flex-1 min-h-[--chart-h-*]`.

### `KpiRow`
`grid gap-[--gap-grid]` com `grid-template-columns: repeat(n, minmax(0, 1fr))` (n = nº de KPIs), 2 colunas entre 375 e 767 px e 1 coluna < 375 px.

### `FilterBar`
`flex flex-wrap items-end gap-3`; cada controle com `w-auto min-w-[10rem]`; no mobile, `grid grid-cols-2`.

## 6. Sidebar recolhida
```
expandida (w 15rem)               recolhida (w 4rem)
┌───────────────────┐             ┌────┐
│ IBGE              │             │ P  │  ← monograma 32×32, border, rounded-md, font-semibold
│ Projeções         │             ├────┤
│ ▣ Visão geral     │             │ ▣  │  ← ícone 20px em área 40×40, mx-auto
│ ...               │             │ ...│
│            «      │             │ »  │  ← toggle centralizado
└───────────────────┘             └────┘
```
- Item: `flex items-center gap-3 px-3` expandido → `justify-center px-0 w-10 h-10 mx-auto` recolhido.
- Rótulos em `AnimatePresence` (desmontados após a saída), para não deslocar o ícone.
- Pílula ativa: `layoutId="nav-pill"`, mesmo tamanho do item recolhido.
- O bloco de marca tem altura igual à do header da página (`h-14`), para alinhar verticalmente. Crossfade logo ↔ "P" com `duration.base`.
