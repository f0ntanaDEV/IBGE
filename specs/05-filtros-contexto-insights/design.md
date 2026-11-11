# Spec 11: Design

## 1. Filtro de território
### Hook único
```ts
// hooks/useTerritory.ts
export function useTerritory() {
  const [params, setParams] = useSearchParams();
  const { byCod } = useTerritories();                  // dim_territorio em cache (staleTime: Infinity)
  const raw = params.get('cod');
  const parsed = raw === null ? 0 : Number(raw);
  const valid = Number.isInteger(parsed) && byCod.has(parsed);
  const cod = valid ? parsed : 0;
  useEffect(() => { if (raw !== null && !valid) { toast('Território inválido, exibindo Brasil'); setCod(0); } }, [raw, valid]);

  function setCod(next: number) {
    setParams(p => {
      p.set('cod', String(next));                       // inclusive '0'
      ['sel_uf', 'sel_regiao'].forEach(k => p.delete(k));
      [...p.keys()].filter(k => k.startsWith('d_') && TERRITORIAL_DRILLS.has(k.slice(2))).forEach(k => p.delete(k));
      return p;
    }, { replace: false });                             // histórico permite voltar/avançar
  }
  return { cod, territory: byCod.get(cod)!, setCod };
}
```
- Proibido ler `cod` de outra fonte (store, contexto local). Remover duplicações encontradas com `rg -n "cod" apps/web/src/stores apps/web/src/features | rg -v useTerritory`.
- `TerritorySelect`: `Select` (shadcn) com `SelectGroup` × 3; `value={String(cod)}`; `onValueChange={v => setCod(Number(v))}`.
- Links da sidebar: `to={{ pathname, search: pick(params, ['cod', 'ano']) }}`.
- Query keys: todas incluem `cod` (e `ano`/`sexo` quando usados), inclusive o card Contexto.

### UFs exibidas nos gráficos por UF
```ts
function ufsForScope(cod: number, dim: Territory[]): { ufs: number[]; highlight?: number } {
  if (cod === 0) return { ufs: allUfs(dim) };
  if (cod <= 5) return { ufs: ufsOfRegion(cod, dim) };
  return { ufs: ufsOfRegion(regionOf(cod, dim), dim), highlight: cod };
}
```
O `BrazilMap` usa `fitSize` na `FeatureCollection` filtrada pelas `ufs` (enquadramento regional).

### Linha de referência do Brasil
Gráficos de série com `refBrazil: true` na spec recebem a série do Brasil quando `cod !== 0`. Ela é desenhada em `--muted-foreground`, tracejado `2 3` e com rótulo direto "Brasil"; no alto contraste, usa a paleta de alto contraste.

### Testes
- `e2e/territory.spec.ts`: gera os casos do R1.9 por página × modo.
- `apps/api/tests/test_territory_all_codes.py`: `@pytest.mark.parametrize('cod', ALL_33)` × endpoints.

## 2. Contexto
### API
```
services/context/
├── registry.py          # CONTEXT: dict[page, list[ContextDef]]
├── overview.py  ds1.py  ds2.py  ds3.py  ds4.py  ds5.py
api/v1/context.py        # GET /context?page&cod&ano&sexo
```
```python
class ContextItem(BaseModel):
    id: str; label: str
    value: float | int | str
    kind: Literal['count', 'percent', 'permil', 'years', 'rate', 'index', 'year', 'raw', 'ratio']
    note: str | None = None                 # interpretação curta; números dentro dela via note_values
    note_values: list[dict] | None = None   # [{"key": "a", "value": 3, "kind": "raw"}] → frontend formata
    chart_id: str                           # id do ChartSpec relacionado
    chart_label: str                        # nome exibido no chip
```
- `ContextDef` declara `requires_non_brazil: bool` e `alternative_id` (R2.5).
- Censo: `ContextDef` com `optional=True`; se `get_censo_2022(cod)` falhar, o item é omitido.
- Cache por `(page, cod, ano, sexo)` até o próximo ETL.

### Frontend
```tsx
<ChartCard title="Contexto" className="h-[--card-h-chart]">
  <ul className="flex h-full flex-col divide-y overflow-y-auto">
    {items.map(i => (
      <li key={i.id} className="py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">{i.label}</span>
          <span className="font-semibold tabular-nums">{formatValue(i.value, meta(i), mode)}</span>
        </div>
        {i.note && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{renderNote(i, mode)}</p>}
        <button className="mt-1 text-xs underline-offset-2 hover:underline" onClick={() => focusChart(i.chart_id)}>
          Ver no gráfico: {i.chart_label}
        </button>
      </li>
    ))}
  </ul>
</ChartCard>
```
`focusChart(id)`: `document.querySelector('[data-chart-id="…"]')` → `scrollIntoView({ block: 'center' })` (sem `behavior: smooth`) + `focus()` no card (`tabIndex={-1}`).

