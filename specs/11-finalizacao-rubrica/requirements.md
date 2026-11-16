# Etapa 11: Finalização pela rubrica

Origem: `avaliacao-rubrica-2026-11-16.md` (nesta pasta). Estimativa atual: 47–59/100. Rubrica: repositório (20%), modelo e banco MySQL (25%), relatório de EDA (20%) e painel, com o Databricks no lugar do Power BI (25%).

Esta etapa **prevalece sobre a etapa 10** nos pontos abaixo:
- A silver passa a ter pasta própria (`data/silver/`), não mais `data/processed/`.
- Python recebe docstrings de função e comentários de decisão. Não basta a docstring de módulo (R1.3 da etapa 10).
- A EDA recalcula os números a partir dos dados (R3 da etapa 10).
- O Databricks passa a ler o MySQL ouro (R4.3 da etapa 10).

Não altere telas, textos, Fatos, Insights nem manchetes do painel React.

## Fora de escopo
- Power BI (`.pbix`, DAX).
- Mudar a interface do app, exceto o que a troca de pasta ou de tipos no banco exigir para continuar funcionando.
- Criar usuário, segredo, regra de firewall ou porta pública no servidor. Isso é feito pelo usuário (tarefa manual).

## Valores de referência (golden)
Use estes valores nos testes e na validação após a carga. Fonte: `DATA_PROFILE.md` e a etapa 9.

| Verificação | Valor |
|---|---|
| Linhas por base (original, após limpeza) | ds1 639.639 · ds2 133.551 · ds3 2.343 · ds4 2.343 · ds5 140.580 · total 918.456 |
| ds1, Brasil, 2026, soma das idades (sexo total) | 214.211.951 |
| ds1, Brasil, 2024, soma das idades | 212.583.750 |
| ds4, Brasil, 2026, `pop_t` | 214.211.951 (inteiro exato) |
| ds4, Brasil, 2026 | e0_t 77,03 · TFT 1,51 (2 casas) |
| ds1, linhas `is_outlier` na base original | 0 |
| Nulos estruturais | 99 (`tcg_t/h/m` em 2000 × 33 territórios) |

## R1. Repositório (20%)
- R1.1 A camada silver aparece no repositório:
  - pasta `data/silver/` com um `README.md` (o que é, como gerar, esquema de cada arquivo);
  - uma amostra versionada em `data/silver/amostra/`: Parquet com até 2 mil linhas por base (Brasil, uma região e uma UF);
  - o ETL grava em `data/silver/`;
  - o `.gitignore` ignora `data/silver/*.parquet`, mas não a amostra nem o README.
- R1.2 Docstring em português em **toda** função e classe pública destes arquivos: `services/cleaning/*.py`, `services/etl.py`, `services/loader.py`, `repositories/schema.py`, `tools/*.py` e as migrações Alembic.
  - A docstring diz o que a função recebe, o que devolve e qual regra aplica.
  - Comentários de uma linha explicam as decisões não óbvias: tolerância de arredondamento, nulos estruturais, critério de atípico, ordem da carga, por que a base suja não entra na ouro.
  - Não comente linha a linha.
- R1.3 O `README.md` da raiz tem as seções abaixo, nesta ordem:
  1. Objetivo
  2. Arquitetura (diagrama Mermaid: xlsx → ETL → silver → MySQL ouro → API/React e → Databricks)
  3. Camadas raw/silver/ouro, com as pastas reais
  4. Passo a passo do ETL e da carga (comandos)
  5. Modelo de dados (link para o DER e o DDL)
  6. EDA (link para o relatório)
  7. Painel Databricks (link)
  8. Como rodar os testes (API, web, e2e e carga MySQL)
  9. Deploy com Docker
  10. Débitos atualizados (sem "Modo leve")
  11. Prompts de IA: os 11 prompts na íntegra, iguais ao `PROMPTS.md`
