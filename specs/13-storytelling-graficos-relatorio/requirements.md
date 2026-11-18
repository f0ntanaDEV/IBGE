# Etapa 13: Storytelling, filtros, gráficos e relatório

Origem: pedido de 18/11/2026 com 7 capturas, descrito em R5–R7. A spec anterior `13-databricks-painel` foi **descartada**. Se a pasta existir, apague.

Esta etapa prevalece sobre as etapas 1–12 nos pontos abaixo, inclusive na regra de paleta dessaturada dos gráficos (R4). As páginas de dados são 7: Visão Geral, ds1 a ds5 e Qualidade de dados.

## Fora de escopo
- Databricks, `/databricks`, backend de dados, ETL e MySQL.
  - Exceção: um endpoint só se o relatório (R9) precisar de dado que o front não tenha. Prefira não criar.
- Insights, Notícias, Glossário e Configurações: só o que R8 exige do mapa nas preferências.
- Mudar os textos de Fatos, Contexto e manchetes.

## R1. Storytelling em todas as páginas
- R1.1 Cada uma das 7 páginas ganha o bloco "Por que isso importa", logo abaixo do resumo dinâmico (Headline) e acima dos filtros.
  - Até 3 linhas no desktop (≤ 300 caracteres).
  - Explica o tema da página na teoria e na prática e o problema que ele gera.
- R1.2 O texto depende do modo:
  - **Técnico**: tom sério e formal;
  - **Simples**: tom descontraído.

  Os textos estão em `conteudo/storytelling.md`. Use-os sem reescrever.
- R1.3 No modo Simples, o bloco aparece no mesmo lugar relativo (abaixo do resumo).
- R1.4 Com animações ligadas, o bloco entra junto com o Headline e segue a regra da etapa 7 (palavra a palavra no modo Simples).
- R1.5 Teste: as 7 páginas têm os dois textos, cada um com no máximo 300 caracteres, e o texto exibido muda com o modo.

## R2. Filtros: uma fonte de verdade e todos os gráficos ligados
- R2.1 **Estado único.**
  - Território, ano e sexo vivem só nos parâmetros da URL (`cod`, `ano`, `sexo`).
  - Clicar numa UF ou região (mapa, ranking, barras, tabela) chama `setCod`, e clicar num ano chama `setAno`. Ninguém sobrescreve o filtro "por fora".
  - O store de filtro cruzado (`stores/crossfilter.ts`) fica só com seleções que não são filtros globais: faixa etária e o hover.
  - QUANDO uma UF é escolhida por clique, ENTÃO o seletor de território do FilterBar mostra essa UF na hora.
- R2.2 **Troca de página.**
  - QUANDO o usuário muda de página (menu, busca, links do resumo, chips, botões abaixo do resumo), ENTÃO `cod`, `ano` e `sexo` vão junto na URL e o FilterBar da página nova mostra os mesmos valores.
  - Um filtro que a página nova não usa (ex.: sexo onde não há sexo) não é aplicado e aparece como "não se aplica nesta página".
  - Não existe filtro aplicado e invisível.
- R2.3 **Chips.** A barra de chips abaixo do resumo mostra **nomes** ("Bahia (BA)", "Região Nordeste", "2026", "Mulheres"), nunca códigos ("UF 29").
  - O × de território volta para Brasil; o de ano, para o ano padrão; o de sexo, para Ambos.
  - "Limpar tudo" volta aos três padrões.
- R2.4 **Matriz de filtros.**
  - Cada gráfico declara, no `dashboards.config.ts`, como reage a cada filtro: `filtra` (os dados mudam), `destaca` (mostra todas as UFs e realça a escolhida ou as da região escolhida) ou `nao_se_aplica`.
  - Um teste falha se algum gráfico não declarar os três.
  - O comportamento de cada gráfico segue a tabela abaixo.

| Tipo | Território | Ano | Sexo |
|---|---|---|---|
| line, area, area100, bonus, milestones | filtra | marca o ano (linha vertical) | filtra se a base tem sexo |
| pyramid, heatmap, lifeTable | filtra | filtra (heatmap: marca) | filtra ou nao_se_aplica |
| ranking, map, barras por UF (R5) | destaca; com região escolhida, só as UFs dela | filtra | filtra se a métrica tem H/M |
| scatter | destaca | filtra | nao_se_aplica |
| diverging (R7) | destaca; com região, só as UFs dela | filtra | nao_se_aplica (já compara sexos) |

- R2.5 Rodapé de filtros em todo `ChartCard`:
  - uma linha discreta com os filtros que afetam o gráfico ("Bahia · 2026 · Mulheres");
  - os que não se aplicam aparecem riscados ou como "não usa sexo".
- R2.6 Testes:
  - unitários da matriz e do estado;
  - e2e:
    - clicar numa UF no mapa → FilterBar mostra a UF e todos os gráficos da página reagem;
    - trocar de página pelo menu e pelo elemento abaixo do resumo → FilterBar da página nova mostra a mesma UF;
    - × do chip volta para Brasil em todos os gráficos.

