# Etapa 8: Requisitos (Remoções, dialogs laterais, alturas, equilíbrio, animações sincronizadas e sidebar)

Etapa de frontend, com ajuste pontual na API (R1.3). **Ela prevalece sobre todas as anteriores** (ver "Itens substituídos" no fim).

## R1. Remover a busca por completo
- R1.1 Não pode restar **nenhuma** forma de busca: `input type="search"`, campos "Buscar…", `CommandInput`/`Command` (cmdk), comboboxes com digitação para filtrar, command palette, atalhos (`Ctrl/⌘ + K`, `/`), filtros de texto em tabelas, listas ou Notícias, debounce de busca e textos/i18n relacionados.
- R1.2 Os seletores (território, ano, sexo, indicador) são `Select` simples, sem campo de digitação.
- R1.3 API: remover o parâmetro `q` de `/datasets/{id}/data` e de qualquer outro endpoint, junto com seus testes. A busca interna da API do IBGE por palavras-chave do dataset (`busca=` em notícias) **permanece**, pois não é uma busca do usuário.
- R1.4 Remover dependências que ficarem sem uso (ex.: `cmdk`).
- R1.5 Verificação: o `grep` de `design.md` §1 retorna vazio.

## R2. Remover o modo simplificado
- R2.1 Remover a alternância "Completa | Simplificada", o diálogo de boas-vindas, a opção em Configurações, o parâmetro `?visao`, o atributo `data-view`, os campos `view`/`onboardingSeen` da store, o campo `simple` dos `DashboardSpec`, o botão "Ver dados completos", os títulos em forma de pergunta e os nomes amigáveis da sidebar exclusivos desse modo, os templates de narrativa "leiga" e o teste de vazamento da Etapa 4.
- R2.2 Manter: `formatValue` (sem o parâmetro `view`), o glossário (apenas `rotuloTecnico`, `explicacao` e `unidade`) e o popover "?" com a explicação.
- R2.3 A sidebar usa os nomes dos datasets: "População por idade", "Grupos quinquenais", "Grupos etários", "Indicadores" e "Tábuas de mortalidade".
- R2.4 Valores na interface seguem o formato completo pt-BR. Eixos continuam compactos (decisão da Etapa 7).

## R3. Dialogs e popovers: voltar ao padrão, com posicionamento lateral
- R3.1 Reverter os overlays da Etapa 7 (`CardModal`/`OverlayHost`) para os componentes padrão do shadcn (Radix `Popover`, `DropdownMenu`, `Dialog`, `AlertDialog`) renderizados em portal.
- R3.2 **Popovers e menus de card** ("?" do glossário, menu "⋯") ancoram no **card** (não no ícone) e abrem **ao lado** dele:
  - card com centro na **metade esquerda** da área de conteúdo → abre à **direita** do card;
  - card com centro na **metade direita** → abre à **esquerda** do card;
  - alinhamento vertical: topo do popover alinhado ao topo do card (`align="start"`), com deslocamento de 8 px.
- R3.3 Se o lado escolhido não tiver espaço (≥ 280 px), usar o lado oposto. Se nenhum tiver (ex.: card de largura total ou mobile), abrir **abaixo** do card, com a largura do card. O popover nunca ultrapassa a viewport (margem de 16 px) e nunca cria rolagem horizontal.
- R3.4 Dialogs verdadeiramente modais (Enviar arquivo, confirmações) voltam a ser `Dialog`/`AlertDialog` centralizados na viewport, com largura máxima `min(32rem, 100vw − 32px)`.
- R3.5 Recalcular o lado ao redimensionar a janela e ao recolher/expandir a sidebar.

## R4. Remover "Ver como tabela"
- R4.1 Remover a opção, o modo tabela dentro do card e o código associado.
- R4.2 O menu "⋯" fica só com "Exportar imagem". Por ter uma única ação, ele é substituído por um **botão de ícone** (download) com tooltip "Exportar imagem".

