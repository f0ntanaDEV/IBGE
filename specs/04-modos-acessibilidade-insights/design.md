# Spec 10: Design

## 1. Preferências
`stores/preferences.ts`:
```ts
type Prefs = {
  theme: 'light' | 'dark' | 'system';
  contrast: 'normal' | 'high' | null;   // null = segue prefers-contrast
  mode: 'technical' | 'simple';         // padrão 'technical'
};
```
- Script anti-flash no `index.html`: além de `.dark`, aplica `data-contrast="high"` (quando `contrast === 'high'`, ou quando é `null` e `matchMedia('(prefers-contrast: more)')` corresponde).
- `useMode()` retorna `mode`; `<html data-mode="simple|technical">` para CSS eventual.

## 2. Alto contraste: tokens
`globals.css`, blocos adicionais (os valores são ponto de partida; validar com axe e ajustar até passar):
```css
:root[data-contrast="high"] {
  --background: 0 0% 100%;  --foreground: 0 0% 0%;
  --muted-foreground: 0 0% 15%;  --border: 0 0% 0%;  --ring: 220 100% 30%;
  --primary: 220 100% 28%;  --card: 0 0% 100%;
  --hc-chart-1: #000000; --hc-chart-2: #0039A6; --hc-chart-3: #8A2B00;
  --hc-chart-4: #00663D; --hc-chart-5: #5B0A91; --hc-chart-6: #4D4D4D;
  --border-width: 2px; --focus-width: 3px;
}
.dark[data-contrast="high"] {
  --background: 0 0% 0%;  --foreground: 0 0% 100%;
  --muted-foreground: 0 0% 88%;  --border: 0 0% 100%;  --ring: 50 100% 60%;
  --primary: 50 100% 60%;  --card: 0 0% 0%;
  --hc-chart-1: #FFFFFF; --hc-chart-2: #FFD400; --hc-chart-3: #5CE1FF;
  --hc-chart-4: #FF9EC7; --hc-chart-5: #9CFF8A; --hc-chart-6: #C8C8C8;
}
[data-contrast="high"] a { text-decoration: underline; text-underline-offset: 2px; }
[data-contrast="high"] :focus-visible { outline: var(--focus-width) solid hsl(var(--ring)); outline-offset: 2px; }
[data-contrast="high"] .border, [data-contrast="high"] [data-card] { border-width: var(--border-width); }
@media (forced-colors: active) { svg [data-series] { stroke: CanvasText; } :focus-visible { outline: 3px solid Highlight; } }
```
- `useChartTheme()` retorna, com alto contraste: `colors = --hc-chart-*`, `strokeWidth = 2.5`, `dash = ['0', '6 4', '2 3', '10 4 2 4']` por índice de série, `markers = ['circle', 'square', 'triangle', 'diamond']`. Todos os gráficos já consomem esse hook; adicionar `strokeDasharray` e `dot` customizados por série.
- Mapa de calor e mapa coroplético: `scaleQuantize` com 5 classes monocromáticas no alto contraste (em vez de interpolação).
- Remover usos de `opacity-*`, `text-muted-foreground/60` e similares quando `data-contrast="high"`, com uma variante Tailwind `hc:` (`addVariant('hc', '[data-contrast="high"] &')`).

## 3. Formatação
```ts
type Mode = 'technical' | 'simple';
type MetricKind = 'count' | 'percent' | 'permil' | 'years' | 'rate' | 'index' | 'delta' | 'year' | 'raw';
export function formatValue(v: number | null, m: MetricMeta, mode: Mode = 'technical'): string;
```
- `kind: 'year'` → `String(Math.trunc(v))`, nos dois modos. Inferido para chaves `ano`, `year`, `ano_*` e marcos.
- Modo simples (tabela do R2.3): `count` via `Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })`, refazendo com 0 casas quando a parte inteira tiver 3 dígitos ou mais; `percent` com 0 casas; `permil` → "`N` a cada mil"; `years` com 0 casas + " anos"; `rate` com 1 casa.
- `formatAxis` para eixo de anos usa o formatador `year` (corrige "2.000" nos eixos).
- `DataTable`: colunas com `kind: 'year'` usam o mesmo formatador.
- Teste unitário com cada linha da tabela R2.3 e com 2000/2026/2070.