## R3. Tooltip sem informação repetida
- R3.1 O tooltip mostra uma linha por métrica e por ano.
  - Na junção entre série observada e projetada, ou em séries partidas (sólida e tracejada), o valor não se repete.
  - O ano projetado ganha o sufixo "(projeção)" na linha do valor.
- R3.2 As linhas de referência ("Projeção →", "Covid-19", "Reposição 2,1", zonas de R6) não entram no tooltip como séries.
- R3.3 Teste do componente de tooltip com uma série partida: 1 linha por métrica.

## R4. Contraste e leitura dos gráficos
- R4.1 Nova paleta de gráficos, nos temas claro e escuro.
  - Cada série com contraste ≥ 3:1 contra o fundo do card.
  - Séries vizinhas distinguíveis: diferença de luminosidade ≥ 15 pontos ou matiz ≥ 60°.
  - Um teste calcula o contraste a partir dos tokens. O alto contraste (etapa 4) continua AAA.
  - O visual geral continua sóbrio: sem neon e sem gradiente. A paleta dos gráficos deixa de ser dessaturada.
- R4.2 Cor fixa por significado em todo o painel:
  - Homens e Mulheres sempre com as mesmas duas cores;
  - observado sólido e projeção tracejada;
  - 0–14, 15–59/64 e 60+ sempre com as mesmas três cores.
- R4.3 **Toda série identificada sem hover:** legenda visível ou rótulo direto no fim da série.
  - **Pirâmide quinquenal e pirâmide etária:** cabeçalho "← Homens | Mulheres →" sobre o gráfico, nas cores das séries, e legenda.
  - **Composição por grandes faixas (area100):** legenda com as três faixas e o percentual de cada uma no ano selecionado, direto na área.
  - Vale para todos os gráficos com mais de uma série.
- R4.4 Linhas com espessura ≥ 2 px, grade mais fraca que as séries e rótulos de eixo com contraste ≥ 4,5:1.
- R4.5 **Espaço na origem:** o primeiro rótulo do eixo X e o primeiro do Y não podem se tocar.
  - Mínimo de 8 px entre eles, com `padding` e `tickMargin` nos padrões de `lib/chartDefaults.ts`. Se ainda colidirem, o rótulo zero do Y é omitido.
  - Vale para todos os gráficos (ver anexos 1, 3 e 5).
- R4.6 Eixos com ticks "redondos" (1, 2, 5 × 10ⁿ). Nada de "-9, -4, 1, 6 anos" (anexo 7).

## R5. Página Grupos etários
- R5.1 **"UFs por % de 60+" (anexo 1):** eixos trocados.
  - Barras verticais, com as UFs no eixo X (siglas, rotação se precisar) e a porcentagem no Y.
  - Ordenadas da maior para a menor.
  - A UF escolhida fica destacada.
- R5.2 **"Quem mudou mais" (anexo 2):** o slope vira barras verticais iguais às de R5.1, para **um único ano**, com controle de time-lapse:
  - slider de ano (2000–2070), sincronizado com o filtro `ano`;
  - botão play/pausa que avança ano a ano (≈ 600 ms por ano);
  - a ordenação é refeita a cada ano. Com animações desligadas, as barras trocam sem transição;
  - ao pausar ou mexer no slider, o filtro `ano` da página é atualizado.
  - Vale para **todos os gráficos slope** do painel, incluindo "Quem mudou mais a esperança de vida" em Indicadores.
- R5.3 **"Bônus demográfico" (anexo 3):**
  - sai o texto de 4 linhas e fica só: "A razão de dependência mede 0–14 e 65+ para cada 100 pessoas de 15–64.";
  - sai a janela sombreada;
  - ficam a linha, a marca de projeção e o ano selecionado.

## R6. Página Indicadores
- R6.1 **"Esperança de vida ao nascer" (anexo 4):** os rótulos "Covid-19" e "Projeção →" não podem se sobrepor.
  - Covid no topo da faixa de 2020–2021 e Projeção abaixo dela, alinhado à direita da linha.
  - Uma regra de colisão em `labelPlace.ts` desloca qualquer rótulo de referência que encoste em outro. Vale para todos os gráficos.
- R6.2 **Zonas de alerta (anexo 5).** Todo gráfico cuja métrica tem regra de status com `basis: "value"` em `content/kpi-rules.ts` mostra três faixas de fundo **no eixo Y**: **Zona Segura**, **Zona de Atenção** e **Zona Crítica**.
  - **Métricas:** `tft`, `tmi_t`, `ie60`, `p_60`, `rdt65`, `id_med`, `nqx_0`, `lx_80`, `e60`, `p_15_64_t`, `p_65_mais_t` e `p_80_mais_t`.
  - **Cores:** as do status (`--status-good`, `--status-warn` e `--status-bad`) com opacidade baixa (12–18%), para não esconder a série.
  - **Limites:** os da regra; nenhum número novo.
  - **Rótulos:** o nome de cada zona aparece dentro da faixa, alinhado à direita, e uma legenda das zonas fica abaixo do gráfico.
  - **Onde:** linhas e barras por UF da métrica.
  - **"Reposição 2,1":** continua como linha, porque é o limite entre Segura e Atenção.
