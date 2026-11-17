# Etapa 12: Desenho

Sem tela nova. O frontend só muda em `apps/web/src/app/layout/Footer.tsx` (rótulo) e no tipo `HealthStatus`.

## Semeadura (`core/startup.py`)
```
_facts_state() -> "cheias" | "vazias" | None (banco não abriu)
    SELECT 1 FROM <fato> LIMIT 1 para as 5 fatos
should_seed():
    se não AUTO_SEED → False
    estado = _facts_state()
    "cheias" → False | "vazias" → True | None → regra atual da silver em disco
```
- `_has_success()` deixa de decidir a semeadura e pode ser removida, se nada mais a usar.
- Quando a silver original já existe, a semeadura chama `load_mysql_from_parquet` sem refazer o ETL. A base suja continua só no relatório.
- O log registra uma linha: `semeadura: fatos vazias, recarregando a ouro`.

## Health
- `HealthOut.mysql: Literal["ok", "vazio", "carregando", "down"]`.
- A ordem da checagem é: `is_seeding()` → "carregando"; conexão falhou → "down"; ds1 sem linha → "vazio"; senão → "ok".
- Regenerar os tipos do `packages/shared`, se forem gerados do OpenAPI.

## CHECKs (Alembic 004)
- Em `schema.py`, um mapa `RANGE_CHECKS = {tabela: [(nome, expressão), ...]}` alimenta `_fact()`. As colunas por padrão (`p_*`, `e0_*`, `tef_*`) são expandidas a partir das colunas da tabela, sem lista escrita à mão.
- Na migração 004, antes de cada `create_check_constraint`, rodar `SELECT COUNT(*) FROM t WHERE NOT (expr)`. Se o resultado for maior que 0, `raise` com o nome do CHECK e a contagem.
- O teste do metadata compara com o `ddl_ouro.sql` regenerado.

## Compose de produção
- `docker-compose.prod.yml`, igual ao do servidor, com uma diferença: o web usa `"${WEB_BIND:?defina WEB_BIND}:80"`.
- `.env.example` ganha `WEB_BIND=` e mantém os segredos vazios.
- O README não cita IP privado como regra, só como exemplo.

## Docstrings
- Estilo: uma linha de resumo; se precisar, um parágrafo curto e as seções `Args:` e `Returns:` só quando o nome não basta. Em português.
- `tools/doc_coverage.py` reaproveita o `ast` do `test_docstrings.py` (função comum em `tools/`, para não duplicar).
- Não renomear nem mover código.

## EDA (`tools/eda.py`)
- Um helper `_fmt_pessoas(x, _)` com `matplotlib.ticker.FuncFormatter`, usado em todos os eixos de pessoas. Ele usa o `fmt()` existente.
- `plt.rcParams["axes.formatter.use_locale"]` não deve ser usado, porque o locale do CI é instável. A formatação é manual.
- **Pirâmide:**
  - `xlim` comum = maior valor absoluto dos dois anos × 1,05;
  - ticks com `abs()`;
  - o 90+ na mesma cor, com `hatch` leve e anotação de texto;
  - legenda com dois patches.
- **Dispersão:**
  - `ax.annotate(sigla, (x, y), xytext=(3, 3), textcoords="offset points", fontsize=7)`;
  - a reta vem de `numpy.polyfit` de grau 1, em linha fina e neutra.
- **Determinismo:** `matplotlib.use("Agg")`, fonte padrão DejaVu e `savefig(..., metadata={"Software": None})`, para o PNG não mudar a cada execução no mesmo ambiente.
- **Paleta:** a mesma de hoje. Sem cores novas.
