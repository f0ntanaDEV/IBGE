# Etapa 1: Requisitos (Backend e pipeline de dados)

## Datasets
5 tabelas das **Projeções da População – Revisão 2024 (IBGE)**, em `data/raw/`. Estrutura completa em `specs/DATA_PROFILE.md`.

| ID | Arquivo | Conteúdo | Chave única (após normalizar) | Tema de notícias IBGE |
|---|---|---|---|---|
| ds1 | `tab1_idade_simples.xlsx` | População por sexo e idade simples | `idade, sexo, cod, ano` | projeção da população, pirâmide etária |
| ds2 | `tab2_grupo_quinquenal.xlsx` | População por sexo e grupo quinquenal | `grupo_etario, sexo, cod, ano` | envelhecimento da população |
| ds3 | `tab3_grupos_etarios_especificos.xlsx` | Grupos etários específicos e proporções | `cod, ano` | idosos, crianças, população em idade ativa |
| ds4 | `tab4_indicadores.xlsx` | Indicadores demográficos implícitos | `cod, ano` | esperança de vida, fecundidade, mortalidade infantil |
| ds5 | `tab5_tabuas_mortalidade.xlsx` | Tábuas de mortalidade | `idade, sexo, cod, ano` | tábuas de mortalidade, esperança de vida |

## R1. Ingestão e normalização
- R1.1 O leitor DEVE usar a aba e a linha de cabeçalho definidas em `datasets.yaml`, descartando linhas de título, cabeçalhos agrupadores e a aba `NOTAS`.
- R1.2 Os nomes de coluna DEVEM ser normalizados para snake_case seguro (sem acento, sem começar por dígito, `+` → `mais`, `-` → `_`), mantendo um **dicionário de métricas** (`coluna`, `rotulo_original`, `descricao`, `unidade`).
- R1.3 ds1 e ds2 DEVEM ser convertidas de formato largo (anos em colunas) para longo (`ano`, `populacao`).
- R1.4 Strings DEVEM ser aparadas (ex.: `' 00-04'` → `00-04`), e ds2 DEVE ganhar `idade_inicio` para ordenação.
- R1.5 Toda tabela DEVE ganhar a coluna `nivel` (`brasil` | `regiao` | `uf`) derivada de `cod`.
- R1.6 Em ds5, `intervalo = '+'` DEVE virar `NULL` com `intervalo_aberto = true`.
- R1.7 Uploads com extensão diferente de .csv/.xlsx, acima de 50 MB ou **com colunas obrigatórias ausentes** DEVEM ser rejeitados com 422 e a lista das colunas faltantes.

## R2. Dados ausentes
- R2.1 Cada dataset DEVE declarar **nulos estruturais** (ex.: `tcg_*` no primeiro ano da série), que são mantidos como `NULL` e reportados à parte. Eles nunca são imputados.
- R2.2 Demais nulos numéricos DEVEM ser imputados por **interpolação linear na série temporal do mesmo local, sexo e idade/grupo**. Nas pontas da série, usa-se o vizinho mais próximo; sem série disponível, a mediana do grupo (mesmo `nivel` e `ano`).
- R2.3 Nulos em colunas de identificação (`cod`, `sigla`, `local`, `sexo`, `ano`, `idade`) DEVEM ser recuperados por mapeamento (`cod` ↔ `sigla` ↔ `local`) quando possível; caso contrário, a linha é descartada e registrada.
- R2.4 Colunas com nulos acima do limite (padrão 60%) DEVEM ser descartadas e registradas.

## R3. Duplicidades
- R3.1 O sistema DEVE remover duplicatas exatas.
- R3.2 O sistema DEVE remover duplicatas pela chave única do dataset, mantendo o registro com menos nulos.
- R3.3 Linhas de Brasil e de regiões **não são duplicatas** das UFs; são agregados legítimos.

## R4. Outliers
- R4.1 A detecção DEVE ser feita **dentro de grupos comparáveis**, nunca na tabela inteira:
  - variação ano a ano da série de cada (`local`, `sexo`, `idade/grupo`), pelo IQR das variações (padrão) ou Z-score robusto (MAD).
  - Em ds5, além disso, regras de domínio: `0 ≤ nqx ≤ 1`, `lx` não crescente com a idade, `ex ≥ 0`.
