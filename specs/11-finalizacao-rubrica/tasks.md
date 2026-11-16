# Etapa 11: Tarefas

Execute uma por vez. Ao concluir, marque `[x]`, rode o teste citado e pare. As tarefas com 👤 são do usuário: o Cursor só prepara os arquivos e o passo a passo.

## Banco (fazer primeiro: corrige a produção)
- [x] **T11.1** `services/golden.py` com os valores de referência e `validate_golden()`. No `loader.py`:
  - remover `_same_row_count`;
  - a fonte `sujo` não toca nas fatos ouro (`grep` nas rotas para decidir se `demo_<fato>` é necessário);
  - trocar a staging + `RENAME` por `DELETE` + `INSERT` em transação única;
  - upsert das dimensões, sem `FOREIGN_KEY_CHECKS=0`;
  - lotes de 10 mil com `iter_batches`;
  - rollback e `etl_runs` failed quando o golden diverge.

  → R2.1, R2.3, R2.4, R2.5
- [x] **T11.2** `schema.py`:
  - PK composta, tipos `BIGINT`/`DECIMAL`, CHECKs nomeados;
  - FK `regiao_cod` e FK `etl_runs.dataset_id` (com `dim_dataset` se faltar);
  - Alembic `003_restricoes_ouro`;
  - `tools/dump_ddl.py` e regenerar `apps/api/sql/ddl_ouro.sql`;
  - atualizar o teste do metadata.

  `pytest -k "schema or ddl"`. → R2.2, R2.6
- [x] **T11.3** Pasta `data/silver/`:
  - `settings.silver_dir` e migração única de `data/processed/`;
  - `data/silver/README.md`;
  - `tools/make_sample.py`, gerar `data/silver/amostra/` e `golden.json`;
  - `.gitignore` (R1.1 e R1.5);
  - `conftest.py` usando a amostra.

  `pytest` sem skips de "parquet ausente". → R1.1, R1.5, R2.8
- [x] **T11.4** `tests/mysql/` e serviço MySQL no CI, com os 5 cenários de R2.7. Rodar localmente com `docker run mysql:8.4` e `TEST_MYSQL_URL`. → R2.7
- [x] **T11.5** `docs/DER.md` completo (todas as colunas e tipos, PK, FK, CHECK, justificativa da desnormalização) e o teste de consistência de `sigla/local/nivel` contra `dim_territorio`. → R2.6

## EDA
- [x] **T11.6** `tools/eda.py`. Rodar e versionar `docs/eda/estatisticas.md` e os PNG. Criar o teste dos valores de referência da R3.4. → R3.1, R3.2, R3.4
- [x] **T11.7** Reescrever `docs/RELATORIO_EDA.md` a partir de `estatisticas.md`:
  - 2 casas no máximo;
  - 6 perguntas, cada uma com número e gráfico;
  - seção "Qualidade dos dados";
  - seção "Limitações": projeção, não censo; revisão 2024.

  → R3.3

## Databricks
- [x] **T11.8** `tools/export_gold.py` + alvo no Makefile + `DATABRICKS_HOST/TOKEN` no `.env.example` (vazios) + `00_catalogo.sql` lendo `ouro_mysql`. Teste unitário com o httpx mockado (sem rede). → R4.1 (A)
- [x] **T11.9** `gold.indicadores_uf`; parâmetros `ano` e `territorio` em todas as `paginas/*.sql`; `99_validacao.sql`; `00_catalogo_federation.sql` comentado. → R4.1 (B), R4.2, R4.3, R4.4
- [x] **T11.10** Reescrever `docs/PAINEL_DATABRICKS.md`:
  - linhagem e KPI → view → SQL;
  - as variantes A e B;
  - "Como reproduzir" (export, rodar os SQL na ordem 00 → 99, publicar);
  - uma tabela com a lista de capturas esperadas (nome do arquivo por página).

  → R4.5, R4.6
- [ ] **T11.11 👤** Rodar o export, executar os SQL no workspace e publicar o dashboard. Conferir que `99_validacao.sql` está todo `ok`. Salvar as capturas das 7 páginas em `docs/screenshots/databricks/` e exportar `docs/painel-databricks.pdf`. → R4.4–R4.6

## Repositório
- [x] **T11.12** Docstrings e comentários de decisão nos módulos de R1.2, mais o teste com `ast`. Não mexer em lógica. `pytest -k docstring`. → R1.2
- [x] **T11.13** README da raiz na estrutura de R1.3 (diagrama Mermaid, comandos testados, deploy Docker, Débitos atuais) e seção "Prompts de IA" copiada do `PROMPTS.md`, que já está com os prompts 1–11. Linha nova em `DECISIONS.md`. → R1.3, R1.4

## Produção
- [ ] **T11.14 👤** No servidor Docker:
  - `git pull`;
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`;
  - `docker compose exec api python -m app.tools.load_mysql_from_parquet`;
  - conferir no MySQL: `SELECT SUM(populacao) FROM ds1_populacao_idade WHERE cod=0 AND ano=2026 AND sexo=<total>` deve dar 214.211.951, e `SELECT COUNT(*) … WHERE is_outlier=1` deve dar 0.

  → R5.1
