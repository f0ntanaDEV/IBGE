# Etapa 9: Requisitos (Ajuste final)

Etapa de frontend, com ajuste pontual na integração do Censo (R6.3). **Ela prevalece sobre todas as anteriores.**

## R1. Remover todas as animações
- R1.1 A aplicação não pode ter **nenhuma** animação ou transição: entrada de página e de cards, count-up dos números, desenho de linhas, crescimento de barras/pirâmides, preenchimento do mapa, troca de tema (revelação circular), transições de drill, abertura de popovers/dialogs/menus (`animate-in`, `fade-in`, `zoom-in` do shadcn), accordion, skeleton com pulse/shimmer, spinners giratórios, `transition-*` de hover, scroll suave e animações dos gráficos (Recharts).
- R1.2 Mudanças de estado (hover, foco, tema, filtro, drill) acontecem **instantaneamente**.
- R1.3 Skeletons ficam estáticos (bloco em `--muted`, sem pulso). Os spinners são substituídos por skeleton ou pelo texto "Carregando…".
- R1.4 Remover o código: `lib/motion.ts`, `motion-variants.ts`, `PageMotionProvider`, `usePageAnimation`, `usePageReady`, `useCountUp`, `AnimatedNumber` (substituído por renderização direta via `formatValue`), `useMotionEnabled`, `useSeenOnce`, `MotionConfig`, `AnimatePresence`, `layoutId`, a rota `/dev/motion`, a View Transitions API e o log `__motionLog`.
- R1.5 Remover as dependências `framer-motion` e `tailwindcss-animate` (e o plugin no `tailwind.config`).
- R1.6 **Remover o "Modo leve"**: com zero animações ele perde a função. Saem o botão do header, a opção em Configurações, o campo `reducedMotion` da store e o atributo `data-reduced-motion`.
- R1.7 Proteção global em CSS (rede de segurança, não substitui a remoção do código):
  `*, *::before, *::after { animation: none !important; transition: none !important; } html { scroll-behavior: auto; }`
- R1.8 Verificação: após carregar cada rota, abrir um popover, aplicar um filtro e um drill, `document.getAnimations().length === 0`.

## R2. Gráfico "Idade por ano" (mapa de calor)
Problemas no print: rótulos dos eixos desenhados por cima da matriz; "2000" e "2070" cortados nas bordas; o "0" do eixo Y colide com o "2000"; o título "Idade" sobrepõe os ticks; a faixa "90 ou mais" parece uma segunda legenda sem eixo; a matriz está desfocada (suavização ligada); a linha do "hoje" não tem rótulo; a legenda tem só os extremos e nenhum título.

- R2.1 **Área de plotagem com margens reservadas**: esquerda 44 px (ticks + título "Idade" na vertical), inferior 28 px (ticks de ano), superior 16 px, direita 16 px. Nenhum texto fica sobre a matriz.
- R2.2 **Eixo X**: ticks 2000, 2010, …, 2070 abaixo da matriz. O primeiro rótulo usa `text-anchor: start` e o último `end`, para não serem cortados.
- R2.3 **Eixo Y**: ticks 0, 10, …, 80 à esquerda da matriz, com o título "Idade" rotacionado, centralizado na altura e fora da área dos ticks.
- R2.4 **Remover a faixa "90 ou mais"**. A matriz cobre as idades de 0 a 89, e a nota de rodapé do card diz: "Idades de 0 a 89 anos. O grupo 90 ou mais não é exibido por ser um grupo aberto."
- R2.5 **Células nítidas**: 1 pixel por célula em canvas fora da tela, ampliado com `imageSmoothingEnabled = false`, e canvas escalado por `devicePixelRatio`. Nenhuma suavização entre células.
- R2.6 **Linha do "hoje"**: rótulo "2026" no topo, dentro da margem superior.
- R2.7 **Legenda**: título "Pessoas por idade", gradiente com 3 marcas (mínimo, meio e máximo) e valores formatados em compacto (eixo). Largura igual à da área de plotagem, alinhada com ela.
- R2.8 **Direção da escala**: mais pessoas = mais contraste com o fundo (mais escuro no tema claro, mais claro no tema escuro), com gradiente invertido conforme o tema. A legenda acompanha.
- R2.9 **Tooltip** ao passar o mouse: "Idade 34 · 2030 · 3,2 mi pessoas" (valor exato no tooltip). Ele fica dentro do card.
- R2.10 O card do mapa de calor segue a altura única dos cards de gráfico (`--card-h-chart`), e a matriz ocupa o espaço restante.

## R3. Texto saindo dos KPI cards
Problema no print: a legenda "Variação em relação a 10 anos antes" e as unidades ("anos", "filhos por mulher", "taxa", "número") aparecem **abaixo e fora** dos cards.

- R3.1 Estrutura fixa do KPI card, com 3 linhas e nada além delas:
  1. rótulo + botão "?";
  2. valor + unidade curta inline, em fonte menor e cor `muted` (ex.: "77,03 anos", "1,51 filho por mulher");
  3. variação no formato "↑ 5,1% em 10 anos".
