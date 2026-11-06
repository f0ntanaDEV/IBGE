# Etapa 5: Requisitos (Gráficos adicionais, ampliação, Smart Narratives e filtros cruzados)

## R1. Novos gráficos (preencher espaços vazios com informação útil)
Cada novo gráfico entra em `dashboards.config.ts` e segue o design system. Nenhum espaço do grid pode ficar vazio em 1280 px ou mais.

| ID | Gráfico | Dataset | Pergunta que responde |
|---|---|---|---|
| G1 | **Mapa do Brasil por UF** (coroplético, escala sequencial neutra de 5 classes) | ds3, ds4 | "Onde o indicador é maior ou menor?" |
| G2 | **Mapa de calor idade × ano** (densidade populacional por idade ao longo de 2000–2070) | ds1 | "Como a 'onda' de nascimentos envelhece?" |
| G3 | **Gráfico de dispersão animável** e0 × TFT por UF (bolha = população), com controle de ano | ds4 | "Viver mais está ligado a ter menos filhos?" |
| G4 | **Slope chart** ano A → ano B por UF para o indicador selecionado | ds3, ds4 | "Quem mudou mais?" |
| G5 | **Bônus demográfico**: razão de dependência total com destaque da janela em que ela é mínima e o ponto de virada | ds3/ds4 | "Até quando há mais gente em idade de trabalhar?" |
| G6 | **Small multiples** por região (mesmo indicador, 5 mini-linhas na mesma escala) | ds4 | "As regiões seguem o mesmo caminho?" |
| G7 | **Barras divergentes** homens × mulheres de e0 e e60 por UF (diferença de anos) | ds4, ds5 | "Quanto as mulheres vivem a mais?" |
| G8 | **Linha do tempo de marcos**: pico populacional, cruzamento idosos × jovens, TFT abaixo de 2,1, ano em que nascimentos < óbitos | Visão Geral | "Quais são os momentos-chave?" |

- R1.1 Os marcos (G8) DEVEM ser calculados dos dados pelo backend, nunca fixados no código.
- R1.2 Na visão simplificada, apenas G1, G7 (só Brasil) e G8 estão disponíveis, com rótulos leigos.

## R2. Ampliação visual dos gráficos
- R2.1 Todo `ChartCard` DEVE ter o botão **"Expandir"** (ícone + atalho `F` com o card em foco), que abre o gráfico em tela cheia (Dialog em 95vw × 90vh).
- R2.2 No modo ampliado:
  - **Zoom no eixo X** por seleção (arrastar) ou pelo componente `Brush`, com botão "Redefinir zoom".
  - **Legenda interativa**: clicar oculta ou mostra a série.
  - Aba **"Tabela"** com os valores do gráfico (já formatados conforme a visão).
  - **Exportar imagem** (PNG e SVG) com título, fonte ("IBGE, Projeções da População – Revisão 2024") e filtros ativos no rodapé da imagem.
  - Smart Narrative completa do gráfico ao lado (desktop) ou abaixo (mobile).
- R2.3 `Esc` fecha e o foco retorna ao botão de origem. A URL ganha `?expandido=<chartId>` para permitir link direto.
- R2.4 No mobile, o modo ampliado sugere a rotação para paisagem e permite pinça para zoom no eixo X.

## R3. Smart Narratives (observações estáticas e determinísticas)
- R3.1 São textos **gerados por regras** a partir dos dados exibidos. Não usam LLM nem chamada externa, e o mesmo estado sempre produz o mesmo texto.
- R3.2 DEVEM variar conforme: dataset, território, ano, sexo, seleção dos filtros cruzados, zoom e **visão** (completa = registro técnico; simplificada = registro leigo).
- R3.3 Locais:
  - (a) 1 frase-resumo sob cada gráfico;
  - (b) card **"Observações finais"** no fim de cada dashboard, com 3–5 frases priorizadas;
  - (c) card "Em poucas palavras" (Etapa 4) no topo da visão simplificada.
