# Etapa 7: Requisitos (Correções de UX, gráficos, drill down e espaçamento)

Etapa só de frontend. **Ela prevalece sobre as etapas anteriores** onde houver conflito (ver "Itens substituídos" no fim).

## R1. Overlays dentro do card (sem scroll horizontal)
Problema: o popover do "?" no KPI ultrapassa a borda do card e da viewport, criando uma barra de rolagem horizontal na página inteira.

- R1.1 **Todo dialog, popover e menu de conteúdo** (glossário "?", confirmações, "Ver tabela", opções avançadas etc.) DEVE abrir como **modal centralizado sobre o card pai**, cobrindo apenas esse card, com um véu (scrim) restrito aos limites do card. Sidebar, header e os demais cards continuam visíveis e utilizáveis.
- R1.2 "Card pai" = o `Card` mais próximo do botão que abriu o overlay. Overlays disparados fora de um card (Enviar arquivo e Reprocessar no header da página, boas-vindas da visão) usam como hospedeiro a **área de conteúdo da página** (`<main>`), nunca a viewport inteira.
- R1.3 O painel do modal nunca ultrapassa o card: largura máxima `card − 24 px`, altura máxima `card − 24 px` e rolagem interna se o conteúdo não couber.
- R1.4 Comportamento de modal no escopo do card: foco preso dentro do painel; o restante do card fica `inert`; `Esc`, clique no véu ou o botão "Fechar" (×) fecham; o foco volta ao botão de origem.
- R1.5 Apenas um overlay aberto por vez na aplicação: abrir outro fecha o anterior.
- R1.6 Tooltips de hover (gráficos e ícones da sidebar) continuam como tooltips, mas presos ao card/viewport: `allowEscapeViewBox={{ x: false, y: false }}` no Recharts e `collisionPadding` + `max-width` nos tooltips Radix.
- R1.7 Proteção global: **nenhuma rota pode ter rolagem horizontal** em 375, 768, 1280 e 1920 px, com qualquer overlay aberto (teste automatizado, R7).

## R2. Correção dos gráficos
Golden values (Brasil, ds3/ds4), a serem usados nos testes:
| Item | Valor |
|---|---|
| População 2000 / 2026 / 2041 (pico) / 2070 | 174,7 mi / 214,2 mi / 220,4 mi / 199,2 mi |
| Cruzamento proporção 60+ × 0–14 | **2029** (≈ 19% × 18%); 2000: 9% × 30%; 2070: 38% × 12% |
| e0 homens / mulheres | 2000: 67,3 / 75,1 · 2026: 73,8 / 80,3 · 2070: 81,7 / 86,1 |
| TFT abaixo de 2,1 desde | 2002 |
| Nascimentos < óbitos desde | 2042 |

- R2.1 **Linhas não aparecem** (População 2000–2070, 0–14 e 60+, Esperança de vida). Só aparecem marcadores e a linha do "hoje".
  - As séries DEVEM ser desenhadas por inteiro, observado (contínuo) e projetado (tracejado), com e sem Modo leve.
  - Diagnóstico obrigatório antes de corrigir: testar com o Modo leve ligado/desligado (animação de desenho da Etapa 6), conferir as `dataKey` das séries divididas observado/projetado e o domínio do eixo Y. Registrar a causa raiz em `DECISIONS.md`.
  - Os dois segmentos DEVEM se encontrar no ano atual (o ponto do "hoje" pertence aos dois), sem lacuna.
