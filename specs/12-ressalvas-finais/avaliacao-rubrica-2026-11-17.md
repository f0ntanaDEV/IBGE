# Reavaliação contra a rubrica (17/11/2026)

**Repositório:** `github.com/f0ntanaDEV/IBGE`, commit `d516f58`, 35 commits. Desde a avaliação de 16/11 (`680966d`) entraram 5 commits e 117 arquivos mudaram.

**Produção:** `dash.clevo.com.br` roda o mesmo commit. O MySQL de produção foi consultado só para leitura.

**Painel:** o Databricks substitui o Power BI.

**Como verifiquei:**
- testes da API num clone limpo e de novo com a silver completa gerada por `run_all`;
- testes de carga num MySQL 8.0 local;
- carga completa da silver nesse MySQL;
- consulta ao banco de produção;
- a página `/databricks` aberta no navegador, sem login.

Legenda: ✅ atende · ⚠️ parcial · ❌ não atende. A estimativa é uma referência, não a nota do avaliador.

## Resumo

| Item | Peso | 16/11 | 17/11 | Estimativa |
|---|---:|---:|---|---:|
| 1. Repositório GitHub | 20% | 12–14 | ✅ | 17–19 |
| 2. Modelo e banco MySQL | 25% | 11–14 | ✅ no código · ❌ em produção | 18–23 |
| 3. Relatório de EDA | 20% | 9–12 | ✅ | 17–19 |
| 4. Painel Databricks | 25% | 15–19 | ⚠️ | 16–20 |
| **Total** | 100% | **47–59** | | **68–81** |

A faixa do item 2 depende de quem avalia olhar o banco publicado. **Hoje as cinco tabelas fato de produção estão vazias** (detalhes no item 2). Rodar a carga em produção leva o item para o topo da faixa e também destrava o item 4.

---

## 1. Repositório GitHub (20%)

| Critério | Situação | Evidência |
|---|---|---|
| Pastas raw/silver | ✅ | Estrutura no repositório:<br>• `data/raw/` com as 5 planilhas;<br>• `data/silver/README.md`;<br>• `data/silver/amostra/` com 5 Parquet, métricas e `golden.json` (≈ 520 KB).<br>A silver completa é gerada pelo ETL e fica fora do Git. |
| Código Python comentado | ✅ (com ressalva) | O teste `test_docstrings.py` garante docstring em toda função pública do pipeline, da carga, do schema, das ferramentas e das migrações.<br>Em todo o `app/`, porém, a cobertura é 104 de 408 funções e classes (25%), com 20 comentários em 6.357 linhas.<br>Rotas (`api/v1` 2/34), `domain` (3/42), `services/context` (0/30) e `services/facts` (1/48) seguem quase sem docstring.<br>Atende a rubrica no que ela pede (o pipeline), mas o resto do código ainda chama atenção. |
| .gitignore | ✅ | Ignora `.env`, o token do Databricks, a silver completa, `*.log`, `.DS_Store`, `.idea/`, `.vscode/`, `coverage/`, uploads e `*_sujo.xlsx`. |
| README detalhado com prompts de IA | ✅ | 182 linhas, com as 11 seções: objetivo, arquitetura em Mermaid, camadas, ETL passo a passo, modelo, EDA, Databricks, testes, deploy, débitos e os **11 prompts na íntegra**. O `PROMPTS.md` também tem os 11. |

**Ajustes pequenos:**
- O diagrama do README liga `MySQL ouro → API e React`, mas a API lê o Parquet da silver (`ParquetStore` em `api/v1/datasets.py`), não o MySQL. Por isso o site funciona hoje mesmo com as fatos vazias. O diagrama deveria mostrar `silver → API` e `MySQL → Databricks`.
- A seção de deploy cita as portas 8082, 8001 e 3306 do compose local. Não descreve o deploy real (bind em `192.168.0.37:80`, sem portas expostas para API e MySQL).

## 2. Modelo e banco MySQL (25%)

