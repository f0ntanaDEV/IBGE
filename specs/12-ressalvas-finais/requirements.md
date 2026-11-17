# Etapa 12: Ressalvas finais

Origem: `avaliacao-rubrica-2026-11-17.md` (nesta pasta), itens 1 a 3 da rubrica e os ajustes de acabamento. A estimativa é de 68–81 pontos. As ressalvas abaixo seguram a nota nos itens 1 a 3.

Prevalece sobre a etapa 11 apenas nos arquivos citados.

## Fora de escopo
- **Databricks inteiro:** `databricks/`, `docs/PAINEL_DATABRICKS.md`, `tools/export_gold.py`, a página `/databricks` e o embed. Não edite.
- Telas, textos, Fatos, Insights e manchetes do painel React. A exceção é o rótulo do rodapé (R1.3).
- Mudar a lógica de limpeza, a carga (`loader.py`) ou os valores de referência.

## R1. Carga ouro confiável em produção
- R1.1 **A semeadura automática olha o conteúdo, não o histórico.**
  - QUANDO `AUTO_SEED=true` e alguma das 5 fatos tiver 0 linhas, ENTÃO a API carrega a ouro na inicialização, mesmo que `etl_runs` já tenha execuções com sucesso.
  - O Parquet da silver é reaproveitado se existir; o ETL só roda se ele faltar.
  - QUANDO as 5 fatos tiverem linhas, ENTÃO nada é recarregado.
- R1.2 Situação que precisa ser coberta: uma migração que recria as fatos (como a 003) seguida de reinício do container. As fatos voltam a ser preenchidas sem comando manual.
- R1.3 `/health` passa a informar o conteúdo do banco.
  - `mysql` tem quatro estados: `ok` (conectou e ds1 tem linhas), `vazio` (conectou e ds1 tem 0 linhas), `carregando` (semeadura em curso) e `down`.
  - O rodapé mostra: `MySQL ok`, `MySQL sem dados`, `MySQL carregando` e `MySQL indisponível`.
  - A consulta é `SELECT 1 FROM ds1_populacao_idade LIMIT 1`, não `COUNT(*)`.
- R1.4 Testes:
  - `should_seed` sem MySQL (fatos vazias com `etl_runs` success → True; fatos cheias → False);
  - `/health` nos 4 estados;
  - um cenário no `tests/mysql/` reproduzindo "migração recria as fatos → semeadura recarrega".

## R2. Restrições de domínio das taxas
- R2.1 Novos CHECKs nomeados (Alembic `004_checks_taxas` e `schema.py`).
  - **Limites:** foram medidos na silver original de 17/11, com folga. Antes de criar cada CHECK, a migração confere a ouro. Se algum valor violar o limite, a tarefa para e registra o caso em `DECISIONS.md`; não afrouxe o limite em silêncio.
  - **ds3:** todas as proporções `p_*` `BETWEEN 0 AND 1`.
  - **ds4:**
    - `e0_*` e `e60_*` `BETWEEN 0 AND 120`;
    - `tft` `BETWEEN 0 AND 10`; `tef_*` `BETWEEN 0 AND 1`;
    - `tmi_*`, `n_5q0_*`, `n_45q15_*` e `n_20q60_*` `BETWEEN 0 AND 1000` (por mil);
    - `rs` `BETWEEN 50 AND 150`;
    - `ie60`, `ie65`, `ie80`, `rdj*`, `rdi*` e `rdt*` `>= 0`;
    - `id_m` e `id_med` `BETWEEN 0 AND 120`;
    - `tcg_*` sem CHECK: pode ser negativa e tem os 99 nulos estruturais.
  - **ds5:**
    - `nmx >= 0`; `nax >= 0`; `sx BETWEEN 0 AND 1`;
    - `lx` `BETWEEN 0 AND 100000`;
    - `ndx`, `nlx` e `tx` `>= 0`;
    - `ex` `BETWEEN 0 AND 120`.
