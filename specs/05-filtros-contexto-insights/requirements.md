# Spec 11: Requisitos (Filtro de território, Contexto, base de demonstração e Insights)

Prevalece sobre as specs anteriores. Respeite o estado vigente em `.cursor/rules/01-project.mdc` (sem animações, sem busca, sem Expandir).

Conteúdo pronto (transcrever, não reescrever):
- `conteudo/contexto.md`: itens do card Contexto por página, com fórmulas e valores de referência;
- `conteudo/insights-explicacoes.md`: explicação curta, números-chave e gráfico relacionado de cada pergunta dos Insights.

---

## R1. Filtro de território: correção completa
O usuário relata falhas no filtro de território, sem detalhar o sintoma. Por isso, esta seção define o **contrato completo** do filtro e uma **matriz de testes** que cobre todos os casos.

- R1.1 **Diagnóstico primeiro**: rodar a matriz do R1.9 no estado atual, listar em `DECISIONS.md` cada falha encontrada (página, transição, sintoma) e só então corrigir.
- R1.2 **Fonte única da verdade**: o parâmetro `cod` da URL. Sem `cod`, vale 0 (Brasil). O valor é lido com `Number()`, validado contra `dim_territorio` e, se for inválido, volta para 0 com o aviso "Território inválido, exibindo Brasil". O valor 0 nunca é tratado como "vazio" (`cod != null`, nunca truthiness).
- R1.3 **Opções do Select**: grupos "Brasil" (1), "Regiões" (5, em ordem: Norte, Nordeste, Sudeste, Sul, Centro-Oeste) e "Unidades da Federação" (27, em ordem alfabética do nome). O valor da opção é o `cod` em string; o rótulo é o nome. O Select reflete sempre o `cod` da URL, inclusive após voltar/avançar no navegador.
- R1.4 **Persistência entre páginas**: ao navegar pela sidebar, o `cod` (e o `ano`) são mantidos na URL de destino. Recarregar a página mantém o território.
- R1.5 **Ao trocar de território**:
  - limpar seleções cruzadas (`sel_uf`, `sel_regiao`) e drills territoriais (`d_*` de mapa, ranking, slope, barras divergentes e dispersão);
  - manter `ano` e `sexo`;
  - atualizar **tudo** o que depende do território: KPIs, gráficos, Smart Narratives, card Contexto (R2), Fatos (com a regra da spec 10: UF mantém os fatos do último território válido), notícias relacionadas e tabela.
- R1.6 **Gráficos por UF** (ranking, mapa, slope, barras divergentes, dispersão):
  - Brasil: as 27 UFs;
  - região: só as UFs da região, com o mapa enquadrado na região;
  - UF: as UFs da região dessa UF, com a UF selecionada destacada (acento) e as demais em tom neutro.
- R1.7 **Gráficos de série** (população, e0, TFT etc.): mostram a série do território selecionado. Onde fizer sentido, acrescentam a linha de referência do Brasil em tom neutro, com o rótulo "Brasil", quando o território não é o Brasil.
- R1.8 **Erros**: nenhuma combinação válida de filtros pode resultar em erro ou em card vazio. Combinação inválida → 422 com mensagem clara, exibida no `ErrorState` com "Tentar novamente".
- R1.9 **Matriz de testes E2E** (todas as páginas de dados × modo Técnico e Simples):
  - transições: `0 → 2 → 0`, `0 → 29 → 0`, `29 → 2 → 35 → 0`, `0 → 5 → 53 → 5`, troca de território com um drill aberto e com uma seleção cruzada ativa, voltar/avançar do navegador, recarregar com `?cod=29`, navegar para outra página com `cod=35`, `?cod=99` (inválido);
  - em cada passo: nenhum `ErrorState`, nenhum card vazio, o Select exibe o território certo e o KPI de população confere com a referência do R1.10.
- R1.10 Valores de referência (2026): Brasil 214.211.951 · Nordeste 57.366.981 · Bahia 14.889.472.
- R1.11 API: teste parametrizado com todos os 33 códigos em todos os endpoints que recebem `cod`, todos respondendo 200.

## R2. Card Contexto em todas as páginas de dados
- R2.1 Visão Geral e os 5 datasets passam a ter o card **"Contexto"** ao lado do gráfico principal: [gráfico principal 8 · Contexto 4], inclusive na ds2 e na ds5 (que hoje usam o gráfico com 12 colunas).
- R2.2 O card tem de **5 a 7 itens** com dados do assunto da página, **correlacionados aos gráficos** da própria página (lista e fórmulas em `conteudo/contexto.md`). Cada item mostra:
  - rótulo, valor (via `formatValue`) e uma linha curta de interpretação;
  - o chip **"Ver no gráfico: {nome do gráfico}"**, que rola até o card do gráfico relacionado e lhe dá foco (sem animação).