- R6.3 **"Ranking de UFs" (anexo 6):** barras verticais com as UFs no X, como em R5.1, mantendo o seletor de indicador.

## R7. Diferença entre mulheres e homens (anexo 7)
- R7.1 "Diferença entre mulheres e homens" (Tábuas) e "Mulheres e homens" (Indicadores) passam a barras verticais: UFs no X e anos de diferença no Y.
  - Duas séries ("ao nascer" e "aos 60"), lado a lado por UF, com legenda.
- R7.2 **Eixo sem área vazia:**
  - QUANDO não houver valor negativo, ENTÃO o eixo de valor começa em 0 (sem o lado de −9 a 0);
  - QUANDO houver negativo, ENTÃO o eixo é simétrico.
  - A regra fica em `lib/chart-axes.ts` e vale para **todos** os gráficos de barras divergentes ou de diferença.

## R8. Mapas
- R8.1 **Território escolhido.**
  - QUANDO há território escolhido, ENTÃO as UFs selecionadas (ou as da região) ficam com preenchimento cheio e borda de 2,5 px na cor de primeiro plano.
  - As demais ficam **só com o contorno**: preenchimento transparente ou ≤ 10% e borda de 1 px com contraste ≥ 3:1.
  - Sem seleção, todas ficam preenchidas, com borda de 1 px contrastante (hoje a borda é da cor do fundo, com 0,6 px).
- R8.2 **Seletor de visão** no card do mapa, lembrado nas preferências:
  - **Mapa:** o coroplético atual;
  - **Contorno:** só as bordas, com destaque da seleção;
  - **Satélite:** imagem de satélite de fundo, com as UFs por cima em preenchimento semitransparente, bordas e destaque da seleção.
- R8.3 No Satélite:
  - a atribuição do provedor fica visível;
  - QUANDO as imagens não carregarem, ENTÃO o card volta para "Mapa" e mostra o aviso "Imagem de satélite indisponível".
- R8.4 O clique no mapa segue R2.1 (`setCod`) nas três visões.

## R9. Relatório em PDF por página
- R9.1 Botão **"Relatório"** ao lado de "Reprocessar" e "Baixar", nas 7 páginas. Gera um PDF no navegador, sem serviço externo.
- R9.2 **Conteúdo, nesta ordem:**
  1. **Capa:** marca do painel (símbolo e wordmark), título da página, pergunta da página, filtros (território, ano e sexo), data e hora de geração, revisão do IBGE e endereço da página.
  2. **Sumário** com as seções e o número da página de cada uma.
  3. **Resumo:** o texto do Headline e o storytelling do modo atual.
  4. **KPIs:** valor, status, referência e "O que fazer".
  5. **Gráficos:** para cada um, título, descrição, texto de ajuda (R10), filtros aplicados, imagem do gráfico em alta resolução e a narrativa, se houver.
  6. **Fatos e Contexto** da página.
  7. **Notícias do IBGE:** título, data e link.
  8. **Anexos:** para cada gráfico, a tabela dos dados exatamente como plotados, formatados em pt-BR.
     - Tabelas com mais de 200 linhas são resumidas (primeiras e últimas), com a nota "dados completos no CSV" e o link do download.
  9. **Fonte e metodologia:** IBGE, Projeções da População, revisão 2024, e o link "Como ler este painel".
- R9.3 Tema claro sempre (mesmo com o painel no escuro), A4 retrato, rodapé "Página X de Y" e nome do arquivo `relatorio-<pagina>-<territorio>-<ano>.pdf`.
- R9.4 No modo Simples, o relatório traz o resumo e o storytelling simples, os KPIs e os anexos de dados. Uma nota avisa: "Gere no modo Técnico para incluir os gráficos". Não é preciso renderizar gráfico oculto.
- R9.5 Durante a geração:
  - o botão mostra progresso ("Gerando relatório… 3/8") e não aceita um segundo clique;
  - as animações ficam pausadas;
  - o painel não muda de layout visível.
- R9.6 Testes: unitário da montagem (seções na ordem, sumário com as páginas, anexos com as linhas) e e2e que baixa o PDF de uma página e confere o tamanho > 0 e o número de páginas ≥ 4.

## R10. Ajuda (?) em todos os gráficos
- R10.1 Todo gráfico tem o ícone (?) no título, inclusive os que hoje não têm `metricKey`.
- R10.2 O conteúdo vem de um campo `help` obrigatório no `dashboards.config.ts`, com quatro partes:
  - **O que mostra:** 1 frase;
  - **Como ler:** 1–2 frases;
  - **Filtros que afetam:** gerado da matriz de R2.4;
  - **Fonte:** gerada.
- R10.3 Um teste falha se algum gráfico das 7 páginas não tiver `help`.
- R10.4 Gráficos com métrica do glossário mantêm o link para o glossário dentro da ajuda.
