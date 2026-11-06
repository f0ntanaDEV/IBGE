# Etapa 3: Requisitos (Dashboards, notícias e acabamento)

Mantenha estritamente o design system da Etapa 2. Não introduza cores nem estilos novos.

## R1. Filtros globais
- R1.1 Seletor de **território** (Brasil → região → UF, agrupado por nível), **ano** (2000–2070, padrão = ano atual) e **sexo** (Ambos/Homens/Mulheres), quando o dataset tiver sexo.
- R1.2 Os filtros DEVEM ser sincronizados com a URL e mantidos ao trocar de dashboard.
- R1.3 Anos futuros DEVEM ser identificados visualmente como **projeção** (linha tracejada após o ano atual e o rótulo "projetado").

## R2. Visão Geral
- R2.1 KPIs (Brasil, ano atual): população, esperança de vida, taxa de fecundidade e índice de envelhecimento, cada um com a variação em relação a 10 anos antes.
- R2.2 Gráfico da população 2000–2070 com destaque no **pico (2041)**.
- R2.3 Cards dos 5 datasets com status do último ETL e link.
- R2.4 Bloco "Fatos confirmados": os `claims` com o valor calculado e a notícia do IBGE que o confirma.

## R3. Dashboards (um por dataset)
Estrutura comum: header (nome, fonte "IBGE, Projeções da População – Revisão 2024", último processamento, ações Reprocessar / Baixar / Enviar arquivo) → KPIs → gráficos → fatos e notícias → tabela.

- R3.1 **ds1 – Idade simples**
  - KPIs: população total, % 0–14, % 60+, idade mediana (calculada).
  - **Pirâmide etária** por idade simples (homens à esquerda, mulheres à direita), com slider de ano e reprodução automática opcional (desligada no Modo leve).
  - Comparação de duas pirâmides sobrepostas (ano A em contorno, ano B preenchido).
- R3.2 **ds2 – Grupo quinquenal**
  - KPIs: maior grupo etário, população 0–4, população 80+ e razão 80+/0–4.
  - Pirâmide quinquenal com comparação 2000 × ano escolhido × 2070.
  - Área empilhada 100% da composição por grandes faixas (0–14, 15–59, 60+) ao longo do tempo.
- R3.3 **ds3 – Grupos específicos**
  - KPIs: % 0–14, % 15–64, % 65+ e % 80+.
  - Linhas 0–14 × 60+ (proporções) com marcação do **ano de cruzamento**.
  - Ranking de UFs pela % 60+ no ano selecionado (barras horizontais).
- R3.4 **ds4 – Indicadores**
  - KPIs: e0, TFT, TMI e índice de envelhecimento (IE60).
  - e0 de homens × mulheres ao longo do tempo.
  - TFT com **linha de referência 2,1 (reposição)**.
  - TBN × TBM com a área do crescimento vegetativo entre elas.
  - Ranking de UFs por indicador selecionável (e0, TFT, TMI, IE60, idade mediana).
- R3.5 **ds5 – Tábuas de mortalidade**
  - KPIs: e0, e60, probabilidade de morte antes de 1 ano (`nqx` na idade 0) e sobreviventes aos 80 anos por 100 mil (`lx`).
  - Curva de sobrevivência `lx` por idade (homens × mulheres) para o ano e local escolhidos.
  - `nqx` por idade em **escala logarítmica**, comparando dois anos.
  - `ex` por idade.
- R3.6 Toda métrica mostra rótulo amigável e unidade (do dicionário de métricas), com tooltip explicando a sigla (ex.: "TFT: número médio de filhos por mulher").
- R3.7 Card "Referência Censo 2022" (ds1, ds3 e ds4): população projetada × recenseada, diferença % e uma nota curta explicando a correção de subenumeração.
- R3.8 Tabela dos dados tratados com paginação, ordenação, busca e destaque das linhas com `is_outlier`.
- R3.9 Configuração em `dashboards.config.ts`; gráficos especiais (pirâmide, linha de referência, escala log, marcação de ano) são componentes reutilizáveis.

## R4. Qualidade de Dados (`/quality`)
- R4.1 Por dataset: antes/depois de linhas, nulos (estruturais separados), duplicatas por tipo e outliers por motivo.
- R4.2 Lista das validações de consistência com status ok/falha e maior diferença.
- R4.3 Alternância **Base original × Base de demonstração (suja)**, para evidenciar o tratamento.
- R4.4 Histórico de execuções.

## R5. Upload e processamento
- R5.1 Dialog com dropzone (.csv/.xlsx), validação de colunas obrigatórias e prévia de 10 linhas.
- R5.2 Opções avançadas recolhidas: método e estratégia de outliers (padrão `flag`) e limite de nulos. Escolher `cap`/`remove` na base oficial abre um diálogo de confirmação explicando o impacto.
- R5.3 Stepper: Upload → Tratamento → Validação → Nova base → MySQL, com erro claro na etapa que falhar.
- R5.4 Ao concluir, mostrar o resumo do relatório e atualizar o dashboard.

## R6. Notícias (`/news`)
- R6.1 Feed com filtro por dataset/tema, busca e paginação.
- R6.2 Quando `available=false`, exibir aviso discreto e o conteúdo em cache.

## R7. Desempenho e entrega
- R7.1 Code splitting por rota, `staleTime` ≥ 5 min (dados de projeção não mudam) e memoização dos dados de gráficos.
- R7.2 Troca de ano na pirâmide em < 100 ms após o primeiro carregamento (pré-busca do intervalo de anos ou transformação no cliente).
- R7.3 Tudo respeita tema e Modo leve; gráficos com descrição acessível.
- R7.4 `docker compose up` sobe web (nginx), API e MySQL; README final com screenshots.
