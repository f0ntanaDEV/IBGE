# Etapa 4: Design

## Estado
`stores/preferences.ts` ganha `view: 'full' | 'simple'` (persistido) e `onboardingSeen: boolean`. O hook `useView()` lê a URL primeiro e a store em seguida; trocar de modo atualiza ambos.

## Formatação: `lib/format.ts`
```ts
type MetricKind = 'count' | 'percent' | 'permil' | 'years' | 'rate' | 'index' | 'delta' | 'year' | 'raw';
type MetricMeta = { key: string; kind: MetricKind; unitSimple?: string };   // vem do glossário

export function formatValue(v: number | null, m: MetricMeta, view: View): string;
export function formatCompact(v: number): string;  // regras da tabela R2
```
Implementação do `count` simplificado:
```ts
const parts = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
  .formatToParts(v);                      // 214211951 → "214,2 mi"
// se a parte inteira tiver ≥ 3 dígitos, reformatar com maximumFractionDigits: 0 → "214 mi"
```
`null` → "—" nos dois modos. Eixos e tooltips do Recharts recebem `tickFormatter`/`formatter` via `useFormatter(metric)`, que já considera o modo.

Lint: regra ESLint `no-restricted-syntax` para `toLocaleString`, `toFixed` e `Intl.NumberFormat` fora de `lib/format.ts`.

## Glossário: `features/glossary/glossary.ts`
```ts
type GlossaryEntry = {
  key: string;            // nome normalizado da métrica
  kind: MetricKind;
  rotuloTecnico: string;  // visão completa
  rotuloSimples: string;  // visão simplificada
  explicacao: string;     // ≤ 25 palavras
  analogia?: string;
  unitSimple?: string;    // "anos", "filhos por mulher", "a cada mil"
};
```
Cubra todas as métricas que aparecem em KPIs e gráficos das duas visões. O `GlossaryPopover` é o único componente que exibe explicações.

## Configuração por dashboard
`DashboardSpec` ganha:
```ts
simple: {
  title: string;              // nome amigável (sidebar + header)
  kpis: string[];             // 3 chaves, subconjunto ou métricas derivadas
  charts: SimpleChartSpec[];  // ≤ 2; títulos em forma de pergunta
};
```
Sugestão por dataset:
| ID | Nome amigável | KPIs | Gráficos |
|---|---|---|---|
| ds1 | Quantos somos | população; % crianças; % idosos | pirâmide em faixas amplas; população ao longo do tempo |
| ds2 | Como as idades mudam | maior faixa etária; crianças até 4 anos; pessoas com 80+ | composição 100% em 3 faixas; comparação 2000 × 2070 |
| ds3 | Jovens e idosos | % crianças; % idosos; ano em que idosos superam crianças | linhas crianças × idosos; top 5 UFs mais envelhecidas |
| ds4 | Vida, nascimentos e mortes | quanto vivemos; filhos por mulher; bebês que não chegam a 1 ano (a cada mil) | expectativa de vida H × M; filhos por mulher com a linha "para a população se manter" |
| ds5 | Quanto tempo vivemos | quanto vivemos; quanto mais vive quem chega aos 60; de cada 100 bebês, quantos chegam aos 80 | chance de chegar a cada idade (lx/1000, em "de cada 100") |

## Componentes
- `ViewToggle` (header), `WelcomeViewDialog` (primeira visita), `GlossaryPopover`, `InShortCard` ("Em poucas palavras").
- `ChartCard` decide entre `charts` e `simple.charts` pelo modo; `DataTable` e as ações não são montados no simplificado (não basta escondê-los com CSS, para não vazar valores no DOM).
- Tokens de densidade: `[data-view="simple"]` no `<html>` aumenta `--font-size-base` e o espaçamento entre seções.

## Teste de vazamento (R2.3)
`tests/simple-mode-leak.test.tsx`: para cada rota, renderiza com dados de fixture no modo simplificado, coleta `container.textContent` e todos os atributos `aria-*`/`title`, e aplica:
```
/\d{1,3}(?:\.\d{3})+/     → falha (número com separador de milhar, ex.: 214.211.951 ou 1.284)
/\d{5,}/                  → falha (5+ dígitos seguidos; anos têm 4 e passam)
/\d+,\d{2,}/              → falha (2+ casas decimais)
```