## R5. Altura padronizada dos cards
- R5.1 **Todos os cards de gráfico da aplicação têm a mesma altura** (`--card-h-chart`), em todas as páginas.
- R5.2 Todos os KPI cards têm a mesma altura (`--card-h-kpi`).
- R5.3 Cards de texto (Referência Censo, Fatos, notícias, Qualidade) usam `--card-h-chart` quando dividem a linha com gráficos ou `--card-h-info` quando estão em linha própria. O texto excedente é truncado com `line-clamp` e o conteúdo completo fica no popover/tooltip.
- R5.4 O conteúdo se adapta à altura, e não o contrário: gráficos ocupam `flex: 1`; o ranking de 27 UFs calcula a espessura das barras para caber; o mapa usa `fitSize` na área disponível.
- R5.5 Mobile (< 768 px): altura de gráfico `--card-h-chart-mobile`, também única.

## R6. Equilíbrio do layout (sem espaços vazios)
Problemas vistos no print (ds3): a coluna lateral com 2 cards empilhados (Censo + Fatos) deixa um vazio; o mapa é mais baixo que o ranking ao lado; há sobra no fim da página.
- R6.1 **Uma célula do grid = um card.** Cards empilhados em colunas laterais são proibidos.
- R6.2 Padrões de linha permitidos em ≥ 1280 px: `12`, `6 + 6`, `4 + 4 + 4`, `8 + 4`. Entre 768 e 1279 px: `12` e `6 + 6`. Abaixo de 768 px: `12`.
- R6.3 Quantidade ímpar de cards em linhas de `6 + 6`: o último ocupa 12 colunas. Em `4 + 4 + 4`: as sobras viram `6 + 6` ou `12`. A regra é aplicada pelo `packRows`, nunca à mão.
- R6.4 Os cards Censo 2022 e Fatos são **fundidos** em um único card "Contexto" (duas seções com divisor).
- R6.5 Gaps horizontal e vertical idênticos (`--gap-grid`); o espaço entre seções é `--space-section`; a página termina com o mesmo padding das laterais.
- R6.6 O layout de cada página está definido em `design.md` §5 e vale para todas: Visão Geral, 5 dashboards, Qualidade, Notícias e Configurações.

## R7. Animações sincronizadas por página
- R7.1 Na entrada de uma página, **todas** as animações (count-up dos KPIs, desenho de linhas, crescimento de barras e pirâmides, preenchimento do mapa, entrada das narrativas, fade dos cards) começam **no mesmo instante** e têm a **mesma duração** (`--motion-page = 700 ms`) e a mesma curva (`ease.out`).
- R7.2 Sem stagger e sem atraso entre elementos: remover stagger de pirâmide, onda do mapa, entrada sequencial das narrativas, atraso do trecho projetado e entrada tardia do indicador de variação.
- R7.3 O instante de início é quando os dados essenciais da página estão prontos (ou após 1.200 ms, o que vier primeiro). Componentes cujos dados chegarem depois desse instante aparecem já no estado final, sem animação.
- R7.4 Mudanças de filtro, drill e seleção cruzada também disparam **uma única transição sincronizada** (`--motion-update = 400 ms`) para todos os elementos afetados.
- R7.5 O count-up tem duração fixa igual à da página (não proporcional à magnitude).
- R7.6 O Modo leve continua desligando tudo.
- R7.7 Microinterações de hover/clique (botões, sidebar, tooltips) não fazem parte da sincronização e continuam com `duration.fast`.

## R8. Sidebar recolhida (correção que não foi aplicada)
- R8.1 Critério mensurável: com a sidebar recolhida, o centro horizontal de **cada ícone**, do monograma "P", da pílula ativa e do botão de expandir fica a **≤ 0,5 px** do centro horizontal da sidebar.
- R8.2 Antes de corrigir, identificar a causa e registrar em `DECISIONS.md`. Causas típicas a checar: rótulo oculto só por `opacity`/`width: 0` (ainda ocupa espaço ou `gap`), `padding-left` remanescente no item ou na `nav`, barra de rolagem/`scrollbar-gutter` deslocando o centro, pílula com `left` fixo, ícone com margem própria.
- R8.3 O monograma "P" fica centralizado no topo, com a mesma altura do header da página.
- R8.4 Teste E2E automatizado do R8.1 (expandir → recolher → medir) em 1280 px e 1920 px.

