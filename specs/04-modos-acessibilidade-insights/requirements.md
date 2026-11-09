# Spec 10: Requisitos (Modos de navegação, acessibilidade, fatos, Insights e correções de backend)

Prevalece sobre as specs 01–03. O estado vigente da interface está em `.cursor/rules/01-project.mdc`; nada ali pode ser reintroduzido (animações, busca, Expandir, sidebar recolhível).

Conteúdo pronto (não reescrever, apenas transcrever):
- `conteudo/fatos.md`: catálogo de fatos por página, com fórmulas e valores de referência;
- `conteudo/insights.md`: perguntas e respostas da página Insights;
- `conteudo/padroes.md`: padrões encontrados nas 5 tabelas.

---

# Parte A: UI/UX

## R1. Modo de alto contraste
- R1.1 Em Configurações, seção **Acessibilidade**: interruptor **"Alto contraste"**. O estado é persistido (store com `persist`, leitura e escrita em try/catch) e aplicado antes do primeiro render (script anti-flash, junto do tema).
- R1.2 Quando o usuário nunca escolheu, o padrão segue `prefers-contrast: more`.
- R1.3 Funciona combinado com os temas claro e escuro (4 combinações). O atributo é `data-contrast="high"` no `<html>`.
- R1.4 Com alto contraste ativo:
  - todo texto (inclusive secundário, placeholders, eixos, legendas e desabilitados) com contraste **≥ 7:1** (WCAG AAA);
  - bordas de cards, inputs e divisores com **2 px** e contraste ≥ 4,5:1 com o fundo;
  - anel de foco de **3 px** sólido, com 2 px de afastamento, em todo elemento focável;
  - links sempre sublinhados;
  - sem opacidade reduzida e sem texto sobre fundos translúcidos;
  - botões só com ícone ganham rótulo de texto visível, ou ficam com `aria-label` e tooltip quando não houver espaço.
- R1.5 Gráficos em alto contraste:
  - linhas com 2,5 px e **padrão de traço distinto por série** (contínua, tracejada, pontilhada), além de marcadores de formas diferentes;
  - barras com contorno de 1,5 px;
  - paleta de alto contraste própria (`--hc-chart-1..6`), com contraste ≥ 3:1 entre séries vizinhas e com o fundo;
  - mapa de calor e mapa coroplético em escala monocromática com 5 classes nitidamente separadas (sem interpolação contínua), rótulos de valor na legenda;
  - grade e eixos com contraste ≥ 4,5:1.
- R1.6 Suporte a `forced-colors: active` (Alto Contraste do Windows): sem cores fixas que sumam; SVGs usam `currentColor`/`CanvasText`; o foco continua visível.
- R1.7 Verificação: `axe-core` com a regra `color-contrast-enhanced` sem violações em todas as rotas com alto contraste ativo, nos temas claro e escuro.

## R2. Modo de navegação: Técnico × Simples
- R2.1 Em Configurações, seção **Modo de navegação**, controle segmentado **"Técnico | Simples"** (padrão: Técnico), persistido. A troca é imediata e preserva os filtros.
- R2.2 **Modo Simples** (todas as páginas de dados: Visão Geral, os 5 datasets e Qualidade):
  - **nenhum gráfico** é exibido (nem sparklines, mapas ou pirâmides), nem DataTable, Observações finais ou botões de exportação;
  - a página tem: cabeçalho → filtros (Território e Ano) → KPIs → **um único bloco "Entenda os dados"**;
  - o bloco contém **várias categorias de explicação** em texto simples (ver R2.4), com um índice no topo que leva a cada categoria;
  - a página de Notícias, a de Insights e a de Configurações não mudam.
