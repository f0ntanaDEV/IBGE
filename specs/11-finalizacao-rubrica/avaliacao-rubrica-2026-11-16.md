# Avaliação contra a rubrica de entregáveis (16/11/2026)

Repositório: `github.com/f0ntanaDEV/IBGE`, commit `680966d` ("Ajustes finais V1", 30 commits). Banco: MySQL em produção (`dash.clevo.com.br`), consultado só para leitura. Painel Power BI → considerado **Databricks (Lakeview / AI/BI)**, conforme combinado.

Legenda: ✅ atende · ⚠️ parcial · ❌ não atende. A nota estimada é uma referência, não a nota do avaliador.

## Resumo
| Item | Peso | Situação | Estimativa |
|---|---:|---|---:|
| 1. Repositório GitHub | 20% | ⚠️ | 12–14 |
| 2. Modelo & Banco MySQL | 25% | ⚠️ (com falha grave em produção) | 11–14 |
| 3. Relatório de EDA | 20% | ⚠️ | 9–12 |
| 4. Dashboard (Databricks) | 25% | ⚠️ | 15–19 |
| **Total** | 100% | | **47–59** |

---

## 1. Repositório GitHub (20%)
| Critério | Situação | Evidência |
|---|---|---|
| Organização de pastas (raw/silver) | ⚠️ | `data/raw/` com as 5 planilhas ✅. A camada silver fica em `data/processed/`, que está no `.gitignore` (não existe no repositório) e não se chama `silver`. O README explica, mas quem abre o repo não vê a pasta. |
| Código Python comentado | ❌ | 92 arquivos Python: 84% têm docstring de módulo, mas só **42 de 363 funções/classes (11%)** têm docstring e há **6 linhas de comentário em 5.542** linhas de código. As etapas do pipeline (`services/cleaning/`), a carga (`services/loader.py`) e as regras não explicam as decisões no código. |
| .gitignore adequado | ✅ | Ignora `.env`, `data/processed/`, caches, `node_modules`, builds e relatórios de teste; `.env.example` versionado. Faltam itens comuns (`*.log`, `.DS_Store`, `.idea/`, `.vscode/`, `coverage/`), o que é detalhe menor. |
| README.md detalhado com prompts de IA | ⚠️ | README com 84 linhas: instalação, camadas, telas e prompts. Mas: (a) diz que as etapas são **dez** (`specs/01` a `10`) e documenta **só os prompts 1 a 4**, e o `PROMPTS.md` também só tem 4; (b) a seção "Débitos" está desatualizada (cita "Modo leve", que foi removido); (c) faltam arquitetura, passo a passo do ETL, como rodar os testes, deploy e o dicionário de dados. |

## 2. Modelo & Banco MySQL (25%)
| Critério | Situação | Evidência |
|---|---|---|
| Modelagem relacional (DER) | ⚠️ | `docs/DER.md` (Mermaid) com `dim_territorio`, `dim_metrica`, `etl_runs` e 5 fatos ligados por `cod` ✅. Porém: o DER mostra só as chaves (as colunas das fatos ficam de fora); as fatos repetem `sigla`, `local` e `nivel`, que já estão em `dim_territorio` (desnormalização sem justificativa); `regiao_cod` não tem FK; `etl_runs.dataset_id` não referencia nada. |
| Script DDL com restrições | ⚠️ | `apps/api/sql/ddl_ouro.sql` (244 linhas) com PK nas dimensões, **FK de `cod`** e **UNIQUE** nas chaves das fatos ✅ (confirmados no banco de produção). Porém: as fatos **não têm PRIMARY KEY**, e as colunas da chave (`idade`, `sexo`, `cod`, `ano`) **aceitam NULL**, o que deixa o UNIQUE passar duplicatas com nulo; **nenhum CHECK** (ex.: `sexo IN (…)`, `ano BETWEEN 2000 AND 2070`, `populacao >= 0`, `nqx BETWEEN 0 AND 1`); contagens de pessoas em **`FLOAT`**. |
| Carga automatizada na camada Ouro **sem erros** | ❌ | `python -m app.tools.load_mysql_from_parquet` + `services/loader.py`: staging, troca atômica e registro em `etl_runs` ✅. **Mas o banco de produção está com os dados errados:**<br>• **A camada ouro contém a base de demonstração (suja).** Soma das idades do Brasil em 2026 no MySQL: **214.228.430** (correto: 214.211.951), com **3.330 linhas marcadas como atípicas** na ds1 (no Parquet original: 0). Causa: `_same_row_count()` marca a carga como sucesso **sem recarregar** quando o número de linhas é igual. Como a semeadura carrega a base suja e depois a original, que têm o mesmo número de linhas (639.639), a original nunca substitui a suja. O comentário do código diz que o atalho foi criado para economizar espaço no Railway.<br>• **Perda de precisão:** `FLOAT` (precisão simples) só representa inteiros exatos até 16.777.216. No banco, `pop_t` do Brasil em 2026 está **214.211.952** em `ds3` e `ds4`.<br>• **Sem teste da carga:** nenhum dos 18 arquivos de teste usa `load_mysql` ou um banco. Num clone limpo, 35 testes passam e 58 são pulados por falta do Parquet gerado.<br>• A carga monta todas as 639 mil linhas em memória antes de inserir, o que é coerente com a queda da API observada em 12/11. |