- R2.3 Os itens respondem a **Território (incluindo UF), Ano e Sexo** (quando aplicável). Diferente dos Fatos, o Contexto acompanha a UF selecionada.
- R2.4 **Censo 2022** vira um item do Contexto nas páginas aplicáveis (Visão Geral, ds1, ds3, ds4), com projeção × recenseado e diferença. Se o dado do Censo não estiver disponível, o item é omitido e os demais permanecem. Nunca exibir "—".
- R2.5 Itens que dependem de comparação com o Brasil ("participação no Brasil", "posição entre as UFs") só aparecem quando o território não é o Brasil. Com o Brasil, aparecem os itens alternativos indicados em `contexto.md`.
- R2.6 Altura do card = `--card-h-chart`. Os itens cabem sem rolagem em 1280 px; se não couberem, o card rola internamente. Nada sai do card.
- R2.7 No modo Simples, os mesmos itens aparecem na categoria "Como está hoje" do bloco "Entenda os dados", com números simplificados e sem os chips de gráfico.
- R2.8 Cálculo no backend: `GET /api/v1/context?page=<pageId>&cod=<0..53>&ano=<2000..2070>&sexo=<T|H|M>` (de `services/context/`). Testes golden com Brasil e Bahia em 2026.

## R3. Base de demonstração (suja) exibida corretamente
Sintoma: com "Base de demonstração (suja)" selecionada na página de Qualidade, os números não correspondem ao que foi inserido.

- R3.1 **Diagnóstico** (registrar a causa em `DECISIONS.md`). Verificar:
  1. se os arquivos `*_sujo.xlsx` existem no ambiente Docker (o gerador pode nunca ter rodado lá);
  2. se a semeadura processa a fonte `sujo` e grava `etl_runs.source = 'sujo'`;
  3. se o endpoint filtra por `source` e se o cache (backend e TanStack Query) inclui `source` na chave;
  4. se o seletor da página envia `source=sujo`;
  5. se a base suja passa pelas mesmas etapas de reshape da original (ds1/ds2 em formato largo);
  6. se nulos, duplicatas e outliers estão sendo contados **antes** do tratamento ("antes") e **depois** ("depois") na base certa.
- R3.2 **Manifesto do gerador**: `make_dirty` grava, junto de cada arquivo sujo, `data/raw/<ds>_sujo.manifest.json` com as contagens **exatas** do que foi inserido: `nulls_injected` (por coluna), `exact_duplicates`, `key_duplicates`, `outliers` (linhas, colunas e fator), `whitespace_cells` e `recoverable_ids`. A seed fixa (42) torna o manifesto reprodutível.
- R3.3 Na página de Qualidade, com a fonte "suja", cada problema é exibido em três colunas: **Inserido** (manifesto) · **Detectado** (relatório) · **Corrigido/Sinalizado** (relatório), por dataset, com um selo de status:
  - **ok** quando detectado = inserido (nulos, duplicatas e ids) ou detectado ≥ 90% dos inseridos (outliers);
  - **atenção** abaixo disso.
- R3.4 A comparação "Base original × Base de demonstração" fica lado a lado no mesmo card (duas colunas), com as mesmas métricas, para evidenciar o tratamento.
- R3.5 A fonte selecionada fica na URL (`?source=sujo`) e no título da página ("Qualidade de dados · Base de demonstração").
- R3.6 Teste de integração: para cada dataset, processar a base suja e conferir que nulos imputados = `nulls_injected` (excluindo os estruturais), duplicatas removidas = `exact_duplicates + key_duplicates`, ids recuperados = `recoverable_ids`, outliers sinalizados ≥ 90% de `outliers`, e que, após o tratamento, os valores recuperados ficam a ±1% dos originais.

## R4. Insights com caixas expansíveis
- R4.1 Cada pergunta vira uma **caixa expansível** (accordion, sem animação), com:
  - **cabeçalho** (sempre visível): número da pergunta, a pergunta (`h3`), a linha **"Por que esta pergunta importa"** (texto de `insights-explicacoes.md`, até 25 palavras) e o ícone de chevron;
  - **conteúdo** (ao expandir): a resposta (texto da spec 10), os **3 números-chave** em chips e o link **"Ver na página: {gráfico}"**, que abre a página com o território Brasil e rola até o gráfico.
- R4.2 Por seção: botões "Expandir todas" e "Recolher todas". Estado inicial: todas recolhidas, exceto a primeira pergunta da primeira seção.
- R4.3 Abrir uma caixa atualiza a URL com a âncora (`#ds4-3`); abrir a página com âncora expande e rola até a caixa correspondente.
- R4.4 Acessibilidade: botão com `aria-expanded` e `aria-controls`, navegação por teclado (`Tab`, `Enter`/`Espaço`), foco visível e conteúdo legível com alto contraste.
- R4.5 Visual: caixas em card com borda de 1 px (2 px no alto contraste); cabeçalho com padding confortável; resposta com largura máxima de `72ch`; números-chave em chips neutros (sem cores vibrantes). Seções com título, link "Ir para a página" e a contagem "5 perguntas".
- R4.6 O índice da página mostra as 7 seções e a seção "Padrões dos dados". Os padrões também viram caixas expansíveis (título no cabeçalho, texto no conteúdo).
- R4.7 O teste de 7 a 12 linhas da spec 10 passa a valer para a resposta expandida.

## R5. Verificação
- R5.1 Suítes web, api e e2e verdes.
- R5.2 E2E: matriz do R1.9; Contexto com 5–7 itens em todas as páginas e chips levando ao gráfico; valores golden do Contexto (Brasil e Bahia); Qualidade "suja" com todos os selos **ok**; Insights (expandir/recolher, âncora na URL, teclado).
- R5.3 Screenshots atualizados das páginas alteradas (1280 px, temas claro e escuro).
