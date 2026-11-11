# Spec 13: Requisitos (Negócio, confiabilidade, atualização e storytelling)

Baseada na avaliação do app em produção (`avaliacao.md`, nesta pasta). Prevalece sobre as specs anteriores. A spec 12 (Power BI) foi descartada e **não deve ser implementada**.
Conteúdo pronto: `conteudo/regras-kpi.md` (status e ações dos KPIs).

---

## Parte 1: Negócio e objetivo

### R1. Público declarado
- R1.1 Personas definidas e exibidas na nova página **"Como ler este painel"** (`/sobre`, item no rodapé da sidebar):
  - **Gestor público ou executivo**: decisões de planejamento (saúde, educação, previdência, infraestrutura); lê o topo das páginas e o modo Simples.
  - **Analista ou pesquisador**: compara territórios e séries; usa o modo Técnico, os detalhamentos e os dados para download.
  - **Estudante ou cidadão**: entende a mudança demográfica; usa o modo Simples e os Insights.
- R1.2 Cada página de dados mostra, no cabeçalho, uma linha discreta **"Para: {persona principal}"**. O modo Simples é recomendado ao gestor, e o Técnico ao analista.

### R2. Pergunta central por página
- R2.1 O cabeçalho de cada página passa a ter a **pergunta central** em destaque (abaixo do título):

| Página | Pergunta central |
|---|---|
| Visão Geral | A população brasileira ainda vai crescer? Até quando? |
| População por idade | Como a distribuição por idade está mudando e onde estará a demanda por serviços? |
| Grupos quinquenais | Quais faixas etárias crescem e quais encolhem? |
| Grupos etários | Quando haverá mais idosos do que crianças e quanto tempo resta de bônus demográfico? |
| Indicadores | Em que ritmo estamos vivendo mais e tendo menos filhos, e onde? |
| Tábuas de mortalidade | Quantos chegam a cada idade e onde há mortes evitáveis? |
| Qualidade de dados | Os números exibidos são confiáveis? |

- R2.2 A **resposta curta** vem logo abaixo, como a frase-resumo do R9.1.
- R2.3 A página Insights linka cada pergunta central à sua página.

### R3. Status e ações nos indicadores
- R3.1 Todo KPI recebe um **status** (Favorável · Atenção · Crítico) calculado pelas regras de `conteudo/regras-kpi.md`, exibido como selo com ícone + texto ao lado do valor.
- R3.2 Cores do status nos tokens `--status-good`, `--status-warn` e `--status-bad`: tons **dessaturados**, coerentes com o visual sóbrio, sempre acompanhados de ícone (`CircleCheck`, `CircleAlert`, `CircleX`) e texto; versões de alto contraste com ≥ 7:1.
- R3.3 O popover "?" de cada KPI mostra: definição, regra do status (limites) e **"O que fazer"** (a ação sugerida da tabela).
- R3.4 Nova faixa **"O que fazer"** logo abaixo dos KPIs, listando as ações dos KPIs em Atenção ou Crítico (no máximo 3, ordenadas por gravidade), cada uma com o KPI de origem. Se todos estiverem favoráveis: "Nenhum indicador pede ação neste território e ano".
- R3.5 Os status reagem a Território e Ano. A esperança de vida compara com o Brasil no mesmo ano (quando o território não é o Brasil).
- R3.6 A página "Como ler este painel" explica que os limites são parâmetros do painel (não metas oficiais) e lista todas as regras.

---

## Parte 2: Dados