## 4. Modo Simples
```
features/simple/
├── SimplePage.tsx           # cabeçalho + filtros (território, ano) + KpiRow + UnderstandBlock
├── UnderstandBlock.tsx      # card 12 colunas; índice de âncoras; seções <section id>
├── categories/              # uma função por categoria: (ctx) => { title, paragraphs[] } | null
│   ├── whatItShows.ts  today.ts  in2000.ts  in2070.ts  sexes.ts
│   ├── territories.ts  facts.ts  dailyLife.ts  news.ts
└── simpleTemplates.ts       # textos fixos por página (whatItShows, dailyLife)
```
- Cada rota de dados faz `mode === 'simple' ? <SimplePage pageId=… /> : <TechnicalPage …/>`. Os componentes de gráfico **não são montados** no modo Simples (nem com CSS oculto).
- As categorias usam os dados de `/summary` e `/facts` já em cache e o motor de narrativas com `register: 'simple'`.
- Layout do bloco: em ≥ 1280 px, índice em coluna lateral fixa (3 de 12 colunas internas) e texto em 9; abaixo disso, o índice fica no topo. Largura de leitura máxima de `72ch`.
- Exemplo de saída (Visão Geral, Brasil, 2026):
  - **Como está hoje**: "O Brasil tem 214 mi de pessoas em 2026. Em média, as pessoas vivem 77 anos. Cada mulher tem, em média, 1,5 filho."
  - **Para onde vamos**: "A população cresce até 2041, quando chega a 220 mi. Depois começa a diminuir e chega a 199 mi em 2070."

## 5. Fatos (frontend)
- `features/facts/FactsCard.tsx`: card 12 colunas; lista de uma coluna com 6 a 10 linhas; cada linha traz rótulo, valor (`tabular-nums`) e referência opcional na mesma linha. O modo Simples reutiliza `FactList`.
- `useFacts(pageId)`:
  ```ts
  const territory = useFilters().cod;                    // pode ser UF
  const factsCod = useLastValidFactsCod(territory);      // 0..5; se UF, mantém o último válido (inicial 0)
  return useQuery(['facts', pageId, factsCod], () => api.facts(pageId, factsCod));
  ```
- Nota no header do card: "Fatos de: {nome do território de factsCod}". Quando o território atual é uma UF, acrescenta "(fatos disponíveis para Brasil e regiões)".
- Layouts técnicos (≥ 1280 px), atualizando os vigentes:

| Página | Linhas |
|---|---|
| Visão Geral | KPIs ×4 · [População 8 · Censo 2022 4] · [Fatos 12] · demais linhas vigentes |
| ds1 | KPIs ×4 · [Pirâmide 8 · Censo 2022 4] · [Fatos 12] · [Mapa de calor 12] · … |
| ds2 | KPIs ×4 · [Pirâmide 12] · [Fatos 12] · [Composição 6 · Comparação 6] · … |
| ds3 | KPIs ×4 · [0–14 e 60+ 8 · Censo 2022 4] · [Fatos 12] · … |
| ds4 | KPIs ×4 · [e0 H×M 8 · Censo 2022 4] · [Fatos 12] · … |
| ds5 | KPIs ×4 · [Sobrevivência 12] · [Fatos 12] · … |
| Qualidade | KPIs ×4 · [Fatos 12] · [Antes/depois 8 · Validações 4] · … |

O card Fatos tem altura automática (é exceção ao `--card-h-chart`), mas nada pode sair dele.

## 6. Backend