- R2.3 **Números simplificados** no modo Simples, em KPIs e em todo texto da página:

  | Valor | Exibição |
  |---|---|
  | 214.211.951 | **214 mi** (≥ 100 na unidade: sem casa decimal) |
  | 8.542.314 | **8,5 mi** (< 100 na unidade: 1 casa) |
  | 1.284 | **1,3 mil** |
  | < 1.000 | sem alteração |
  | 17,13% | **17%** |
  | 11,83‰ | **12 a cada mil** |
  | 77,03 anos | **77 anos** |
  | 1,51 filho por mulher | **1,5 filho por mulher** |
  | Ano | sem alteração, sem ponto ("2026") |

  No modo Técnico, os números continuam exatos.
- R2.4 Categorias do bloco "Entenda os dados" (as que se aplicarem a cada página, mínimo 5):
  1. **O que esta página mostra**: 2–3 frases fixas por página.
  2. **Como está hoje** (ano selecionado): 3–4 frases com os indicadores principais.
  3. **Como era em 2000**: comparação com o início da série.
  4. **Para onde vamos (2070)**: tendência projetada.
  5. **Homens e mulheres**: diferenças entre os sexos (ds1, ds4, ds5).
  6. **Comparando territórios**: o território selecionado comparado ao Brasil, ou o Brasil comparado às regiões.
  7. **Fatos em destaque**: os fatos da página (R4), em texto corrido e com números simplificados.
  8. **O que isso significa no dia a dia**: 2–3 frases fixas por página.
  9. **Notícias do IBGE**: até 3 links com título e data.
- R2.5 Os textos variáveis vêm do motor de narrativas com um registro "simples": frases curtas (≤ 20 palavras), voz ativa e nenhuma sigla sem explicação.
- R2.6 Página de Qualidade no modo Simples: KPIs (linhas, nulos tratados, duplicatas, outliers) e o bloco com as categorias "O que é tratamento de dados", "O que encontramos", "O que fizemos", "Como conferimos" e "Resultado".

## R3. Anos sem separador de milhar
- R3.1 Em toda a aplicação (eixos, tooltips, tabelas, filtros, selects, slider, breadcrumbs do drill, narrativas, fatos, insights, exportações e `aria-label`), anos são exibidos como "2000", "2026" e "2070", **nunca** como "2.000".
- R3.2 Causa a eliminar: anos formatados como número com agrupamento. A métrica de ano passa a ter `kind: 'year'`, e qualquer coluna `ano`/`year` é mapeada para esse tipo.
- R3.3 Teste E2E: nenhum texto ou atributo `aria-*`/`title` corresponde a `/\b2\.0[0-7]\d\b/` em nenhuma rota, nos dois modos.

## R4. Fatos (modo Técnico)
- R4.1 **Todas** as páginas de dados têm fatos: Visão Geral, os 5 datasets e Qualidade. O catálogo completo está em `conteudo/fatos.md`.
- R4.2 Cada página exibe **de 6 a 10 fatos**, um por linha (rótulo, valor e, se houver, referência na mesma linha), em uma única coluna. O bloco fica no card **"Fatos"** de largura total (12 colunas). O modo Simples usa a mesma lista, sem cortar em 4 itens.
- R4.3 O antigo card "Contexto" passa a conter **apenas** a Referência Censo 2022 nas páginas que a têm (Visão Geral, ds1, ds3, ds4). Nas páginas sem Censo (ds2, ds5), o gráfico principal ocupa 12 colunas.
- R4.4 **Fatos por território** (detalhe na Parte B, R7): com Território = Brasil ou uma região, os fatos refletem esse território. Com uma UF selecionada, os fatos **não mudam** (permanecem os do último território válido), e o card mostra a nota "Fatos de: Nordeste" (o território a que se referem).
- R4.5 Ano e Sexo **não alteram** os fatos (o ano de referência é 2026; marcos são anos fixos).
- R4.6 Valores via `formatValue` (exatos no Técnico, simplificados no Simples).