## 3. Relatório de EDA (20%)
| Critério | Situação | Evidência |
|---|---|---|
| Documentação da análise exploratória | ⚠️ | `docs/RELATORIO_EDA.md` (513 palavras). O próprio texto declara: "**Nenhum número foi recalculado nas planilhas**". Os valores foram transcritos de specs, não há script ou notebook que gere a análise e não há gráficos. |
| Estatísticas descritivas | ❌ | Há contagens de linhas e alguns valores por ano, mas não há média, mediana, desvio-padrão, quartis, mínimo e máximo por métrica, distribuições, correlações ou comparação entre territórios. Números com **13 casas decimais** ("2,3155517895268"). A tabela da ds1 informa 9.009 linhas (formato largo) enquanto o pipeline trabalha com 639.639, sem explicar a diferença. |
| Respostas às perguntas de negócio | ✅ | Seis perguntas respondidas, alinhadas às páginas do painel: crescimento até 2041, envelhecimento, faixas que crescem e encolhem, cruzamento em 2029, esperança de vida e fecundidade, tábuas de mortalidade. |

## 4. Dashboard: Databricks no lugar do Power BI (25%)
| Critério | Situação | Evidência |
|---|---|---|
| Painel interativo | ✅ | Lakeview com **7 páginas** (`databricks/paginas/*.sql`), camadas bronze → silver → gold (`00_catalogo.sql`, `01_silver.sql`, `02_gold.sql`; 633 linhas de SQL) e documentação em `docs/PAINEL_DATABRICKS.md`. |
| Conectado ao MySQL | ❌ | O documento afirma: "o painel **não abre conexão** JDBC com o MySQL". O Databricks lê o Parquet de `data/processed/` enviado para um Volume. A rubrica pede o painel ligado ao banco. Hoje, aliás, os dois divergem: o Parquet está correto e o MySQL está com a base suja (item 2). |
| Medidas corretas (DAX → SQL) | ⚠️ | As medidas são views gold e SELECTs por página, documentadas por KPI. Não há testes nem conferência com os valores de referência no Databricks. A página Indicadores consulta `silver` direto, não uma view gold. |
| Indicadores de KPI | ✅ | Contadores por página (população, esperança de vida, filhos por mulher, índice de envelhecimento etc.). Não há status nem meta como no app. |
| Layout profissional e navegabilidade fluida | ⚠️ (não verificável) | O dashboard publicado exige **login no workspace**: o embed no site mostra a tela de login, e eu também não consegui ver as páginas. Não há capturas das páginas do Databricks no repositório (só do app). Os filtros dependem de "quando o comentário do SQL declara o parâmetro". |

---

## Prioridades para subir a nota
1. **Corrigir a camada ouro (urgente, item 2):** remover o atalho `_same_row_count` (ou trocar por comparação de hash ou `run_id`); nunca carregar a base suja nas tabelas ouro (usar tabelas ou schema `demo_` separados); recarregar a base original em produção; e validar após a carga (soma do Brasil = 214.211.951; atípicos = 0) com falha se divergir.
2. **DDL:** PRIMARY KEY composta e `NOT NULL` nas chaves das fatos; `BIGINT` para contagens e `DECIMAL` para taxas; CHECKs de domínio; FK em `regiao_cod` e em `etl_runs`. Remover as colunas repetidas das fatos ou justificar. DER completo, com todas as colunas e tipos.
3. **Teste da carga** com MySQL real (container no teste ou no CI), conferindo as contagens e os valores de referência no banco.
4. **EDA reproduzível:** um notebook ou script que calcule a partir dos dados: forma, tipos, nulos, duplicatas, `describe()` das métricas principais, distribuições e gráficos, comparação entre regiões e correlação entre esperança de vida e fecundidade por UF. Gerar o relatório com 1–2 casas decimais e gráficos, ligando cada resposta ao número calculado.
5. **Databricks ligado ao MySQL:** Lakehouse Federation ou JDBC para o MySQL ouro (exige que o Databricks alcance o servidor, por túnel ou IP liberado), ou uma exportação documentada MySQL ouro → Volume. Acrescentar capturas de todas as páginas em `docs/` e liberar o acesso para quem vai avaliar.
6. **Repositório:** prompts 5 a 10 no README e no `PROMPTS.md`; README com arquitetura, ETL, testes e deploy; seção "Débitos" atualizada; pasta `data/silver/` (ou renomear `processed` e versionar um `README` e uma amostra); docstrings e comentários explicando as decisões no pipeline e na carga.