### Relatório de qualidade (contrato)
```python
class StepCount(BaseModel): before: int; after: int
class NullsReport(BaseModel):
    by_column: dict[str, StepCount]; structural: dict[str, int]; total_imputed: int
class DuplicatesReport(BaseModel): exact: int; by_key: int
class OutliersReport(BaseModel): by_column: dict[str, int]; by_reason: dict[str, int]; strategy: str; method: str
class Validation(BaseModel): rule: str; ok: bool; max_diff: float
class QualityReport(BaseModel):
    dataset_id: str; source: Literal['original', 'sujo', 'upload']; run_id: int
    started_at: datetime; finished_at: datetime; duration_s: float
    rows_in: int; rows_out: int; dropped_columns: list[str]
    nulls: NullsReport; duplicates: DuplicatesReport; outliers: OutliersReport
    validations: list[Validation]
```
- `report_json` gravado como coluna `JSON` e lido com `QualityReport.model_validate(...)`. O endpoint declara `response_model=QualityReport | None`.
- `GET /datasets/{id}/quality-report?source=original|sujo` (padrão `original`).
- Semeadura: `app/core/startup.py` → se `settings.AUTO_SEED` e `etl_runs` não tem nenhum `success`, roda o pipeline para `ds1..ds5 × {original, sujo}` em uma tarefa de fundo, com log de progresso. O `/health` expõe `seeding: true|false`; enquanto for `true`, o frontend mostra "Processando bases…" na Qualidade.
- `Makefile`: `seed: docker compose exec api python -m app.tools.seed`.

### Território
- Dependência comum `territory_params(cod: int | None = Query(None, ge=0))`, com validação contra `dim_territorio` (retorna 422 se o código não existir).
- Revisar com `rg -n "if not cod|cod or|if cod\b" apps/api` e substituir por `is None`.
- Frontend: `rg -n "cod \|\||cod &&|if \(cod\)|!cod\b|filter\(Boolean\)" apps/web/src`. O helper de query string deve remover apenas `undefined` e `null`.

### Fatos
```
services/facts/
├── registry.py      # FACTS: dict[page, list[FactDef]]
├── common.py        # helpers: serie(cod, col), primeiro_ano_em_que(cond), ufs_do_territorio(cod)
├── overview.py  ds1.py  ds2.py  ds3.py  ds4.py  ds5.py  quality.py
api/v1/facts.py      # GET /facts?page&cod
```
```python
class Fact(BaseModel):
    id: str; label: str
    value: float | int | str          # str só para faixas ("40–44") e siglas
    kind: Literal['count', 'percent', 'permil', 'years', 'rate', 'index', 'year', 'raw']
    detail: str | None = None         # ex.: "2000: 3.423.475 → 2026: 2.386.874"
    reference_year: int | None = None
```
- `detail` com valores numéricos é composto no frontend a partir de `detail_values: list[{ano, valor, kind}]`, para que o modo Simples também compacte esses números. Usar `detail_values` em vez de `detail` quando houver números.
- Testes golden: `tests/facts/test_golden.py` parametrizado com as tabelas de `conteudo/fatos.md` (Brasil e Nordeste), com tolerância de ±0,01 em decimais e exatidão em inteiros e anos.

## 7. Insights
- `apps/web/src/content/insights.ts`:
  ```ts
  export type InsightSection = { pageId: string; title: string; route: string; items: { q: string; a: string[] }[] };
  export const INSIGHTS: InsightSection[];      // transcrito de conteudo/insights.md (parágrafos preservados)
  export const PATTERNS: { title: string; text: string }[];   // de conteudo/padroes.md
  ```
- `features/insights/InsightsPage.tsx`: índice + seções; `article` por pergunta com `h3` e `p` (máx. `72ch`); link "Ir para a página".
- Teste das linhas: `const lines = Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))`, que deve ficar entre 7 e 12 em 1280 px com a fonte padrão. Se alguma resposta falhar só por diferença de fonte, ajuste o `max-width` (entre 64ch e 76ch) para todas, nunca o texto.

## 8. Rodapé, favicon e notícias
- `Footer`: `flex items-center justify-between gap-4 border-t px-[--space-page-x] py-3 text-sm`; à esquerda o status da API, à direita `<a href="https://github.com/f0ntanaDEV" …>@f0ntanaDEV <ArrowUpRight className="size-3.5" /></a>`.
- `index.html`:
  ```html
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#334155">
  ```
  Copiar `assets/favicon/*` para `apps/web/public/`.
- `NewsCard`: `flex h-full flex-col` → conteúdo → `<div className="mt-auto flex justify-end pt-3"><a>Ler notícia <ArrowUpRight/></a></div>`. A lista usa `grid items-stretch`.