- R3.2 Remover a legenda "Variação em relação a 10 anos antes" (a informação passa para a linha 3 e o detalhe para o "?") e as unidades genéricas ("taxa", "número", "grupo", "pessoas", "razão"). A unidade só aparece quando informa algo (anos, filhos por mulher, ‰, %).
- R3.3 O índice de envelhecimento mostra "89,06" com unidade "por 100 jovens".
- R3.4 A altura deixa de ser fixa: `min-height` + `height: 100%` dentro de um grid com `align-items: stretch` (todos os KPIs da linha com a altura do maior). Textos longos usam `truncate` (rótulo) ou quebra controlada; nenhum elemento pode ter `position: absolute` fora do fluxo do card.
- R3.5 Vale para **todos** os KPI cards de todas as páginas (Visão Geral, 5 datasets e Qualidade).
- R3.6 Teste E2E de contenção: para cada card da aplicação (KPI, gráfico, texto), o retângulo de todo descendente visível fica dentro do retângulo do card (tolerância de 1 px).

## R4. Sidebar com tamanho fixo
- R4.1 Remover a opção de recolher: botão de recolher/expandir, estado `collapsed` na store, monograma "P", tooltips do modo recolhido, atalhos e testes de alinhamento do modo recolhido.
- R4.2 Em ≥ 768 px, a sidebar fica sempre visível com a largura padrão (`15rem`) e o bloco "IBGE / Projeções" no topo.
- R4.3 Abaixo de 768 px, o drawer de navegação continua (sem ele não há como navegar no celular), abrindo e fechando sem animação.

## R5. Indicadores: remover "Regiões no mesmo caminho"
- R5.1 Remover o gráfico de small multiples por região da página Indicadores (ds4): spec no `dashboards.config.ts`, componente `SmallMultiples` (se não for usado em outro lugar), drill, narrativa e testes.
- R5.2 Novo layout da ds4 (≥ 1280 px):
  KPIs ×4 · [e0 H × M 8 · Contexto 4] · [TFT 6 · TBN × TBM 6] · [Mapa 4 · Dispersão 4 · Slope 4] · [Barras divergentes 6 · Ranking 6] · [Observações finais 12] · [Notícias 4 · 4 · 4] · [DataTable 12].

## R6. "Referência Censo 2022" e "Fatos"
Problema no print: o card Censo ocupa a coluna lateral do gráfico e "Fatos" foi parar sozinho na linha seguinte, deixando 8 colunas vazias à esquerda.

- R6.1 **Fundir os dois em um único card "Contexto"** (a Etapa 8 R6.4 não foi aplicada), na mesma linha e com a mesma altura do gráfico principal:
  - seção "Censo 2022": projeção, recenseado e diferença, com a nota;
  - divisor;
  - seção "Fatos": até 2 fatos, com rótulo em `line-clamp-2` e valor.
  O conteúdo excedente rola dentro do card (`overflow-y: auto`), nunca para fora.
- R6.2 Aplicar em **todas** as páginas que têm esses cards (Visão Geral e datasets). Na ds5, que não tem Censo, o card contém apenas os Fatos.
- R6.3 **Valores "—"**: a integração com o Censo continua falhando. Corrigir:
  - Confirmar pela API de metadados (`/api/v3/agregados/{tabela}/metadados`) a tabela e a variável de população residente do Censo 2022. Candidato a validar: tabela **4709**, variável **93**, período 2022, níveis N1 (Brasil), N2 (regiões) e N3 (UFs). Registrar o resultado em `DECISIONS.md`.
  - Teste golden: Brasil recenseado = **203.080.756**; diferença em relação à projeção de 2022 (210.862.983) = **+3,8%**.
  - Gravar a resposta em cache de disco (`data/cache/censo2022.json`) após o primeiro sucesso. O Censo não muda, então as próximas execuções não dependem da API.
  - Se não houver cache nem API, exibir "Dado do Censo indisponível no momento", nunca "—".

## R7. Ajustes no gráfico "Esperança de vida ao nascer" (vistos no print)
- R7.1 Eixo Y com domínio "redondo" próximo aos dados (60 a 90) e ticks inteiros ("60", "70", "80", "90"), sem ",0".
- R7.2 Os rótulos diretos "Mulheres" e "Homens" ficam dentro da margem direita reservada do gráfico, sem ultrapassar o card.
- R7.3 A linha vertical do cursor e o tooltip desaparecem quando o mouse sai do gráfico.
- R7.4 A queda de 2020–2021 é real (pandemia de covid-19): adicionar uma anotação discreta "Covid-19" sobre o vale, sem cobrir as linhas.

## R8. Verificação
- R8.1 E2E em todas as rotas × {375, 768, 1280, 1920}, nos temas claro e escuro:
  - `getAnimations()` vazio (R1.8);
  - contenção de texto em todos os cards (R3.6);
  - sem rolagem horizontal;
  - linhas do grid sem sobra e padrões válidos (Etapa 8);
  - nenhum card "Fatos" isolado.
- R8.2 Testes unitários do mapa de calor (posição dos ticks dentro das margens, primeiro e último rótulo visíveis, ausência da linha 90) e do card Contexto (golden do Censo).
- R8.3 `rg` sem resultados para: `framer-motion|motion\.|AnimatePresence|layoutId|animate-|transition-|useCountUp|AnimatedNumber|reducedMotion|data-reduced-motion|startViewTransition|collapsed|SmallMultiples`.
- R8.4 Screenshots finais em `e2e/__screenshots__/` nos temas claro e escuro.

## Itens substituídos
| Etapa | Item | Situação |
|---|---|---|
| 2 | R4 Modo leve | Removido |
| 6 | Etapa inteira (animações) | Removida |
| 8 | R7 animações sincronizadas | Removido |
| 2, 6, 7, 8 | Sidebar colapsável, monograma "P", R8 da Etapa 8 | Removidos (sidebar fixa) |
| 5 | G6 small multiples | Removido |
| 8 | `--card-h-kpi` fixo | Substituído por altura mínima com esticamento (R3.4) |