### Layout atualizado (≥ 1280 px, modo Técnico)
| Página | Linha 2 |
|---|---|
| Visão Geral | [População 8 · Contexto 4] |
| ds1 | [Pirâmide 8 · Contexto 4] |
| ds2 | [Pirâmide quinquenal 8 · Contexto 4] |
| ds3 | [0–14 e 60+ 8 · Contexto 4] |
| ds4 | [e0 H × M 8 · Contexto 4] |
| ds5 | [Sobrevivência 8 · Contexto 4] |
As demais linhas seguem os layouts vigentes; o card Fatos (spec 10) continua logo abaixo.

## 3. Base de demonstração
### Gerador
```python
# tools/make_dirty.py
manifest = {
  "dataset": ds, "seed": 42, "generated_at": iso,
  "rows_original": n,
  "nulls_injected": {"col": count, ...},     # apenas em métricas, nunca em nulos estruturais
  "exact_duplicates": k1, "key_duplicates": k2,
  "outliers": {"rows": [...ids], "columns": {...}, "factor": [10, 0.1]},
  "whitespace_cells": k3, "recoverable_ids": k4,
}
```
- O gerador opera **sobre a base já normalizada em formato longo** (após o reshape) e depois a reescreve no **mesmo layout do arquivo original** (largo para ds1/ds2), para que o pipeline exercite o caminho completo.
- Um índice estável (`row_uid`) permite casar as linhas sujas com as originais no teste de recuperação.

### Relatório e API
- `QualityReport` ganha `manifest: Manifest | None` (preenchido quando `source == 'sujo'`).
- `GET /datasets/{id}/quality-report?source=sujo` sempre devolve o relatório da última execução `sujo`; sem execução, 404 `no_run_for_source` (o frontend mostra o estado vazio com o botão "Processar base de demonstração").
- Semeadura (spec 10) garante a geração dos arquivos sujos antes de processá-los.

### Página
```
[ KPIs ×4 (fonte selecionada) ]
[ Original × Demonstração (lado a lado) 8 · Validações 4 ]
[ Inserido · Detectado · Corrigido por dataset 12 ]   ← só com fonte "sujo"
[ Nulos por coluna 6 · Histórico 6 ]
```
Tabela "Inserido · Detectado · Corrigido": linhas = tipos de problema (Nulos, Duplicatas exatas, Duplicatas por chave, Outliers, Espaços extras, Ids recuperáveis); colunas = os três valores + selo (ok/atenção, com ícone + texto, nunca só cor). Um seletor de dataset (Select) no cabeçalho do card.

## 4. Insights
```tsx
<Accordion type="multiple" value={open} onValueChange={setOpenAndHash}>
  {section.items.map((it, i) => (
    <AccordionItem key={i} value={`${section.pageId}-${i + 1}`} className="rounded-lg border hc:border-2 mb-3">
      <AccordionTrigger className="items-start gap-4 px-5 py-4 text-left">
        <span className="grid size-7 shrink-0 place-items-center rounded-full border text-sm tabular-nums">{i + 1}</span>
        <span className="flex-1">
          <h3 className="font-semibold leading-snug">{it.q}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{it.why}</p>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5 pl-16">
        <div className="max-w-[72ch] space-y-3">{it.a.map(p => <p>{p}</p>)}</div>
        <div className="mt-4 flex flex-wrap gap-2">{it.keyNumbers.map(k => <Chip label={k.label} value={k.value} />)}</div>
        <Link className="mt-4 inline-flex text-sm underline" to={`${it.route}?cod=0#chart-${it.chartId}`}>Ver na página: {it.chartLabel}</Link>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```
- Remover do componente `accordion` do shadcn as classes `data-[state=open]:animate-accordion-down`/`up` (regra: sem animações).
- `InsightItem` (em `content/insights.ts`) ganha `why`, `keyNumbers: { label: string; value: string }[]`, `route`, `chartId` e `chartLabel`, vindos de `insights-explicacoes.md`. Os `value` são strings prontas (texto fixo).
- `open` sincronizado com `location.hash` (um item por vez na âncora; vários abertos no estado local).
- Na página de destino, o hash `#chart-<id>` rola até o card do gráfico ao carregar.