- R2.2 Regenerar `ddl_ouro.sql` com `dump_ddl` e atualizar `docs/DER.md` (lista de CHECKs por tabela).

## R3. Repositório
- R3.1 O diagrama de arquitetura do README representa o fluxo real:
  - `raw xlsx → ETL → silver Parquet`;
  - `silver → API → React` (a API lê a silver);
  - `silver → carga → MySQL ouro → export → Databricks`.
  - Uma frase explica que o MySQL é a camada ouro para consulta, para o Databricks e para a rubrica, e que a API lê a silver por desempenho.
- R3.2 A seção "Deploy com Docker" do README descreve o deploy real, além do local:
  - versionar `docker-compose.prod.yml` sem segredos, com o bind do web vindo da variável `WEB_BIND` (ex.: `192.168.0.37:80`) e sem portas publicadas para api e mysql;
  - o comando `docker compose -p ibge-projecoes -f docker-compose.yml -f docker-compose.prod.yml up -d --build`;
  - as variáveis obrigatórias do `.env`, só os nomes;
  - a verificação após o deploy (`/api/v1/health` com `mysql: ok` e a soma de 2026).
- R3.3 Docstring em português em **toda** função e classe pública de `apps/api/app/`, sem exceção de pasta.
  - Prioridade: `api/v1`, `domain`, `services/context`, `services/facts`, `integrations` e `core`.
  - Cada docstring diz o que entra, o que sai e a regra. Rotas dizem o endpoint e os parâmetros.
  - Comentários de uma linha onde há decisão: regras de status dos KPIs, escolha de território para Fatos, cache de territórios, fallback do relatório para o MySQL, critério das notícias.
  - Funções privadas (`_x`) com mais de 15 linhas também ganham docstring.
- R3.4 `test_docstrings.py` passa a percorrer todo `app/` e `alembic/versions/`.
- R3.5 Meta: ≥ 90% das funções e classes de `app/` com docstring, medido por `python -m app.tools.doc_coverage`, que imprime o total e o percentual por pasta. Não precisa constar no README.

## R4. Acabamento da EDA
- R4.1 Todos os gráficos de `docs/eda/` em formato pt-BR:
  - eixos de pessoas em "mi" ou "mil" (`1,5 mi`), sem notação `1e6`;
  - vírgula decimal;
  - títulos e rótulos de eixo em português, com unidade.
- R4.2 Pirâmide:
  - legenda Homens e Mulheres;
  - eixo X simétrico, com valores absolutos dos dois lados;
  - o grupo aberto rotulado "90+" e anotado como grupo aberto (soma de 90 anos ou mais), para não parecer erro;
  - a mesma escala de X nos dois painéis (2026 e 2070).
- R4.3 Dispersão e0 × TFT: sigla da UF em cada ponto (sem sobreposição ilegível; deslocamento pequeno), linha de tendência e o r de Pearson no título ou numa anotação.
- R4.4 Série 2000–2070: marcar o pico de 2041 e a linha vertical de 2026 ("hoje").
- R4.5 Boxplot de TFT: linha horizontal de reposição em 2,1, com rótulo.
- R4.6 `estatisticas.md`: o `describe` do nqx deixa de misturar idades. Passa a mostrar nqx aos 0 e aos 60 anos entre as UFs em 2026, separadamente.
- R4.7 `RELATORIO_EDA.md`:
  - cita o cruzamento de **2042** (óbitos superam nascimentos) na resposta sobre crescimento;
  - troca a frase do nqx mediano pelos dois novos `describe`;
  - inclui as imagens com `![...](eda/arquivo.png)`, para aparecerem no GitHub;
  - nenhum número novo sem origem em `estatisticas.md`.
- R4.8 O teste de referência da EDA continua passando, e o `estatisticas.md` gerado duas vezes seguidas é idêntico.
