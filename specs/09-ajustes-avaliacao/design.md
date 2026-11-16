# Etapa 9: Design

## 1. Validações com tolerância
```python
# domain/validation_rules.py
@dataclass(frozen=True)
class Rule:
    id: str                    # "brasil_eq_ufs:nasc_t"
    dataset: str
    kind: Literal["estoque", "fluxo"]
    tol_abs: float = 0
    tol_rel: float = 0         # fração (0.00001 = 0,001%)
    note: str | None = None    # "arredondamento da fonte IBGE"

FLUXO = dict(kind="fluxo", tol_abs=10, tol_rel=0.00001, note="arredondamento da fonte IBGE")

def evaluate(rule, max_diff_abs, max_diff_rel) -> Literal["ok", "ok_arredondamento", "falha"]:
    if max_diff_abs == 0: return "ok"
    if max_diff_abs <= max(rule.tol_abs, rule.tol_rel * reference): return "ok_arredondamento"
    return "falha"
```
- `summarize_validations()` (única função usada pela página e pelos Fatos) conta `ok` + `ok_arredondamento` como aprovadas.
- Frontend: selo "ok" (ícone de check), "ok com arredondamento" (check + "i") e "falha" (X). O status "Validações aprovadas" usa `aprovadas / total`.

## 2. Execuções e base de demonstração
- `retention.py`: `keep_latest(dataset_id, source)` para cada par; nunca apaga a última execução bem-sucedida de uma fonte.
- `startup.py`: depois da semeadura original, se não existir execução `sujo` para algum dataset → `make_dirty` + pipeline `sujo`.
- Teste de integração: executar a retenção com 3 execuções de cada fonte → sobra 1 de cada.

## 3. Fatos
- Substituir `detail` livre por uma estrutura:
  ```python
  class FactPart(BaseModel):
      label: str | None   # "em 2000", "homens", "queda de", "em relação ao pico"
      value: float | int | str
      kind: MetricKind
      position: Literal["prefix", "suffix"] = "prefix"   # "em 2000: 3.423.475" × "−9,6% em relação ao pico"
  class Fact(BaseModel):
      id: str; label: str; main: FactPart; parts: list[FactPart] = []
  ```
- Renderização: `main` + " · " + join(parts). Cada `value` passa por `formatValue` com o tipo certo.
- Teste `tests/facts/test_rendering.py` com as linhas "Correto" da tabela do R3 (Brasil) e as regras do R3.1.

## 4. Métricas
- `metricas.yaml`: `id_med` (Idade mediana, 1 casa) e novo `idade_central_simples` (Idade central da distribuição, 0 casas, com nota).
- `formatValue` para `percent` com 1 casa fixa (`minimumFractionDigits: 1`).
- Faixas etárias: `formatAgeGroup("40-44") → "40–44"` aplicado em KPIs, manchetes, Contexto e eixos.
- Contexto: `note` só é exibida se não repetir o valor principal formatado (comparação de strings após formatar).
- Eixos: `formatAxis(value, metric)` com `maximumFractionDigits: 0` em anos; curva de sobrevivência com `lx / 1000`; população com espaço antes de "mi".
- Narrativas: `metricName(metric, { position: 'mid' })` → nome com inicial minúscula (exceto siglas e nomes próprios); revisar os templates de tendência.

## 5. Manchetes
`lib/narratives/headline.ts`:
```ts
ds1: (k) => `Hoje, **${pct(k.p60)}** da população tem 60 anos ou mais; em ${k.anoFuturo} serão **${pct(k.p60Futuro)}**. A demanda se desloca para adultos e idosos.`,
ds2: (k) => `Até 2070, o grupo de **${ag(k.gMax)}** cresce **${pctSigned(k.vMax)}**, e o de **${ag(k.gMin)}** encolhe **${pctAbs(k.vMin)}**.`,
ds4: (k) => `Vivemos **${years(k.e0)}** anos em média, e cada mulher tem **${rate(k.tft)} ${k.tft < 2 ? 'filho' : 'filhos'}**, ${k.tft < 2.1 ? 'abaixo' : 'acima'} da reposição de 2,1.`,
```
- `anoFuturo = min(ano + 14, 2070)`. Os valores vêm de `/summary` (acrescentar `p60_futuro`, `g_max`, `v_max`, `g_min`, `v_min` ao backend, calculados para o ano selecionado).

## 6. Contexto rápido
- Pré-computar no deploy `context[page][cod]` para o ano atual em um JSON (cerca de 6 páginas × 33 territórios, pequeno) servido pela própria API a partir da memória.
- Demais anos: cálculo sob demanda com `lru_cache(maxsize=2048)` por `(page, cod, ano, sexo)`.
- Para a ds1, calcular a partir de agregados pré-computados por `(cod, ano, sexo, idade)` em vez de varrer as 639 mil linhas.

## 7. Painel Databricks
```
features/databricks/
├── DatabricksPage.tsx
├── ExternalEmbed.tsx     # modo external: busca /api/v1/databricks/embed e monta o iframe/SDK conforme a documentação
├── PreviewGallery.tsx    # modo preview: imagens em public/databricks/*.png + legenda por página
└── LoginEmbed.tsx        # modo login: só para uso interno (DATABRICKS_EMBED_MODE=login)
```
- Backend `integrations/databricks.py`: credenciais do service principal em variáveis de ambiente; endpoint com cache do token até 5 min antes de expirar; 503 com mensagem segura em caso de erro.
- `public/databricks/`: capturas em 1280 px das páginas do dashboard, geradas manualmente (ou por script com credencial) a cada publicação. O Cursor deve **parar e pedir** as capturas se não conseguir gerá-las.

## 8. Nome
`<title>`: `{Página} · Projeções IBGE`; sidebar: "IBGE / Projeções" (como antes).