- R2.2 **Eixo Y cortado** ("25.000.000"): a largura do eixo DEVE ser calculada a partir do maior rótulo formatado. Os rótulos de eixo usam **formato compacto nas duas visões** ("225 mi"); valores exatos ficam só nos tooltips da visão completa.
- R2.3 **Domínio do eixo Y**: DEVE conter todos os valores da série com margem de 5% e ticks "redondos" (ex.: população de 170 mi a 230 mi). Nunca cortar dados.
- R2.4 **Eixo X**: domínio de 2000 a 2070, com ticks em 2000, 2010, …, 2070 (no máximo 8). Os anos 2001, 2004… não aparecem. No mobile, ticks a cada 20 anos.
- R2.5 **Linha do "hoje"**: rótulo no topo da área do gráfico ("Projeção →", à direita da linha), sem sobrepor os dados. A cor segue `--muted-foreground` com opacidade reduzida.
- R2.6 **Marcadores** (pico, cruzamento) DEVEM ficar exatamente sobre a linha correspondente. O rótulo é posicionado para não sair da área do gráfico nem cobrir a série (inverter o lado perto das bordas). O pico mostra "Pico: 220,4 mi (2041)".
- R2.7 **0–14 e 60+**: rótulos diretos no fim de cada linha ("0–14 anos", "60 anos ou mais") em vez de legenda; o "X" do cruzamento fica em 2029, no ponto de encontro.
- R2.8 **Esperança de vida**: subtítulo sem sigla ("Quantos anos homens e mulheres vivem, em média"). As linhas H e M têm rótulo direto, e a diferença entre elas no ano selecionado aparece no tooltip.
- R2.9 **Mapa de calor idade × ano**:
  - nitidez: canvas escalado por `devicePixelRatio`;
  - sem emendas: desenhar 1 pixel por célula em um canvas fora da tela (71 × 90) e ampliar com `imageSmoothingEnabled = false`;
  - escala contínua (interpolação entre `--chart-seq-1..5`) em vez de 5 faixas;
  - eixos e rótulos em SVG/HTML sobre o canvas (nunca texto desenhado no canvas);
  - título do eixo Y "Idade" e ticks a cada 10 anos nos dois eixos;
  - a linha 90 (grupo aberto "90 ou mais", que acumula todas as idades acima) é **excluída** da escala e exibida separada, com uma nota curta;
  - a legenda em gradiente mostra os valores mínimo e máximo formatados;
  - o tooltip no hover mostra idade, ano e população;
  - altura mínima de 280 px.
- R2.10 **Smart Narratives de gráficos com várias séries** DEVEM nomear a série ("A proporção de 0 a 14 anos foi máxima em 2000…"). A regra de pico/vale NÃO se aplica sem série definida; em gráficos de cruzamento, o insight de cruzamento tem prioridade. Frases como "O ponto mais alto no Brasil ocorre em 2000" sem sujeito são proibidas.
- R2.11 **Indicador de variação nos KPIs**: um único indicador de direção. O ícone (↑/↓) é renderizado pelo componente e o texto não traz seta nem sinal ("↓ 16%", não "↓ ↓ 16%" nem "↑ +31,7").
- R2.12 **Faixas etárias** em texto: "40 a 44 anos" na visão simplificada e "40–44" (meia-risca, sem espaços) na completa.
- R2.13 Teste de fumaça: todo gráfico, em todas as rotas e nas duas visões, com e sem Modo leve, DEVE renderizar marcas visíveis (`path` com `d` não vazio e `stroke-dashoffset` final = 0, ou `rect`/`circle` > 0).

## R3. Remover o modo de expansão
- R3.1 Remover o botão "Expandir", o `ChartDialog`, o atalho `F`, o parâmetro `?expandido` e a animação de elemento compartilhado (card → tela cheia).
- R3.2 As funções úteis migram para um menu "⋯" no header do card (abrindo como overlay do card, R1): **Ver como tabela** (alterna gráfico ↔ tabela dentro do card) e **Exportar imagem (PNG)**. Zoom por seleção é removido; o drill down o substitui.
- R3.3 A legenda interativa (clicar oculta/mostra a série) permanece no próprio card.

## R4. Drill down
Clicar em um elemento de um gráfico **detalha o próximo nível dentro do mesmo card**.