### R4. Confiabilidade: correções obrigatórias
- R4.1 **Falsos atípicos**: as bases oficiais não podem exibir centenas de milhares de valores atípicos. Diagnosticar a regra atual (registrar em `DECISIONS.md`) e ajustá-la para que, nas bases **originais**, os sinalizados fiquem abaixo de 0,5% das linhas e nenhuma idade do Brasil em 2026 apareça como "Atípica". Sugestão: limiar sobre a variação ano a ano relativa **à própria série**, com `factor = 3` no IQR das variações e mínimo absoluto de variação de 5%; excluir 2020–2021 das referências da série (choque real da pandemia). A base suja continua detectando ≥ 90% dos outliers inseridos (spec 11).
- R4.2 **Validações**: os Fatos e a página de Qualidade usam a **mesma** contagem. "103/113" deve virar "X de Y aprovadas" coerente com a lista; regras com falha aparecem na lista com o motivo. O status "Validações aprovadas" segue a regra de `regras-kpi.md`.
- R4.3 **Histórico**: cada execução mostra data e hora (`dd/mm/aaaa hh:mm`), fonte, linhas processadas (nunca 0 para execução bem-sucedida) e status.
- R4.4 **Nulos por coluna**: colunas criadas pelo tratamento (`is_outlier`, `outlier_motivo`, `row_uid`) não entram na contagem de nulos.
- R4.5 **Base de demonstração**: deve existir uma execução `sujo` em produção (a semeadura roda também no deploy). "Sem execução" não pode aparecer em produção.
- R4.6 **Card Contexto**: diagnosticar por que ele não renderiza (a API responde 200 com itens na ds4, e as chamadas da ds1 e da ds3 ficam pendentes) e corrigir. Provavelmente há duas causas: (a) altura/overflow do card a 1280 px; (b) tempo de resposta acima do limite da função serverless. Corrigir as duas: o card nunca fica vazio (skeleton → itens ou erro com "Tentar novamente") e `/context` responde em < 1 s (cache por `page, cod, ano, sexo` e pré-aquecimento no deploy).
- R4.7 **Formatação** (corrigir em todos os lugares):
  - anos com ponto nas narrativas ("2.041", "2.026");
  - "+97,2% do pico" → "97,2% do pico";
  - decimais com ponto ("DF 80.03");
  - eixo das barras divergentes com floats crus;
  - "por mil por mil" duplicado;
  - "40-44" com hífen (usar "40–44").
- R4.8 **Fatos com rótulos trocados**: os valores de detalhe (`detail_values`) devem ser rotulados corretamente. Formato padrão: `valor principal · rótulo do detalhe: valor`. Exemplos corretos:
  - "Filhos por mulher: 1,51 · abaixo de 2,1 desde 2002";
  - "Esperança de vida ao nascer: 77,03 anos · +5,93 anos desde 2000";
  - "Esperança de vida: 77,03 · homens 73,75 · mulheres 80,27";
  - "Pico populacional: 2041 · 220.425.299 pessoas".
  Teste: nenhum fato pode repetir o ano de referência como rótulo de dois detalhes diferentes.
- R4.9 **Arredondamento único**: o mesmo indicador tem o mesmo número de casas em KPI, Contexto, Fatos e narrativas (definido no dicionário, R6).
- R4.10 **Narrativas**: corrigir frases sem sentido ("TFT chega ao pico em 2000" → usar tendência: "caiu de 2,32 para 1,51"; "no Brasil, População cresce 14%…" → frase com inicial maiúscula e sujeito correto). Teste de regras: pico/vale só quando o extremo não está nas pontas da série; frases sempre começam com maiúscula.
- R4.11 **Notícias que confirmam**: só exibir notícias com relevância mínima (a palavra-chave aparece no título ou no resumo) e com relação com a página. Se houver menos de 3, completar com uma lista curada por dataset (`content/news-curated.ts`, com títulos e links oficiais do IBGE já validados) e nunca mostrar notícias genéricas da agenda institucional.

### R5. Atualização visível
- R5.1 Toda página de dados mostra, abaixo do título, a linha **"Dados: Projeções da População do IBGE, Revisão 2024 (divulgada em 22/08/2024) · Atualização: a cada nova revisão do IBGE · Processado em {dd/mm/aaaa hh:mm}"**.
- R5.2 Notícias: "Notícias atualizadas a cada 6 h · última atualização {hh:mm}".
- R5.3 Ícone "i" ao lado da linha com a explicação: "Projeções não mudam diariamente; os números só mudam quando o IBGE publica uma nova revisão".
- R5.4 Se a última execução tiver mais de 30 dias e houver uma revisão mais nova configurada (`IBGE_LATEST_REVISION` no `.env`), exibir o selo "Revisão nova disponível".

### R6. Consistência de métricas
- R6.1 **Dicionário único** `apps/api/app/domain/metricas.yaml`, exposto em `/api/v1/metrics` e usado pelo frontend em KPI, gráfico, Contexto, Fatos, narrativas e tabelas. Campos:
  - `id`, `nome` (padrão, sem sigla), `sigla`, `definicao`, `formula`, `unidade`;
  - `casas_decimais`, `tipo_variacao` (`relativa` % | `pontos` p.p. | `absoluta` na unidade);
  - `fonte` e `regra_status` (referência a `regras-kpi.md`).
