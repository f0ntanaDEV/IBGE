# Avaliação do app em produção (ibge-eight.vercel.app, 11/11/2026)

Legenda: ✅ atende · ⚠️ atende parcialmente · ❌ não atende

## 1. Requisitos de negócio e objetivo
| Critério | Situação | Evidência |
|---|---|---|
| Público definido | ❌ | Nenhuma página diz para quem é o painel. Os modos Técnico e Simples ajustam a profundidade, mas sem personas declaradas. |
| Pergunta de negócio central | ⚠️ | A página Insights tem perguntas estratégicas, mas os dashboards em si têm apenas subtítulos descritivos ("Brasil, 2026. Projeções da população…"), sem a pergunta que cada página responde. |
| Ações vinculadas | ❌ | Os KPIs mostram setas (↑/↓), mas sem status (favorável/atenção/crítico), sem referência e sem orientação do que fazer. Uma seta para cima no índice de envelhecimento não diz se isso é bom ou ruim. |

## 2. Requisitos de dados
| Critério | Situação | Evidência |
|---|---|---|
| Confiabilidade e integridade | ⚠️ | Pipeline e validações existem, mas a interface passa sinais de erro: <br>• **262.383 valores marcados como atípicos** nas bases oficiais (11.019 só na ds1); a tabela da ds1 mostra "Atípica: Sim" para idades 4, 5, 6 e 8 do Brasil em 2026, que são valores normais. <br>• Fatos da Qualidade: "Validações aprovadas **103 · 103/113**" (10 falhas sem explicação). <br>• Histórico de execuções com "original · **0 linhas**". <br>• A coluna `outlier_motivo` aparece em "Nulos por coluna" com 628.620 nulos "depois", como se o tratamento tivesse criado nulos. <br>• "Base de demonstração: sem execução". <br>• Card **Contexto vazio** na Visão Geral (1280 px), ds1, ds3 e ds4: a API responde 200 (ds4), mas o card não renderiza; as chamadas da ds1 e da ds3 ficam pendentes. <br>• Números mal formatados: "2.041" e "2.026" nas Observações finais, "+97,2% do pico", "DF 80.03", eixo das barras divergentes com "-3.383426890799996". <br>• Fatos com rótulos trocados: "Filhos por mulher 1,51 · **2002: 2,10**", "Esperança de vida 77,03 anos · **2000: 5,93 anos**", "Esperança de vida: total, homens e mulheres 77,03 anos · **2026: 73,75 anos · 2026: 80,27 anos**". <br>• Arredondamento inconsistente: índice de envelhecimento 89,06 no KPI e 89,10 nos Fatos. <br>• Narrativas erradas ou sem sentido: "No Brasil, TFT chega ao pico em 2000", "no Brasil, População cresce 14% no período". <br>• Notícias da ds1 sem relação com o assunto (encontro com adolescentes, programação da Confest), apesar do título "Notícias que confirmam". |
| Atualização (frequência e "última atualização") | ❌ | Não há data de atualização visível. O cabeçalho diz "Último processamento: original, 639.639 linhas" (sem data) e a Visão Geral não mostra nada. Não está dito que os dados são **estáticos** (Revisão 2024, divulgada em 22/08/2024) nem com que frequência as notícias são atualizadas. A data da última execução só aparece nos Fatos da Qualidade, em formato ISO ("2026-11-11"). |
| Consistência de métricas | ⚠️ | O "?" explica as siglas, mas a mesma métrica tem nomes diferentes: "Índice de envelhecimento" / "IE60" / "Idosos para cada 100 crianças"; "Taxa de fecundidade" / "TFT" / "Filhos por mulher". As variações são sempre em % relativa, inclusive para taxas e anos ("Esperança de vida ↑ 2,0%" deveria ser "+1,5 ano"; "TFT ↓ 12,0%"). A ds5 mostra "nqx na idade 0: **0,01**" e "Sobreviventes aos 80: **54.569**", enquanto Contexto e Fatos mostram 11,83 por mil e 54,6 de 100. Não existe um dicionário de métricas visível. |

## 3. Requisitos de design e usabilidade
| Critério | Situação | Evidência |
|---|---|---|
| Regra dos 5 segundos | ⚠️ | A Visão Geral mostra 4 KPIs grandes no topo, o que ajuda. Faltam uma frase-resumo com a mensagem principal e o status de cada KPI. Na Indicadores e na Tábuas, os KPIs usam siglas ("e0", "TFT", "TMI", "IE60", "nqx na idade 0", "e60"), que exigem conhecimento técnico para serem lidas. |
| Hierarquia: topo com KPIs | ✅ | Todas as páginas de dados abrem com uma linha de 4 KPIs. |
| Hierarquia: meio com tendências | ✅ | Gráfico principal de série 2000–2070 logo abaixo dos KPIs. Porém o card Contexto vazio ao lado quebra a leitura. |
| Hierarquia: base com detalhamento | ✅ | Rankings, mapas, notícias e tabela no fim das páginas. Os Fatos (lista longa) ficam entre o meio e a base e empurram as tendências secundárias para baixo. |
| Storytelling com grandes números | ⚠️ | Os números são grandes e legíveis, mas não há uma narrativa de abertura ("O Brasil para de crescer em 2041"), nem comparação imediata com uma referência (Brasil, meta ou 2000) junto do número, e as Observações finais têm frases quebradas. |

## Conclusão
O trabalho **cumpre parcialmente**. A estrutura técnica e a hierarquia visual estão boas. Ficam pendentes: (1) declarar o público, a pergunta central e as ações; (2) dar status aos indicadores; (3) exibir a atualização dos dados; (4) padronizar as métricas; (5) corrigir os problemas de confiabilidade visíveis, que hoje minam a confiança no painel. A spec 13 trata todos esses pontos.