### R4.1 Regras de interação
- Elementos detalháveis têm cursor de ponteiro, destaque no hover e, no rodapé do tooltip, "Clique para detalhar".
- O header do card mostra **trilha de navegação** (`Brasil › Nordeste › Bahia`) e um botão "Voltar" quando o nível é maior que 0. Os títulos e as narrativas refletem o nível atual.
- Subir de nível: clique na trilha, botão "Voltar", `Backspace` ou `Esc` com o card em foco. Profundidade máxima: 3 níveis.
- Teclado: elementos detalháveis são focáveis (`Tab`) e `Enter` detalha.
- Estado na URL: `d_<chartId>=<caminho>` (ex.: `d_mapa=2/29`), para permitir link direto.
- Transição de nível: o novo nível "cresce" a partir do elemento clicado (tokens da Etapa 6); com o Modo leve, troca direta.
- **Relação com filtros cruzados (Etapa 5)**: drill **territorial** também publica o território detalhado como seleção cruzada da página; drills de tempo, idade e composição são locais ao card. `Ctrl/⌘ + clique` continua fazendo seleção cruzada múltipla sem detalhar. No último nível, o clique alterna a seleção cruzada, como antes.
- Visão simplificada: no máximo 2 níveis, e a trilha usa texto amigável ("← Voltar para Brasil").

### R4.2 Hierarquias
| Hierarquia | Níveis |
|---|---|
| Território | Brasil → 5 regiões → UFs da região |
| Tempo | 2000–2070 → década → ano (detalhe do ano) |
| Idade | 3 faixas amplas (0–14, 15–59, 60+) → grupos quinquenais → idades simples |
| Coorte | idade em um ano → trajetória da mesma geração ao longo dos anos |
| Composição | indicador → seus componentes |

### R4.3 Aplicação por gráfico
| Gráfico | Nível 0 → 1 → 2 |
|---|---|
| População 2000–2070 (Visão Geral, ds1) | série → década (pontos anuais com rótulos) → ano: população por região (barras) |
| Pirâmide quinquenal (ds2) | grupos quinquenais → idades simples do grupo clicado (H × M) |
| Pirâmide idade simples (ds1) | idades → coorte da idade clicada (linha da geração, de 2000 a 2070) |
| Mapa de calor idade × ano (ds1) | matriz → pirâmide do ano clicado → coorte da idade clicada |
| Composição 100% (ds2) | 3 faixas amplas → quinquenais da faixa → idades simples do grupo |
| 0–14 e 60+ (ds3) | 2 séries → subgrupos da série clicada (0–14 → 0–1, 0–4; 60+ → 65+, 80+) |
| Mapa do Brasil (ds3, ds4) | regiões (cor agregada) → UFs da região (mapa recortado) |
| Rankings, slope e barras divergentes (ds3, ds4, ds5) | regiões → UFs da região |
| Dispersão e0 × TFT (ds4) | bolhas das regiões → UFs da região |
| Small multiples por região (ds4) | 5 regiões → mini-linhas das UFs da região clicada |
| Esperança de vida H × M (ds4) | série → década → ano: e0 por região, H × M |
| TFT com reposição (ds4) | série → ano: curva de fecundidade por idade da mãe (TEF 10–14 … 50+) |
| TBN × TBM (ds4) | série → ano: nascimentos e óbitos absolutos, H × M |
| Bônus demográfico (ds3/ds4) | razão de dependência total → componentes jovens (RDJ) e idosos (RDI) |
| Curva de sobrevivência `lx` (ds5) | curva → idade clicada: ficha com `nqx`, `ndx`, `ex` dessa idade |
| `nqx` por idade (ds5) | curva → série 2000–2070 do `nqx` da idade clicada |
| `ex` por idade (ds5) | curva → série 2000–2070 do `ex` da idade, H × M |
| Linha do tempo de marcos (Visão Geral) | marcos → minigráfico do contexto do marco clicado |
| KPIs (todas as páginas) | valor → sparkline 2000–2070 do indicador, dentro do card |
| Nulos por coluna (Qualidade) | colunas → detalhe da coluna (nulos antes/depois, estratégia aplicada) |

- R4.4 Os dados do drill vêm preferencialmente do que já está em cache (ex.: a coorte é calculada no cliente a partir da matriz do mapa de calor; regiões e UFs vêm das linhas com `nivel`). Novos endpoints só se indispensáveis, registrando o motivo em `DECISIONS.md`.