- R4.2 Estratégias: `flag` (**padrão**, cria `is_outlier` e `outlier_motivo`), `cap` (substitui pelo valor interpolado da série) e `remove`.
- R4.3 Colunas de identificação, `ano`, `idade` e códigos NÃO DEVEM ser avaliadas.
- R4.4 QUANDO a estratégia não for `flag` E os dados forem a base oficial original, ENTÃO a API DEVE exigir `confirm=true`, pois alterar projeções oficiais muda o significado do dado.

## R5. Validações de consistência
- R5.1 O pipeline DEVE checar: Brasil = Σ regiões = Σ UFs; `_H + _M = _T`; Σ idades da ds1 = `pop_t` da ds4 (mesmo local e ano). Resultados vão para o relatório com status ok/falha e a maior diferença encontrada.
- R5.2 Os valores de referência de `DATA_PROFILE.md` DEVEM ser usados como testes "golden".

## R6. Base de demonstração
Os originais estão limpos, então o tratamento precisa de dados com problemas para ser demonstrado.
- R6.1 O comando `python -m app.tools.make_dirty <ds> --seed 42` DEVE gerar `data/raw/<ds>_sujo.xlsx` com: 3% de nulos aleatórios em métricas, 1% de duplicatas exatas, 0,5% de duplicatas por chave com valores divergentes, 0,5% de outliers (×10 ou ÷10), strings com espaços extras e um nulo em `sigla` recuperável por `cod`.
- R6.2 O pipeline aplicado à versão suja DEVE recuperar os valores originais dentro de uma tolerância (teste automatizado).

## R7. Geração da nova base
- R7.1 O sistema DEVE salvar a base tratada em `data/processed/{ds}_{timestamp}.csv`, `.xlsx` e `.parquet` (o Parquet é o cache usado pela API).
- R7.2 O relatório JSON DEVE trazer: linhas antes/depois, nulos por coluna antes/depois (estruturais separados), duplicatas removidas por tipo, outliers por coluna e motivo, colunas descartadas, validações (R5), estratégias usadas e duração.

## R8. Importação para o MySQL
- R8.1 Tabelas `ds1_populacao_idade`, `ds2_populacao_quinquenal`, `ds3_grupos_etarios`, `ds4_indicadores`, `ds5_tabuas_mortalidade`, além de `dim_territorio(cod, sigla, local, nivel, regiao_cod)` e `dim_metrica`.
- R8.2 A carga DEVE usar staging e troca atômica, em lotes de 10.000 linhas, de forma idempotente.
- R8.3 Cada execução DEVE ser registrada em `etl_runs`. Em caso de falha, rollback e manutenção dos dados anteriores.

## R9. Integração IBGE
- R9.1 Notícias: API de Notícias do IBGE, filtradas pelas palavras-chave de cada dataset.
- R9.2 Cada dataset DEVE declarar **fatos verificáveis** (`claims`): uma métrica calculada a partir dos dados e os termos de busca da notícia que a divulga. A API retorna o fato, o valor calculado e as notícias encontradas.
- R9.3 Referência externa: comparar a população projetada de 2022 com a do **Censo 2022** (SIDRA). Os códigos de tabela/variável DEVEM ser confirmados consultando os metadados da API de Agregados, nunca fixados de memória. A diferença é exibida com a explicação de que a projeção corrige a subenumeração do Censo.
- R9.4 Com o IBGE fora do ar, a resposta é 200 com `available=false` e o último cache disponível.

## R10. API e não funcionais
- R10.1 Endpoints de `design.md`, documentados no OpenAPI, com erro padrão.
- R10.2 Paginação server-side (`page_size` ≤ 200) e filtros por `ano`, `cod`/`nivel`, `sexo` e `idade`/`grupo`.
- R10.3 `docker compose up` sobe MySQL 8 + API; `.env.example` incluso.
- R10.4 Pipeline completo da ds5 (140 mil linhas) em < 60 s; respostas de `/summary` em < 300 ms a partir do Parquet em cache.