- R1.4 O `PROMPTS.md` tem os prompts 1 a 11, um por pasta de `specs/`. O texto de abertura cita onze etapas.
- R1.5 O `.gitignore` também ignora `*.log`, `.DS_Store`, `.idea/`, `.vscode/` e `coverage/`. Continua ignorando `.env`, uploads e `*_sujo.xlsx`.

## R2. Modelo e banco MySQL (25%)
- R2.1 **A base suja nunca entra nas tabelas ouro.**
  - QUANDO a semeadura ou o upload processar a fonte `sujo`, ENTÃO grava só `etl_runs` (com `report_json`) e, se o app precisar das linhas, as tabelas `demo_<fato>`. As cinco fatos ouro não são tocadas.
  - QUANDO a fonte `original` for carregada, ENTÃO as fatos são sempre substituídas, mesmo com o mesmo número de linhas. O atalho `_same_row_count` deixa de existir.
- R2.2 Nova revisão Alembic `003_restricoes_ouro`:
  - PRIMARY KEY composta e NOT NULL nas chaves das fatos (ds1 e ds5: `idade, sexo, cod, ano`; ds2: `grupo_etario, sexo, cod, ano`; ds3 e ds4: `cod, ano`). O UNIQUE vira a PK.
  - Tipos:
    - contagens de pessoas (`populacao`, `pop_*`, faixas de ds3, `nasc_*`, `obt_*`) em `BIGINT`, se a base original só tiver inteiros, ou `DECIMAL(14,2)`;
    - taxas, proporções e medidas da tábua em `DECIMAL(18,6)`;
    - nenhuma coluna `FLOAT`.
  - CHECKs: `sexo` no domínio da base; `ano BETWEEN 2000 AND 2070`; contagens `>= 0`; `nqx BETWEEN 0 AND 1`; `idade BETWEEN 0 AND 90` em ds1 e ds5 (conferir o máximo real no `DATA_PROFILE.md`).
  - FK `dim_territorio.regiao_cod → dim_territorio.cod` e FK `etl_runs.dataset_id → datasets(id)`. Se a tabela de catálogo não existir, crie `dim_dataset`.
  - Em produção, a revisão pode apagar e recriar as fatos, porque a carga seguinte as repõe. O README avisa isso.
- R2.3 A carga mantém todas as restrições depois de executada. `CREATE TABLE … LIKE` + `RENAME` não preserva FK, então troque por `DELETE` + `INSERT` em lotes dentro de **uma transação**. A carga das dimensões deixa de usar `FOREIGN_KEY_CHECKS=0` e passa a usar upsert.
- R2.4 A carga lê o Parquet em lotes de 10 mil linhas, sem montar todas as linhas em memória.
- R2.5 Validação após a carga, antes do commit:
  - QUANDO algum valor de referência da tabela acima divergir, ENTÃO a carga faz rollback, grava `etl_runs.status = 'failed'` com a diferença e o comando sai com código ≠ 0.
- R2.6 `docs/DER.md` mostra todas as colunas com tipo, PK, FK e CHECK.
  - O texto justifica a desnormalização de `sigla/local/nivel` nas fatos: leitura sem join na API e no Databricks. Um teste garante que esses campos batem com `dim_territorio`.
  - `apps/api/sql/ddl_ouro.sql` é regenerado do metadata e passa a ter PK, CHECK e as novas FKs.
- R2.7 Testes de carga com MySQL real (marcador `mysql`; pulados sem `TEST_MYSQL_URL`; rodam no CI com o serviço MySQL 8). Cobrem:
  - carga da amostra silver;
  - carga da suja seguida da original, sem a suja na ouro;
  - recarga idempotente;
  - restrições presentes em `information_schema`;
  - rollback quando um valor de referência diverge.
- R2.8 Os testes que hoje são pulados por "parquet ausente" passam a usar a amostra de `data/silver/amostra/`. Num clone limpo, `pytest` não tem mais nenhum pulado por esse motivo.

