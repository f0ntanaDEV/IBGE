# Etapa 4: Requisitos (Modo de visão simplificada)

Objetivo: permitir que **qualquer pessoa** entenda os dados sem conhecimento técnico. O modo simplificado resume números, reduz detalhes e explica em linguagem leiga. Ele coexiste com a visão completa (atual).

## R1. Alternância de visão
- R1.1 O header DEVE ter um controle segmentado **"Completa | Simplificada"**, também disponível em Configurações e no command palette ("Alternar visão").
- R1.2 A escolha DEVE ser persistida e refletida na URL (`?visao=simples`), para que um link compartilhado abra no mesmo modo.
- R1.3 Na primeira visita, um diálogo único de boas-vindas pergunta "Como você prefere ver os dados?" com as duas opções e uma prévia de cada. Ele pode ser fechado e não reaparece.
- R1.4 A troca de modo NÃO DEVE recarregar dados nem perder filtros.

## R2. Números resumidos (regra obrigatória)
No modo simplificado, **nenhum valor completo pode aparecer em lugar algum**: texto, KPI, eixo, tooltip, rótulo, `aria-label`, `title`, narrativa, tabela ou exportação.

| Tipo | Completo | Simplificado |
|---|---|---|
| Inteiro ≥ 1.000 | 214.211.951 | **214 mi** (≥ 100 na unidade: sem casa decimal) |
| | 8.542.314 | **8,5 mi** (< 100 na unidade: 1 casa) |
| | 1.284 | **1,3 mil** |
| Inteiro < 1.000 | 999 | 999 |
| Percentual | 14,6732% | **15%** (0 casas; < 1% vira "menos de 1%") |
| Por mil (‰) | 12,42‰ | **12 a cada mil** |
| Anos (e0, idade) | 76,6057 | **77 anos** |
| Taxa decimal (TFT) | 1,5468 | **1,5 filho por mulher** |
| Índice (IE60) | 81,25 | **81 idosos para cada 100 jovens** |
| Variação | +3,8421% | **↑ 4%** ou "praticamente igual" (\|Δ\| < 0,5%) |
| Ano | 2041 | 2041 (sem alteração) |

- R2.1 Toda renderização numérica DEVE passar por uma única função `formatValue(value, metric, view)`. Formatação ad hoc (`toLocaleString`, `toFixed`, template string) em componentes é proibida.
- R2.2 A visão completa mantém a formatação atual (valores exatos, pt-BR).
- R2.3 Um teste automatizado DEVE renderizar cada página no modo simplificado e falhar se o DOM (incluindo atributos `aria-*` e `title`) contiver um número com separador de milhar (ex.: 214.211.951), com 5 ou mais dígitos seguidos ou com mais de 1 casa decimal. Anos (4 dígitos, sem separador) passam.

## R3. Interface com menos detalhes
- R3.1 Por dashboard: **3 KPIs** (não 4) e **no máximo 2 gráficos**, escolhidos em `dashboards.config.ts` (campo `simple`).
- R3.2 Ficam ocultos: DataTable, ações de reprocessar/upload, página e link "Qualidade de Dados", seleção de sexo (fixado em "Ambos"), métricas técnicas (`nMx`, `nAx`, `Sx`, `Tx`, `TEF` por idade, razões de dependência 60/65 separadas) e escalas logarítmicas.
- R3.3 Gráficos simplificados: no máximo 5 marcas nos eixos, rótulos diretos nas séries em vez de legenda, sem grade secundária e no máximo 3 séries por gráfico.
- R3.4 Pirâmide em **faixas amplas** (0–14, 15–29, 30–44, 45–59, 60–74, 75+), não por idade simples.
- R3.5 Território simplificado: o seletor mostra "Brasil" e as 27 UFs por nome (sem siglas nem regiões) e oferece busca.
- R3.6 Tipografia um passo maior (base 16 → 17 px) e mais espaço entre seções.
- R3.7 Downloads ficam indisponíveis. Em seu lugar aparece o botão "Ver dados completos", que troca para a visão completa.

## R4. Linguagem leiga
- R4.1 Um glossário central (`glossary.ts`) DEVE ter, para cada métrica exibida: `rotuloSimples`, `explicacao` (até 25 palavras, sem siglas e sem jargão) e `analogia` opcional.
  - Exemplo: `e0_t` → "Quanto tempo as pessoas vivem, em média" / "É a idade média que um bebê nascido neste ano deve alcançar." / "Em 2000, a média era cerca de 70 anos; hoje passa de 76."
- R4.2 Cada KPI e cada gráfico DEVE ter um ícone "?" que abre um popover com a explicação e a analogia.
- R4.3 Cada dashboard abre com um card **"Em poucas palavras"**: 2 ou 3 frases geradas pelas Smart Narratives (Etapa 5) no registro leigo.
- R4.4 Os títulos dos gráficos DEVEM ser perguntas ou afirmações ("O Brasil está envelhecendo?", "Quantos filhos as mulheres têm, em média?") em vez de nomes técnicos.
- R4.5 Os nomes das páginas na sidebar DEVEM ser amigáveis (ex.: "Tábuas de mortalidade" → "Quanto tempo vivemos").
- R4.6 Os textos DEVEM ter frases curtas (média ≤ 15 palavras), voz ativa e nenhuma sigla sem explicação.

## R5. Acessibilidade
- R5.1 Leitores de tela recebem o mesmo conteúdo resumido (R2 vale para `aria-label`).
- R5.2 Contraste e foco iguais ou melhores que na visão completa.