## R5. Página Insights
- R5.1 Nova rota `/insights` e item **"Insights"** na sidebar (ícone `Lightbulb`), entre "Qualidade de dados" e "Notícias IBGE".
- R5.2 Estrutura da página:
  - cabeçalho com uma frase de propósito e o ano de referência ("Valores das Projeções da População, Revisão 2024; ano de referência 2026");
  - índice com âncoras para cada seção;
  - **uma seção por página de dados**: Visão Geral, População por idade, Grupos quinquenais, Grupos etários, Indicadores, Tábuas de mortalidade e Qualidade de dados. Cada seção tem o link "Ir para a página" e **5 perguntas estratégicas** com respostas;
  - seção final **"Padrões dos dados"** com o conteúdo de `conteudo/padroes.md`.
- R5.3 Perguntas e respostas são transcritas **sem alteração** de `conteudo/insights.md` para `apps/web/src/content/insights.ts` (array tipado). Os números dos textos são fixos.
- R5.4 Cada resposta é exibida com largura máxima de `72ch` e deve ocupar **de 7 a 12 linhas** em 1280 px (o conteúdo já foi escrito para isso, com 90 a 150 palavras). Um teste E2E mede `altura / line-height` de cada resposta e falha fora do intervalo.
- R5.5 Todas as respostas aparecem expandidas (sem accordion), com a pergunta como `h3`. Não há gráficos na página.
- R5.6 A página é igual nos dois modos de navegação e respeita o alto contraste.

## R6. Rodapé, favicon e notícias
- R6.1 Rodapé global, em todas as páginas, alinhado à direita: **"@f0ntanaDEV"** com link para `https://github.com/f0ntanaDEV` (`target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Perfil de f0ntanaDEV no GitHub (abre em nova aba)"`) e ícone `ArrowUpRight`. Sem logotipo do GitHub. O indicador de status da API (`/health`) permanece à esquerda.
- R6.2 **Favicon**: usar os arquivos prontos de `assets/favicon/` (mini pirâmide etária em tons neutros), copiados para `apps/web/public/`, com as tags no `index.html` conforme o design.
- R6.3 **Cards de notícias**: o link **"Ler notícia"** fica no **canto inferior direito** do card, em todas as listas de notícias (página Notícias, seções de notícias dos dashboards e Visão Geral). Cards da mesma linha têm a mesma altura e o link fica sempre na base, mesmo com resumos de tamanhos diferentes.

## R7. Configurações
- R7.1 Layout: [Aparência 6 · Acessibilidade 6] · [Modo de navegação 12].
  - Aparência: tema (Claro, Escuro, Sistema).
  - Acessibilidade: alto contraste.
  - Modo de navegação: Técnico | Simples, com uma frase explicando cada opção.

---

# Parte B: Backend

## R8. Página Qualidade de Dados sem estatísticas
- R8.1 **Diagnóstico obrigatório** antes de corrigir, registrando a causa em `DECISIONS.md`. Verificar nesta ordem:
  1. se existem registros em `etl_runs` (o pipeline pode nunca ter rodado no ambiente Docker);
  2. se `/datasets/{id}/quality-report` retorna 200 com conteúdo ou `null`/404;
  3. se `report_json` é desserializado (está gravado como string JSON e não é convertido?);
  4. se os nomes dos campos batem com o que o frontend lê (snake_case × camelCase, campos renomeados);
  5. se o parâmetro `source` (original × sujo) está sendo enviado e tratado;
  6. se os tipos de `packages/shared` foram regenerados após mudanças na API.
- R8.2 Contrato fixo do relatório: schema em `design.md` §6, com resposta tipada pelo Pydantic e tipos regenerados no frontend.
- R8.3 **Semeadura automática**: com `AUTO_SEED=true` (padrão em desenvolvimento e no `docker-compose`), ao iniciar, a API processa as 5 bases originais e as 5 sujas **se não houver nenhuma execução bem-sucedida**. Também existe o comando `make seed`.
- R8.4 A página mostra, por dataset: linhas antes/depois, nulos (estruturais à parte), duplicatas por tipo, outliers por motivo, validações (ok/falha) e o histórico de execuções. Sem nenhuma execução, exibe um estado vazio com o botão "Processar bases agora", nunca zeros falsos.
- R8.5 Teste de integração: após a semeadura, `quality-report` de cada dataset retorna `rows_in > 0` e `validations` não vazio. Teste E2E: a página exibe números diferentes de "—".