| Critério | Situação | Evidência |
|---|---|---|
| Modelagem (DER) | ✅ | `docs/DER.md` (290 linhas) em Mermaid `erDiagram`, com todas as colunas, tipos, PK, FK e CHECK, e a justificativa da desnormalização de `sigla/local/nivel`.<br>Novas: `dim_dataset` e a FK auto-referente `dim_territorio.regiao_cod`. |
| DDL com restrições | ✅ | `apps/api/sql/ddl_ouro.sql`, gerado do metadata por `dump_ddl`, tem **9 PRIMARY KEY, 7 FOREIGN KEY e 15 CHECK**: sexo, ano de 2000 a 2070, idade de 0 a 90, contagens ≥ 0, `nqx` de 0 a 1.<br>As fatos têm PK composta e NOT NULL. No banco: 38 colunas `BIGINT`, 94 `DECIMAL` e **nenhuma `FLOAT`**.<br>Conferido no `information_schema` depois da carga. |
| Carga automatizada na camada ouro, sem erros | ✅ no código · ❌ em produção | Ver as duas listas abaixo. |

**No código, a carga está correta:**
- A fonte `sujo` grava só `etl_runs`. A original faz `DELETE` + `INSERT` em lotes de 10 mil, numa transação só.
- `validate_golden` roda antes do commit. Se um valor diverge, há rollback e `etl_runs` fica `failed`. O atalho `_same_row_count` não existe mais.
- Carga completa no MySQL local: **52 s**, as 5 bases `success`, com:
  - soma do Brasil em 2026 = **214.211.951** (Homens 104.407.312, Mulheres 109.804.639);
  - **0** atípicos na ds1;
  - `ds4.pop_t` = 214.211.951, exato, sem o arredondamento do FLOAT;
  - e0 = 77,03; TFT = 1,51.
- Testes:
  - clone limpo: **47 passaram, 62 pulados**, por "base completa" e por falta de MySQL;
  - com a silver completa: **106 passaram, 3 pulados** (só os de MySQL);
  - com `TEST_MYSQL_URL`: **3 de 3** testes de carga passaram (restrições, idempotência, suja não substitui a original, rollback do golden).

**Em produção, as tabelas estão vazias:**
- O banco já está na revisão `003_restricoes_ouro`, que apaga e recria as fatos. Mas **`ds1` a `ds5` estão com 0 linhas**.
- O último registro em `etl_runs` é de 16/11 00:38, anterior à migração. A carga não rodou depois do upgrade (tarefa T11.14, a cargo do usuário).
- **Defeito que causa isso** (`core/startup.py`, `should_seed`): a semeadura automática só roda quando `etl_runs` não tem nenhum `success`. A 003 apaga as fatos, mas mantém `etl_runs`. Então o `AUTO_SEED=true` acha que já semeou e não recarrega.
- O rodapé do site mostra "MySQL ok" porque a verificação testa só a conexão, não o conteúdo.

**Correção:**
1. Rodar `docker compose exec api python -m app.tools.load_mysql_from_parquet` (cerca de 1 minuto).
2. Fazer `should_seed` verificar se as fatos têm linhas (ou o `alembic_version` da última carga), em vez de só procurar um `success` em `etl_runs`.

Melhoria opcional para a interface: o rodapé passaria a mostrar "MySQL vazio" quando `COUNT(*)` da ds1 for 0.

**Observação menor:** os CHECKs de ds3 e ds4 cobrem ano e contagens, mas não o domínio das taxas (por exemplo, `tft > 0`, `e0_* BETWEEN 0 AND 120`). A rubrica não exige.

## 3. Relatório de EDA (20%)

| Critério | Situação | Evidência |
|---|---|---|
| Documentação da análise | ✅ | `python -m app.tools.eda` gera `docs/eda/estatisticas.md` e 5 gráficos.<br>Ao rodar de novo sobre a silver completa, o `.md` saiu **idêntico** ao do repositório; só os PNG mudaram em bytes, por versão de fonte e de biblioteca.<br>`docs/RELATORIO_EDA.md` cita a origem de cada número. |
| Estatísticas descritivas | ✅ | Forma, tipos, nulos (com os 99 estruturais explicados), duplicatas e atípicos, antes e depois, para as 5 bases.<br>A diferença de 9.009 para 639.639 linhas está explicada (× 71 anos).<br>`describe` completo (média, mediana, desvio-padrão, mínimo, Q1, Q3, máximo) da população por idade e, entre UFs, de e0, TFT, IE60, idade mediana e nqx.<br>Tabela das 5 regiões e Pearson e0 × TFT = **-0,63**. Números com 2 casas. |
| Respostas às perguntas de negócio | ✅ | As 6 perguntas, cada uma com o número e o gráfico de origem, e uma seção de limitações.<br>`test_eda_ref` confere pico em 2041 (220.425.299), 2070 (199.228.708), cruzamento em 2029 e óbitos acima dos nascimentos em 2042. |