## R9. Correções vistas no print (ds3)
- R9.1 **Mapa por UF** renderiza um único retângulo em vez do Brasil. A causa provável é a orientação (winding) dos polígonos invertida para o `d3-geo`, que passa a preencher a esfera inteira. Corrigir a orientação ao gerar `br-uf.json` (ou com `@turf/rewind` no build) e adicionar um teste: o `path` de cada uma das 27 UFs deve ter área menor que 10% da área do SVG. A legenda mostra os limites numéricos de cada classe.
- R9.2 **Ranking de UFs**: rótulos para **todas** as 27 UFs (hoje metade e as duas primeiras estão sem rótulo); ticks redondos (0, 5, 10, 15, 20, 25%); valor no fim de cada barra; barras em tom neutro médio (`--chart-1`) e a UF selecionada no acento. Referência 2026: maior RS (21,8%), menor RR (8,8%).
- R9.3 **Quem mudou mais (slope)**: o eixo Y mostra números inválidos ("391294", "871797"), pois o formatador está errado. Usar percentual com ticks redondos. O nível 0 do drill mostra as **5 regiões** (Etapa 7), não as 27 UFs. No nível de UFs:
  - linhas em tom neutro; destaque (acento) apenas nas 3 que mais mudaram e na UF selecionada;
  - rótulos à direita só para as destacadas, sem sobreposição.

  Referência 2000 → 2026 (pontos percentuais): RS +11,1; MG +10,0; PR +9,5; menores: AM +4,6, RR +4,4.
- R9.4 **Bônus demográfico**: a área da janela fica com opacidade sutil (`--muted` a 40%, nunca cinza sólido), os ticks do eixo Y são inteiros, a série começa em 2000 e as linhas de referência de "virada" e "hoje" têm rótulos. Referência: mínimo da razão de dependência total (65+) em **2017, 44,4**; 2000: 56,1; 2070: 75,4.
- R9.5 **Referência Censo 2022**: os valores "Recenseada" e "Diferença" aparecem como "—". Corrigir a integração (confirmar tabela e variável pela API de metadados do IBGE). Se o IBGE estiver indisponível, exibir "Dado do Censo indisponível no momento" com o horário da última tentativa, nunca "—".
- R9.6 **KPIs**: a unidade fica junto do valor ou no rótulo, e não como legenda solta ("grupo", "pessoas", "razão"). Faixa etária exibida como "40–44 anos".

## R10. Verificação
- R10.1 Testes E2E (Playwright) em todas as rotas × {768, 1280, 1920}:
  - sem rolagem horizontal, inclusive com um popover aberto em um card da esquerda e outro da direita;
  - lado do popover correto (R3.2);
  - todas as alturas de cards de gráfico iguais (tolerância de 1 px) e todos os KPIs iguais;
  - cada linha do grid sem sobra (tolerância de 2 px) e nenhum padrão de linha fora do R6.2;
  - alinhamento da sidebar (R8.4).
- R10.2 Teste de sincronização: em uma página com Modo leve desligado, registrar o `startTime` das animações (Web Animations API e `requestAnimationFrame` do count-up via hook instrumentado em modo de teste). A diferença máxima entre os inícios deve ser ≤ 16 ms e todas as durações iguais.
- R10.3 Screenshots atualizados em `e2e/__screenshots__/` (1280 px, tema escuro).

## Itens substituídos
| Etapa | Item | Situação |
|---|---|---|
| 4 | Etapa inteira (modo simplificado) | Removida, exceto `formatValue` e o glossário técnico |
| 5 | R3.2 registro leigo das narrativas | Removido |
| 6 | R1.6 staggers; R3.3 duração por magnitude; R3.7 variação tardia; R4.1 stagger da pirâmide; R4.2 atraso do projetado; R4.4 onda do mapa; R4.9 entrada sequencial; R4.12 troca de visão | Substituídos pela sincronização (R7) |
| 7 | R1 overlays no card | Revertido para portal com posicionamento lateral (R3) |
| 7 | R3.2 "Ver como tabela" | Removido (R4) |
| 7 | R6.2/R6.3 empacotamento livre | Substituído por padrões fixos e altura única (R5, R6) |