## R9. Erro ao voltar para "Brasil" no filtro de território
Cenário: o filtro começa em Brasil → o usuário escolhe outro território → volta para Brasil → a aplicação mostra erro e nenhum dado.
- R9.1 **Reproduzir com um teste** (E2E e de integração da API) antes de corrigir, e registrar a causa em `DECISIONS.md`.
- R9.2 Causas a verificar (a mais provável é o código 0 do Brasil tratado como "falso"):
  - frontend: `if (cod)`, `cod || undefined`, `cod && …`, helpers que removem parâmetros "falsy" da URL ou da query string, `Number('')`, `Select` com valor `"0"` convertido de forma errada, query key que não muda;
  - backend: `if not cod:`, `cod: int = Query(...)` obrigatório sem valor, `cod or None` levando a SQL `cod = NULL`, cache indexado com chave `None`;
  - estado residual: seleção cruzada ou drill (`sel_uf`, `d_<chart>`) de outro território que continua na URL ao voltar para o Brasil e conflita com `cod=0`.
- R9.3 Correção:
  - no frontend, verificar `cod != null` (nunca truthiness); trocar de território limpa a seleção cruzada e os drills territoriais incompatíveis;
  - no backend, `cod: int | None = Query(None, ge=0)` com `is None` explícito e `cod=0` como valor válido;
  - parâmetros conflitantes resultam em 422 com mensagem clara, nunca em 500.
- R9.4 Teste de regressão para **todos** os endpoints que recebem `cod`: sequência 0 → 29 → 0 → 2 → 0, todas as respostas 200 com dados.
- R9.5 Qualquer falha de consulta mostra o `ErrorState` com "Tentar novamente", e não uma página vazia.

## R10. Fatos personalizados por território (backend)
- R10.1 Endpoint `GET /api/v1/facts?page=<pageId>&cod=<0..5>`, com `pageId` em `overview | ds1 | ds2 | ds3 | ds4 | ds5 | quality`. Retorna de 6 a 10 fatos, conforme `conteudo/fatos.md`.
- R10.2 `cod` aceita **somente** 0 (Brasil) e 1–5 (regiões). Uma UF retorna 422 `territory_not_supported`, e o frontend nunca envia UF (R4.4). Para `page=quality`, `cod` é ignorado.
- R10.3 Cada fato é **calculado dos dados** (Parquet em cache) por uma função registrada em `services/facts/`, nunca escrito à mão. Os valores de `conteudo/fatos.md` são os testes golden (Brasil e Nordeste).
- R10.4 Fatos que citam UFs ("UF com maior…") consideram apenas as UFs do território selecionado (todas no Brasil; as da região numa região).
- R10.5 Resposta em cache por `(page, cod)` até o próximo processamento do ETL.
- R10.6 Desempenho: < 150 ms por chamada com cache quente.

## R11. Verificação final
- R11.1 Suítes web, api e e2e verdes.
- R11.2 E2E cobrindo:
  - modo Simples sem nenhum `svg`/`canvas` de gráfico nas páginas de dados;
  - números compactos no modo Simples;
  - anos sem ponto;
  - alto contraste (axe);
  - rodapé com o link correto;
  - favicon carregado (`link[rel=icon]` responde 200);
  - "Ler notícia" no canto inferior direito (posição relativa ao card);
  - 6–10 fatos por página;
  - fatos mudando entre Brasil e Nordeste e **não** mudando ao escolher uma UF;
  - Insights com 7 seções × 5 perguntas e respostas de 7 a 12 linhas;
  - regressão do R9;
  - Qualidade com números.
- R11.3 Screenshots em `e2e/__screenshots__/` dos dois modos, nos dois temas, com e sem alto contraste, em 1280 px.