**Ajustes de acabamento:**
- **Pirâmide:** eixo em notação `1e6` (melhor "mi" no formato pt-BR). O grupo aberto 90+ aparece como uma barra solta, sem rótulo, e não há legenda de Homens e Mulheres.
- **Dispersão e0 × TFT:** os pontos não têm a sigla da UF.
- **O relatório não cita o cruzamento de 2042** (óbitos acima dos nascimentos), que está em `estatisticas.md`.
- **`describe` do nqx:** mistura todas as idades, o que torna a média (0,12) pouco interpretável. Melhor mostrar o nqx de uma idade (por exemplo, 0 ou 60).

## 4. Painel Databricks (25%)

| Critério | Situação | Evidência |
|---|---|---|
| Painel interativo | ✅ | Desde o commit `5bcfa6f`, a API emite o token de embed com um service principal. **A página `/databricks` abre o painel sem login**: verifiquei sem sessão no Databricks, e a página mostra "Powered by Databricks". Os filtros (Região, UF, Ano) funcionam no embed. |
| Conectado ao MySQL | ⚠️ (só no código) | O repositório tem o export MySQL → Volume (`export_gold.py`, com teste e alvo `make export-databricks`), `00_catalogo.sql` lendo `ouro_mysql` e a variante Federation documentada.<br>**Mas o export nunca rodou:** não há execução `export_databricks` em `etl_runs` de produção, e hoje o MySQL está vazio. O painel publicado continua alimentado pela carga anterior. |
| Medidas corretas | ⚠️ | Existe `99_validacao.sql`, com 10 verificações de linhas e valores de referência, mas não há registro do resultado (todo `ok`). |
| KPIs | ✅ | O painel publicado mostra população total, variação contra o ano anterior, UF mais populosa e UFs com dado. |
| Layout profissional e navegabilidade | ⚠️ | Ver a lista de divergências abaixo. |

**Divergências entre o painel publicado e o repositório:**
- **Páginas:** o publicado tem **3 abas** ("População", "Indicadores no Tempo", "Comparativo por UF"). O repositório e a documentação descrevem **7 páginas** (visão geral, ds1 a ds5 e qualidade).
- **Ano:** o filtro abre em **2070** ("padrão: mais recente"). A spec e a documentação dizem 2026, e o 2070 faz o KPI de abertura mostrar 199,23 mi em vez de 214,21 mi.
- **Formato:** números em padrão inglês ("199.23M", "-0.01"); a variação não tem unidade nem %.
- **Filtros e KPIs confusos:** há um filtro "Município (fonte sem dados municipais)", que não filtra nada, e um KPI "Municípios com dado: 27" que na verdade conta UFs.
- **Tabela:** "UF mais populosa" mostra nomes técnicos de coluna.
- **Faltam a T11.11 e o PDF:** não há `docs/screenshots/databricks/` nem `docs/painel-databricks.pdf`. Agora que o embed é público, isso pesa menos: o avaliador pode abrir o site.

---

## O que falta para fechar (por ordem de impacto)

1. **Recarregar a ouro em produção** e corrigir `should_seed` para olhar as fatos, não só `etl_runs`. Item 2: carga "sem erros" de fato.
2. **Rodar o export para o Databricks e republicar a partir dos SQL do repositório.**
   - Ou publicar as 7 páginas, ou ajustar a documentação para as 3 abas reais.
   - Ano padrão 2026, formato pt-BR, sem o filtro e o KPI de município.
   - Rodar `99_validacao.sql` e registrar o resultado. Item 4: "conectado ao MySQL" e "medidas corretas".
3. **Capturas das páginas do Databricks** em `docs/screenshots/databricks/` e, se possível, o PDF.
4. **Acabamento da EDA:** eixos em pt-BR, legenda e rótulo do 90+ na pirâmide, siglas na dispersão, 2042 no relatório.
5. **README:** diagrama fiel (`silver → API`, `MySQL → Databricks`) e deploy real.
6. **Opcional:** docstrings em `api/v1`, `domain`, `context` e `facts` para elevar a cobertura geral (hoje 25%).