## R3. Relatório de EDA (20%)
- R3.1 `python -m app.tools.eda` lê a silver (ou roda o ETL se ela não existir) e gera `docs/eda/`:
  - `estatisticas.md` com tabelas;
  - gráficos PNG, sem cores vibrantes, seguindo a paleta do projeto.
- R3.2 Conteúdo mínimo:
  - forma, tipos, nulos (com a explicação dos 99 estruturais), duplicatas e atípicos de cada base, antes e depois da limpeza;
  - a explicação de 9.009 linhas na planilha larga contra 639.639 no formato longo da ds1;
  - `describe()` (média, mediana, desvio-padrão, mín., quartis, máx.) de população por idade (Brasil 2026), e0, TFT, IE60, idade mediana e nqx, entre UFs em 2026;
  - gráficos: pirâmide etária do Brasil em 2026 e 2070; população do Brasil de 2000 a 2070 (pico em 2041); histograma de e0 por UF em 2026; boxplot de TFT por região;
  - comparação das 5 regiões em 2026 (população, e0, TFT, IE60);
  - correlação de Pearson e0 × TFT por UF em 2026, com dispersão.
- R3.3 `docs/RELATORIO_EDA.md` é reescrito a partir de `estatisticas.md`:
  - números com no máximo 2 casas;
  - as 6 perguntas de negócio atuais, cada resposta citando o número e o gráfico de origem;
  - sai a frase "Nenhum número foi recalculado".
- R3.4 Um teste confere que o script reproduz os valores de referência: pico em 2041 com 220.425.299; 2070 com 199.228.708; 60+ maior que 0–14 em 2029; óbitos maiores que nascimentos em 2042.

## R4. Painel Databricks (25%)
- R4.1 O Databricks lê o **MySQL ouro**. Há duas variantes, e as duas ficam documentadas:
  - **A (padrão, sem abrir porta):** `python -m app.tools.export_gold`
    - lê as fatos e dimensões do MySQL;
    - grava Parquet;
    - envia ao Volume `ibge.bronze.ouro_mysql` pela Files API (`DATABRICKS_HOST` e `DATABRICKS_TOKEN` no `.env`);
    - grava a execução em `etl_runs` (`source = 'export_databricks'`);
    - `00_catalogo.sql` passa a ler esse Volume.
  - **B (Lakehouse Federation):** `databricks/00_catalogo_federation.sql` cria `CONNECTION` e `FOREIGN CATALOG` para o MySQL com um usuário só de leitura. Exige que o usuário libere a rede (tarefa manual).
- R4.2 Todas as páginas consultam views `gold.*`. A página Indicadores deixa de ler `silver`.
- R4.3 Todas as páginas têm os parâmetros `ano` e `territorio` (padrão: 2026 e Brasil).
- R4.4 `databricks/99_validacao.sql` devolve uma linha por valor de referência (`ok` ou `falha`). A documentação mostra o resultado esperado: todas as linhas `ok`.
- R4.5 `docs/PAINEL_DATABRICKS.md` traz:
  - a linhagem MySQL → Volume → silver → gold → páginas;
  - cada KPI com a view e a fórmula SQL;
  - as duas variantes de conexão;
  - capturas de todas as páginas em `docs/screenshots/databricks/` (feitas pelo usuário).
- R4.6 Avaliadores sem conta no workspace veem o painel pelas capturas e por um PDF exportado (`docs/painel-databricks.pdf`, feito pelo usuário). `/databricks` usa `@databricks/aibi-client`, sem iframe `dashboardsv3`.

## R5. Produção
- R5.1 Depois do merge, o servidor Docker roda o commit novo; `alembic upgrade head` e a carga original rodam sem erro; a soma do Brasil em 2026 no MySQL é 214.211.951 e os atípicos na ds1 são 0.
