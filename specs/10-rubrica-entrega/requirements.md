# Etapa 10: Rubrica de entrega

Origem: rubrica do curso (repositório, MySQL, EDA, painel). O item Power BI foi substituído pelo Databricks. O Power BI não deve ser implementado.

Prevalece apenas nos arquivos citados. Não reabra as etapas 1–9 e não altere o painel React, as manchetes, os Fatos nem o iframe de `/databricks`.

## Fora de escopo
- Arquivo `.pbix`, medidas DAX e conexão Power BI.
- Copiar Parquet para `data/silver/` ou mudar o destino do ETL (`data/processed/`).
- Abrir planilhas de `data/raw/` ou arquivos de `data/processed/`. Números só de `specs/DATA_PROFILE.md` e das manchetes já fechadas na etapa 9.
- Nova carga, novo catálogo ou novo dashboard Lakeview.

## R1. Repositório (20%)
- R1.1 O `README.md` da raiz explica as três camadas, sem criar pasta duplicada:
  - raw: `data/raw/*.xlsx`
  - silver: Parquet gerado em `data/processed/` (gitignored; regenerado pelo ETL)
  - ouro: tabelas MySQL do `schema.py` e views `ibge.gold.*` em `databricks/02_gold.sql`
- R1.2 O mesmo README traz a seção "Prompts de IA" com o texto integral de `PROMPTS.md`.
- R1.3 Docstring de módulo, em uma linha, em `etl.py`, `loader.py`, `schema.py` e `load_mysql_from_parquet.py`, dizendo qual camada cada um cobre. Sem comentário linha a linha.
- R1.4 `.gitignore` continua ignorando `.env`, `data/processed/`, uploads e `*_sujo.xlsx`. Não passe a versionar Parquet nem planilha completa.

## R2. MySQL e camada ouro (25%)
- R2.1 `docs/DER.md`: diagrama Mermaid (dim_territorio, dim_metrica, etl_runs, ds1–ds5) com PK, UK e o FK de `cod`.
- R2.2 FK `cod` → `dim_territorio.cod` nas cinco tabelas fato, no `schema.py` e numa revisão Alembic nova. Não reescreva `001_initial.py`. `regiao_cod` fica sem FK.
- R2.3 `apps/api/sql/ddl_ouro.sql`: DDL equivalente ao metadata depois da revisão (PK, UNIQUE, NOT NULL, FK). O arquivo é o script que a rubrica pede; o runtime continua no Alembic.
- R2.4 A carga ouro continua `python -m app.tools.load_mysql_from_parquet` (Alembic + Parquet silver → MySQL). A docstring do módulo deve chamá-la de carga da camada ouro. A dimensão entra antes dos fatos; se a ordem atual quebrar o FK, corrija no `loader.py` existente.
- R2.5 Teste afetado: metadata contém as cinco FKs; o DDL commitado contém `FOREIGN KEY` e `dim_territorio`.

## R3. Relatório de EDA (20%)
- R3.1 `docs/RELATORIO_EDA.md`, em pt-BR, com estatística descritiva só dos números já publicados em `specs/DATA_PROFILE.md` (linhas, anos, pico, nulos de TCG, mínimo e máximo de nqx, TFT, e0 e TMI).
- R3.2 Uma resposta curta, com o número e o ano, para cada pergunta:
  - A população ainda cresce? Até quando?
  - Como a idade muda e onde estará a demanda?
  - Quais faixas crescem e quais encolhem até 2070?
  - Quando os idosos superam as crianças?
  - Em que ritmo se vive mais e se tem menos filhos?
  - Quantos chegam a cada idade?
- R3.3 Fonte citada em cada tabela: `specs/DATA_PROFILE.md` ou a manchete da etapa 9. Sem número novo calculado em planilha.

## R4. Painel Databricks no lugar do Power BI (25%)
- R4.1 `docs/PAINEL_DATABRICKS.md` declara a substituição: o Lakeview substitui o Power BI; as medidas são as views em `databricks/02_gold.sql` e os `SELECT` de `databricks/paginas/`; não há DAX.
- R4.2 O documento lista, por página do dashboard, o arquivo SQL, a medida principal e o KPI, e descreve a navegação entre as páginas do Lakeview. A URL de embed já usada em `apps/web/src/features/databricks/page.tsx` entra como acesso ao painel publicado.
- R4.3 A linhagem fica explícita: o mesmo Parquet silver alimenta o MySQL e o volume `ibge.bronze.raw`. O painel não abre conexão JDBC com o MySQL.
- R4.4 Uma linha em `specs/DECISIONS.md`: Power BI fora do escopo; Databricks é o painel da rubrica; silver permanece em `data/processed/`.