- R3.4 Tipos de insight mínimos (cada um vira uma regra):
  - tendência (cresce/cai/estável, com % no período);
  - pico ou vale e o ano em que ocorre;
  - cruzamento entre séries;
  - posição no ranking ("3ª maior entre 27 UFs");
  - comparação com Brasil ("acima da média nacional em X");
  - maior variação entre dois anos;
  - limiar ("abaixo do nível de reposição desde AAAA");
  - diferença entre sexos;
  - observado × projetado ("a partir de 2026 os valores são projeções").
- R3.5 Cada insight tem **relevância** (0–1). "Observações finais" mostra os de maior relevância sem repetir o mesmo tipo mais de 2 vezes.
- R3.6 Termos-chave e números aparecem em destaque sutil (peso de fonte, sem cor), e cada frase pode ter um botão "mostrar no gráfico" que destaca o ponto correspondente.
- R3.7 Os textos DEVEM ser gerados em português correto, com concordância de gênero e número ("1 UF" / "3 UFs") e preposições com território ("no Acre", "em Minas Gerais", "na Bahia", "no Distrito Federal").

## R4. Filtros cruzados
- R4.1 Clicar em um elemento de um gráfico **filtra todos os outros gráficos, KPIs, narrativas e a tabela da página**:
  - UF no mapa, no ranking ou no slope → `território`;
  - região nos small multiples → `região`;
  - faixa na pirâmide ou no mapa de calor → `faixa etária`;
  - ponto ou ano em uma linha → `ano`;
  - série H/M → `sexo`.
- R4.2 `Ctrl/⌘ + clique` adiciona à seleção (multisseleção de UFs e faixas). Clicar de novo no mesmo item remove a seleção.
- R4.3 O gráfico de origem **destaca** o item selecionado e esmaece os demais (opacidade 0,35), em vez de se filtrar.
- R4.4 Uma barra **"Filtros ativos"** mostra chips removíveis de cada seleção, com "Limpar tudo"; `Esc` limpa as seleções cruzadas.
- R4.5 As seleções cruzadas vão para a URL (`sel_uf`, `sel_faixa`, `sel_ano`, `sel_sexo`) e se combinam com os filtros globais da Etapa 3 (seleção cruzada tem precedência).
- R4.6 Quando um gráfico não suporta a dimensão selecionada, ele mostra um aviso discreto ("Este gráfico não é afetado pela seleção de faixa etária") em vez de dados inconsistentes.
- R4.7 Hover sincronizado: passar o mouse em um ano em uma linha destaca o mesmo ano em todas as linhas da página.
- R4.8 Na visão simplificada, os filtros cruzados funcionam apenas por clique simples (sem multisseleção), e os chips usam nomes amigáveis.

## R5. Backend necessário
- R5.1 Os endpoints de dados aceitam listas: `cod=12,31,35`, `faixa=0-14,60+`, `anos=2024,2050`.
- R5.2 Novos endpoints: `/datasets/{id}/map?metric&ano`, `/datasets/ds1/heatmap?cod&sexo`, `/datasets/ds4/scatter?anos`, `/datasets/{id}/slope?metric&ano_a&ano_b`, `/milestones?cod`.
- R5.3 A malha das UFs DEVE ser obtida uma vez da API de Malhas do IBGE (`/api/v3/malhas`, Brasil com divisão por UF), simplificada (≤ 150 KB) e versionada em `apps/web/public/geo/br-uf.json`. Não pode haver chamada em tempo de execução.

## R6. Desempenho
- R6.1 Um filtro cruzado atualiza a página inteira em < 200 ms (dados já em cache) ou exibe skeleton apenas nos gráficos afetados.
- R6.2 O mapa e o mapa de calor DEVEM ser renderizados em SVG com no máximo 1 nó por célula/UF, ou em Canvas se passar de 5.000 células.