- R6.2 **Nome único por métrica** em toda a interface. Siglas só no "?" e entre parênteses na primeira menção da página Indicadores. Nomes padrão:
  - População;
  - Esperança de vida ao nascer;
  - Vida restante aos 60;
  - Filhos por mulher;
  - Mortalidade infantil;
  - Idosos para cada 100 crianças;
  - Idade mediana;
  - Razão de dependência;
  - Risco de morrer antes de 1 ano;
  - Chegam aos 80 (de cada 100).
- R6.3 **Variação pelo tipo certo**:
  - contagens → % relativa ("↑ 5,1% em 10 anos");
  - percentuais → pontos percentuais ("↓ 3,0 p.p.");
  - anos, taxas e índices → diferença absoluta na unidade ("↑ 1,47 ano", "↓ 0,21 filho por mulher", "↑ 31,7").
- R6.4 KPIs da ds5 com a mesma escala do Contexto: "Risco de morrer antes de 1 ano: 11,83 por mil" e "Chegam aos 80: 54,6 de cada 100".
- R6.5 Nova seção **"Dicionário de métricas"** na página "Como ler este painel", gerada do `metricas.yaml`.

---

## Parte 3: Design e storytelling

### R7. Hierarquia fixa das páginas de dados (modo Técnico)
```
TOPO   Título · pergunta central · linha de atualização · filtros
       Frase-resumo (manchete) com o número principal
       KPIs (4) com status · faixa "O que fazer"
MEIO   Tendência principal (8) · Contexto (4)
       Tendências secundárias (6 + 6)
BASE   Detalhamento: rankings/mapas por UF · Fatos · Observações finais · Notícias · Tabela
```
- R7.1 Os Fatos descem para a **base** (depois das tendências).
- R7.2 O topo (manchete + KPIs + "O que fazer") cabe na primeira dobra em 1280 × 800.

### R8. Regra dos 5 segundos
- R8.1 KPIs sem siglas e com status (R3, R6).
- R8.2 Cada KPI mostra uma **referência** junto ao número: o Brasil (quando o território não é o Brasil) ou o ano 2000 (quando é).
- R8.3 Teste E2E proxy: em 1280 × 800, sem rolar, ficam visíveis a pergunta central, a manchete, os 4 KPIs com status e a linha de atualização.

### R9. Storytelling com grandes números
- R9.1 **Manchete** por página: uma frase gerada por regra, com o número principal em destaque grande (`text-3xl`), que responde à pergunta central. Exemplos (Brasil, 2026):
  - Visão Geral: "**214,2 milhões** de habitantes hoje. A população para de crescer em **2041**.";
  - Grupos etários: "Em **2029**, os idosos passam a ser mais numerosos que as crianças.";
  - Indicadores: "Vivemos **77 anos** em média, e cada mulher tem **1,5 filho**, abaixo da reposição.";
  - Tábuas: "**54,6 de cada 100** nascidos chegam aos 80 anos.".
  A manchete reage ao território e ao ano.
- R9.2 No modo Simples, a manchete é a primeira linha do bloco "Entenda os dados".
- R9.3 Gráficos de tendência ganham uma **anotação** do marco principal da pergunta central (pico, cruzamento, reposição), já existente em parte. Garantir uma por página.

## R10. Verificação
- R10.1 Suítes web, api e e2e verdes.
- R10.2 E2E:
  - status e "O que fazer" com os valores de referência de `regras-kpi.md` (Brasil e Bahia);
  - linha de atualização presente;
  - nenhuma sigla nos rótulos de KPI;
  - nenhum "Atípica: Sim" na ds1 Brasil 2026;
  - validações coerentes;
  - Contexto renderizado em todas as páginas;
  - nenhum ano com ponto;
  - nenhum float cru (regex `/\d\.\d{5,}/`);
  - teste da primeira dobra (R8.3).
- R10.3 Reavaliar o app em produção com a tabela de `avaliacao.md` e atualizar o arquivo com o novo status de cada critério.
