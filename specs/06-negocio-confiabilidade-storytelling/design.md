# Spec 13: Design

## 1. Dicionário de métricas
`apps/api/app/domain/metricas.yaml`:
```yaml
- id: e0_t
  nome: Esperança de vida ao nascer
  sigla: e0
  definicao: Número médio de anos que um recém-nascido viveria, mantidas as taxas de mortalidade do ano.
  formula: "ex na idade 0 da tábua de mortalidade"
  unidade: anos
  casas_decimais: 2
  tipo_variacao: absoluta
  fonte: IBGE, Projeções da População, Revisão 2024 (tabela 4)
  regra_status: esperanca_vida
```
- Validação Pydantic ao iniciar; `/api/v1/metrics` retorna a lista; o frontend usa `useMetrics()` em cache infinito.
- `formatValue(value, metricId, mode)` busca as casas decimais e a unidade do dicionário. Proibido passar o formato à mão em componentes.
- `formatDelta(delta, metricId)` aplica `tipo_variacao` (`%`, `p.p.` ou unidade).
- Lint: proibir rótulos de métrica em JSX que não venham de `metric.nome`. Na prática: busca por siglas em labels com `rg -n '"(e0|TFT|TMI|IE60|nqx|e60|RDT65)"' apps/web/src`.

## 2. Status e ações
```ts
// content/kpi-rules.ts (de conteudo/regras-kpi.md)
type Status = 'good' | 'warn' | 'bad';
type KpiRule = { id: string; metricId: string; basis: 'value' | 'yoy_pct' | 'vs_brazil' | 'delta10_pp' | 'pct_rows';
                 good: (x: number) => boolean; warn: (x: number) => boolean; action: string; thresholdsText: string };
export function evaluate(ruleId: string, ctx: { value: number; brazil?: number; prev?: number; past10?: number }): { status: Status; basis: number };
```
- O backend também avalia (mesmas regras, de `kpi_rules.yaml`), para usar nos Fatos/Contexto e nos testes; os dois são testados contra os mesmos golden.
- `KpiCard` acrescenta `StatusBadge` (ícone + texto) e a linha de referência (R8.2).
- `ActionStrip`: logo abaixo da `KpiRow`, lista as ações dos KPIs `warn`/`bad` (os `bad` primeiro), no máximo 3, com "Ver regra" abrindo o popover do KPI.
- Tokens (claro / escuro): `--status-good: 140 18% 40% / 140 20% 60%`, `--status-warn: 38 45% 42% / 38 50% 62%`, `--status-bad: 6 32% 48% / 6 40% 65%`; alto contraste: verde, âmbar e vermelho puros, com contraste ≥ 7:1 com o fundo.

## 3. Cabeçalho padrão das páginas de dados
```
<PageHeader>
  h1 Título
  p.lead Pergunta central                                   (text-lg, foreground)
  p.meta Dados: …Revisão 2024 (divulgada em 22/08/2024) · Atualização: a cada nova revisão · Processado em … [i]
  span "Para: Gestor público · Analista"                    (text-xs, muted)
</PageHeader>
<FilterBar/>
<Headline/>      ← R9.1
<KpiRow/> <ActionStrip/>
```
- `processedAt` vem de `/datasets` (último `etl_run` com sucesso, `finished_at`) e é formatado como `dd/MM/yyyy HH:mm` no fuso America/Sao_Paulo.
- Visão Geral: usa a data mais recente entre os 5 datasets.

## 4. Manchete
- `lib/narratives/headline.ts`: uma regra por página, usando o resumo já carregado; números com `formatValue` e destaque `<strong className="text-3xl tabular-nums">`.
- Território ≠ Brasil: a manchete inclui a comparação ("… 0,77 ano abaixo da média do Brasil").

## 5. Correções de confiabilidade
- **Atípicos**: `outliers.py`. Para cada série, calcular `delta_t = x_t/x_{t-1} − 1`, excluindo 2020 e 2021 do cálculo dos quartis. Marcar se `|delta_t − mediana| > 3 × IQR` **e** `|delta_t| ≥ 0,05`. Medir a % de sinalizados nas originais (meta < 0,5%) e na suja (detecção ≥ 90%). Registrar os números em `DECISIONS.md`.
- **Validações**: uma função `summarize_validations(report)` usada tanto pelos Fatos quanto pela página.
- **Nulos**: lista `ENGINEERED_COLUMNS = {'is_outlier', 'outlier_motivo', 'row_uid'}` excluída das contagens.
- **Contexto**:
  1. reproduzir a 1280 px; verificar se a lista tem altura 0 (`h-full` dentro de pai sem altura) e corrigir com `min-h-0 flex-1`;
  2. medir o `/context` no Vercel; se passar de 1 s, pré-computar no deploy (`python -m app.tools.warm_cache`) todas as combinações `page × cod (33) × ano (71)` para sexo T e servir de um JSON estático por página e ano. São cerca de 14 mil itens pequenos, então avaliar o tamanho; se for grande, pré-computar só os anos 2000, 2010, …, 2070 e o ano atual, e calcular o resto sob demanda com cache.
- **Notícias**: `relevance = termos da página presentes em título + resumo`; mínimo 1. `news-curated.ts` com 3 notícias oficiais por página, cujos títulos e links devem ser validados manualmente antes do commit (o Cursor lista as URLs e você confirma).

## 6. Página "Como ler este painel" (`/sobre`)
Seções: Para quem é · Perguntas que o painel responde (tabela do R2.1 com links) · Como ler o status (regras e "não são metas oficiais") · De onde vêm os dados e quando são atualizados · Dicionário de métricas · Limitações (projeções, grupo 90+, saldo migratório estimado).