## R5. Remover sistemas de busca
- R5.1 Remover **todos** os campos de busca da interface: "Buscar território", busca da DataTable, busca da página de Notícias e command palette (botão "Buscar" e atalho `Ctrl/⌘ + K`).
- R5.2 A seleção de território passa a ser um `Select` agrupado (Brasil · Regiões · UFs em ordem alfabética). Na visão simplificada, Brasil + UFs pelo nome.
- R5.3 As ações que só existiam na command palette (alternar tema/visão/Modo leve) continuam acessíveis pelo header e por Configurações.
- R5.4 O parâmetro `q` do backend não é mais enviado; ele pode continuar existindo na API.

## R6. Espaçamento e densidade (sem espaços vazios)
- R6.1 Remover a seção **"Em poucas palavras"** (componente, configuração e chamadas às narrativas para ela).
- R6.2 **Nenhuma linha do grid pode terminar com espaço vazio** em ≥ 768 px: o último item de cada linha estende-se até completar as 12 colunas. Isso vale para as duas visões (ex.: na visão simplificada com 1 gráfico por linha, ele ocupa 12 colunas).
- R6.3 Cards da mesma linha têm a **mesma altura**, e o gráfico ocupa a altura disponível.
- R6.4 Linha de KPIs: o número de colunas é igual ao número de KPIs (3 na simplificada, 4 na completa), e a altura é uniforme. A linha de variação é reservada mesmo quando ausente, para não desalinhar.
- R6.5 `FilterBar` em **uma linha compacta** (Território, Ano, Sexo), alinhada à esquerda, sem colunas fantasmas. Os rótulos ficam sempre acima do controle, com a mesma altura. No mobile, grid de 2 colunas.
- R6.6 Ritmo vertical único: header da página → filtros → KPIs → gráficos, separados por `--space-section`. Nenhum card vazio é renderizado (se não houver conteúdo, o bloco não é montado).
- R6.7 O padrão vale para **todas as páginas**: Visão Geral, 5 dashboards, Qualidade, Notícias e Configurações.

## R7. Sidebar recolhida
- R7.1 Com a sidebar recolhida, os ícones ficam **centralizados horizontalmente**. Os rótulos são desmontados (não apenas transparentes), e a pílula do item ativo vira um quadrado de 40 × 40 centralizado.
- R7.2 No topo da sidebar recolhida, acima de todos os ícones, aparece o **mini-ícone "P"** (monograma do projeto) no lugar do bloco "IBGE / Projeções". Ele fica centralizado, alinhado verticalmente com o header da página, e tem tooltip "IBGE Projeções".
- R7.3 Expandir/recolher faz crossfade entre o monograma e o logotipo completo (tokens da Etapa 6; troca direta no Modo leve).
- R7.4 O botão de recolher/expandir fica centralizado no rodapé quando recolhida.

## R8. Verificação automatizada
- R8.1 Testes E2E com Playwright (`e2e/`) para cada rota × {completa, simplificada} × {375, 768, 1280, 1920}:
  - sem rolagem horizontal (`scrollWidth ≤ clientWidth`), inclusive com o overlay do primeiro KPI aberto;
  - em cada linha do grid (`[data-grid-row]`), a soma das larguras dos itens + gaps é igual à largura da linha (tolerância de 2 px);
  - cards irmãos com alturas iguais (tolerância de 1 px);
  - nenhum card visível com corpo vazio;
  - teste de fumaça dos gráficos (R2.13).
- R8.2 Testes unitários: posição dos marcadores (R2.6), domínio e ticks (R2.3, R2.4), narrativas com várias séries (R2.10), KPI delta (R2.11) e drill (navegação descendo e subindo, URL, teclado).
- R8.3 Screenshots das rotas em 1280 px (tema escuro) salvos em `e2e/__screenshots__/` para revisão humana.

## Itens substituídos
| Etapa | Item | Situação |
|---|---|---|
| 2 | R2.2 command palette | Removido (R5) |
| 3 | R2.7/R3.8 busca na DataTable; R6.1 busca em Notícias | Removido (R5) |
| 4 | R1.1 opção no command palette; R4.3 "Em poucas palavras" | Removido (R5, R6.1) |
| 5 | R2 ampliação visual; R3.3 (c) | Substituído por drill down (R4) e menu "⋯" (R3.2); removido |
| 6 | R4.7 expandir com elemento compartilhado | Removido |
| 5/6 | Popovers e dialogs em portal na viewport | Substituído por overlays no card (R1) |
