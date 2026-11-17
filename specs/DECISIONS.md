# Decisões

Uma linha por decisão: `AAAA-MM-DD | chave | decisão | motivo`.
A chave é a pasta da etapa em `specs/`.

## 01-backend

- 2026-11-05 | 01-backend | Estratégia padrão de outliers = `flag` | As bases são projeções oficiais; alterar valores mudaria o dado publicado. `cap`/`remove` exigem confirmação.
- 2026-11-05 | 01-backend | Detecção de outliers por variação ano a ano dentro de cada série | O IQR global marca ~12% das linhas porque mistura Brasil, regiões e UFs.
- 2026-11-05 | 01-backend | Base "suja" gerada com seed fixa | Os originais não têm nulos indevidos nem duplicatas; sem isso o tratamento não pode ser demonstrado nem testado.
- 2026-11-05 | 01-backend | `header_row` do yaml é o índice base 0 do pandas | Os números do design (5 ou 6) caem na linha dos nomes; a linha anterior é o cabeçalho agrupador.
- 2026-11-05 | 01-backend | `DATA_PROFILE.md` foi materializado a partir das planilhas | O arquivo citado nas specs não estava no repositório; os totais foram lidos com calamine e gravados para os testes golden.
- 2026-11-05 | 01-backend | Leitura de todas as abas com python-calamine; openpyxl só escreve | A ds5 pede calamine e o mesmo motor mantém as outras tabelas dentro do tempo.
- 2026-11-05 | 01-backend | Coluna que começa com dígito ganha prefixo `n_` | Ex.: `0-14_T` vira `n_0_14_t` e `60+_T` vira `n_60_mais_t`.
- 2026-11-05 | 01-backend | `INTERVALO DE IDADE` é publicado como `intervalo` | O requisito fala em `intervalo`; o rótulo da planilha é mais longo.
- 2026-11-05 | 01-backend | Desempate de duplicata usa a contagem de nulos anterior à imputação | Depois da interpolação as duas linhas ficam igualmente preenchidas e o critério de "menos nulos" se perderia.
- 2026-11-05 | 01-backend | Soma territorial e `_H+_M=_T` só em colunas de contagem ou proporção | Indicadores como TFT, e0 e TCG não somam entre UFs nem entre sexos.
- 2026-11-05 | 01-backend | `MYSQL_REQUIRED` default false; no compose fica true | A API responde pelo Parquet sem banco. Docker exige a carga e o rollback do MySQL.
- 2026-11-05 | 01-backend | Censo 2022 = agregado 4709, variável 93 | Confirmado nos metadados da API de Agregados (pesquisa CD, período 2022, sem classificação). Gravado em `apps/api/ibge_reference.json`.
- 2026-11-05 | 01-backend | Claim de "ano atual" usa o ano corrente se existir na série, senão o último ano | A revisão cobre 2000–2070, então 2026 está na tabela.
- 2026-11-05 | 01-backend | Tolerância das somas de contagem é 1 pessoa | Nascimentos da ds4 oficial divergem em até 4 pessoas; o relatório marca essa regra como falha e guarda a diferença.
- 2026-11-05 | 01-backend | `HealthOut` no `/health` | O retorno `dict` não gerava tipo no OpenAPI.
- 2026-11-05 | 01-backend | A API lê `.env` na raiz do repositório | O arquivo fica ao lado do compose; o caminho relativo ao cwd falhava ao subir a API de `apps/api`.
- 2026-11-05 | 01-backend | `env_file` do compose é opcional | O `.env` é local e o `docker compose up` do README falhava quando o arquivo ainda não existia.
- 2026-11-06 | 01-backend | Censo 2022 é a tabela 4709, variável 93, período 2022, níveis N1, N2 e N3 | Os metadados da API confirmam “População residente” em pessoas, só em 2022. O Brasil recenseado é 203.080.756, +3,8% abaixo da projeção de 210.862.983. A resposta fica em `data/cache/censo2022.json`.
- 2026-11-06 | 01-backend | API e MySQL no Railway; a Vercel só encaminha `/api` | A Vercel não hospeda MySQL. A API lê Parquet no disco e carrega o banco na subida.
- 2026-11-09 | 01-backend | A carga MySQL pula a tabela quando o número de linhas já é o do Parquet | O volume tem 500 MB e está em 441 MB. Recriar a ds1 em staging estoura com "table is full". O snapshot das notícias usa a mesma URL da consulta.
- 2026-11-11 | 01-backend | A imagem só pré-calcula as bases oficiais | Incluir a base suja e o cache de contexto no build estourou o prazo do Railway depois de `context overview 2000`. A suja segue na subida do processo e o contexto restante continua sob demanda.
- 2026-11-12 | 01-backend | O MySQL apaga os redo `_tmp` na subida e limita redo a 32 MB e o temporário a 32 MB | O plano trava o volume em 500 MB (434 MB úteis). O crash em loop deixou ~100 MB de `#ib_redo*_tmp` e o InnoDB não criava o `ibtmp1` (disco cheio). Aumentar o volume responde "Max size of 500 MB on current plan".
- 2026-11-12 | 01-backend | A API sobe com `AUTO_SEED=false` e `MALLOC_ARENA_MAX=2` | O plano limita a API a 1 GB. A semeadura da base suja na subida, junto com o tráfego, recebia `Killed` e o serviço ficava crashed. O MySQL já tem a execução suja de 11/11.
- 2026-11-12 | 01-backend | O Parquet tratado fica em um cache único do processo | A página de população por idade lia o ds1 em paralelo (pirâmide, calor, contexto, fatos e tabela). Cada leitura subia outra cópia e o processo recebia `Killed`, com 502 em seguida.

## 02-frontend-base

- 2026-11-05 | 02-frontend-base | Web em React (Vite) em vez de React Native | Shadcn UI e Tailwind são para React DOM; mobile fica para um app Expo futuro reaproveitando `packages/shared`.
- 2026-11-05 | 02-frontend-base | React 18.3, Vite 8 e Tailwind 4 | O template atual do Vite é o 8; os tokens continuam variáveis HSL em `:root` e `.dark`.
- 2026-11-05 | 02-frontend-base | Proxy `/api` do Vite para `127.0.0.1:8000` | O browser fala com a mesma origem; a API não precisa de CORS.
- 2026-11-05 | 02-frontend-base | TanStack Table 8 | A v9 trocou `useReactTable`; a v8 mantém o contrato de colunas, ordenação e paginação.
- 2026-11-05 | 02-frontend-base | Rótulos curtos dos datasets na navegação | O nome oficial fica no título da página.
- 2026-11-05 | 02-frontend-base | `ChartCard` aceita `onRetry` | O estado de erro precisa da ação "Tentar novamente".
- 2026-11-05 | 02-frontend-base | Gráficos com saturação ≤ 28% e luminosidade distinta | Continua um único acento e os tons se separam também para daltonismo.
- 2026-11-05 | 02-frontend-base | Percentual em `formatValue` é proporção de 0 a 1 | A visão completa já usa o estilo percent do Intl, que multiplica por 100.
- 2026-11-05 | 02-frontend-base | A regra de formatação fica no oxlint e num teste de varredura | O app já usa oxlint; o teste cobre o mesmo conjunto fora de `lib/format.ts`.
- 2026-11-05 | 02-frontend-base | O teste de vazamento olha cada nó de texto e cada aria/title | O textContent do container cola anos vizinhos do seletor e geraria falso positivo.
- 2026-11-05 | 02-frontend-base | `plural` usa `formatValue` | O teste de formatação desta etapa barra `Intl.NumberFormat` fora de `lib/format.ts`.
- 2026-11-06 | 02-frontend-base | O header quebra linha em vez de esticar a página | Os botões da barra (visão, busca, tema, Modo leve) passavam da largura em 375 e 768 px.

## 03-dashboards

- 2026-11-05 | 03-dashboards | Pirâmide sem `ano` devolve todos os anos | O slider troca o ano no cliente e precisa ficar abaixo de 100 ms.
- 2026-11-05 | 03-dashboards | Busca e ordenação no `/data` | O DataTable da etapa 2 já envia `q`, `sort` e `desc`.
- 2026-11-05 | 03-dashboards | Upload devolve a prévia de 10 linhas | A validação de colunas fica no servidor e o browser não lê xlsx.
- 2026-11-05 | 03-dashboards | Qualidade permanece em `/qualidade` | A navegação da etapa 2 já usa esse caminho.
- 2026-11-05 | 03-dashboards | A pirâmide simples mantém 6 faixas e o eixo numérico fica com 5 marcas | As faixas de R3.4 são o dado; o limite de R3.3 vale para as marcas numéricas.
- 2026-11-05 | 03-dashboards | Bônus demográfico = anos contíguos com RDT65 abaixo de 50 (ou 0,5 se a série for razão) que contêm o mínimo | O IBGE publica dependentes por 100 pessoas de 15–64; 50 é o limiar clássico de mais gente em idade ativa. O ponto de virada é o ano do mínimo.
- 2026-11-05 | 03-dashboards | Malha em GeoJSON de qualidade mínima, coordenadas com 3 casas | A resposta da API de Malhas já fica em 88 KB; TopoJSON não era necessário para o teto de 150 KB.
- 2026-11-06 | 03-dashboards | E2E usa `DATA_DIR` do repositório | O `.env` aponta `DATA_DIR=/data` do compose; sem override a API não lê os parquet locais.
- 2026-11-06 | 03-dashboards | Linha de base Playwright: 41 falhas, 43 ok, 6 skip | Rolagem horizontal já na página, sem overlay: 375 px chega a 398–562 e 768 px a 818. Fumaça sem marca em ds3 (1º gráfico), ds4 (7 gráficos) e ds5 (4º), com e sem Modo leve. Um timeout de título na visão geral a 768 px.
- 2026-11-06 | 03-dashboards | Snapshot das matérias vai na imagem da API e vale 7 dias | No Railway a consulta ao IBGE passa de 40 s e a tela fica vazia.
- 2026-11-09 | 03-dashboards | A busca vai entre aspas e o card só fica com matéria que cita o termo | A primeira página da Agência devolvia destaques institucionais em todos os temas.
- 2026-11-11 | 03-dashboards | Cada dataset devolve até 30 matérias das três páginas já no snapshot | O corte em 10 e a parada aos 6 acertos ocultavam matérias do tema que já estavam em cache.
- 2026-11-12 | 03-dashboards | O cabeçalho das bases fica só com Reprocessar e Baixar | A opção Enviar arquivo saiu do projeto.

## 04-modos-acessibilidade-insights

- 2026-11-06 | 04-modos-acessibilidade-insights | Fatos e bônus usam um parágrafo de 3 a 5 frases, com largura de 46 caracteres | O card estreito e a visão geral larga quebram o mesmo texto em 3 a 5 linhas. A barra de rolagem usa fundo e muted; a seleção usa o primário.
- 2026-11-09 | 04-modos-acessibilidade-insights | `cod=0` permanece Brasil e `nivel` incompatível responde 422 | O código 0 é valor válido; ausência do parâmetro é `None`. Misturar Brasil com `nivel=uf` esvaziava a consulta.
- 2026-11-09 | 04-modos-acessibilidade-insights | Relatório de qualidade publicado no contrato novo; o pipeline interno guarda o formato antigo | A página lia `/runs` (`rows_in` ou `report_json` string) e o arquivo usa `rows_before`. Original e sujo no mesmo segundo compartilhavam o nome do arquivo e o segundo apagava o primeiro.
- 2026-11-09 | 04-modos-acessibilidade-insights | Sem banco, a semeadura só roda se ainda não houver parquet das cinco bases | Sem `etl_runs` não dá para saber se já houve sucesso; reprocessar a ds5 a cada subida seria o caminho pesado.
- 2026-11-09 | 04-modos-acessibilidade-insights | Fatos de qualidade registram 103 de 113 validações, não "todas" | Dez regras de soma da base oficial ficam acima da tolerância de 1 pessoa.
- 2026-11-09 | 04-modos-acessibilidade-insights | Modo Simples mostra cada categoria em um card próprio | O bloco único juntava indicadores, fatos e notícias no mesmo texto e dificultava a leitura.
- 2026-11-09 | 04-modos-acessibilidade-insights | Cada página de dados lista de 6 a 10 fatos, um por linha | A grade de duas colunas e o corte de 4 itens no modo Simples deixavam o bloco com menos de 6 linhas.

## 05-filtros-contexto-insights

- 2026-11-09 | 05-filtros-contexto-insights | `DATA_DIR=/data` inexistente cai na pasta `data/` do repositório, e o resumo sem sexo usa só o total | No Windows `/data` vira `C:\data`. O filtro Brasil pedia a base e recebia 404; somar homens, mulheres e ambos dobrava a população.
- 2026-11-11 | 05-filtros-contexto-insights | Filtro de território falhava antes da correção: `cod` inválido não voltava para 0 nem avisava; `setCod` usava `replace`, então voltar/avançar não desfazia a troca; a sidebar repassava a query inteira; as regiões saíam em ordem alfabética e a UF aparecia como "sigla · nome"; a visão geral fixava `cod=0`; mapa e ranking não filtravam a região nem enquadravam o mapa; as séries não tinham a linha do Brasil | Diagnóstico do R1.1 a partir do código vigente, antes de trocar o filtro. A matriz e2e e o teste dos 33 códigos passaram a existir junto com a correção.
- 2026-11-11 | 05-filtros-contexto-insights | Select nativo com três grupos, sem `@radix-ui/react-select` | O pacote não está instalado e a spec não pede dependência nova.
- 2026-11-11 | 05-filtros-contexto-insights | `/facts` fica de fora do teste dos 33 códigos | A etapa 4 responde 422 para UF (`territory_not_supported`); o card mantém o último território válido.
- 2026-11-11 | 05-filtros-contexto-insights | `cod` entre 0 e 53 que não é território (ex.: 6) responde 422 "Território N não existe"; acima de 53 a validação do query também é 422 | O limite `le=53` cobre o maior código de UF.
- 2026-11-11 | 05-filtros-contexto-insights | A base suja antiga não batia com o relatório porque `make_dirty` sujava o layout largo, não gravava manifesto e a imputação rodava antes da deduplicação, então cópias exatas divergiam e nulos de sigla entravam em `total_imputed` | Causa do R3.1. O gerador agora suja a base longa, reescreve o layout original e grava o manifesto. `row_uid` fica só em `outliers.rows`, não vira coluna da planilha.
- 2026-11-11 | 05-filtros-contexto-insights | Duplicatas e nulos do manifesto são contados depois do reshape, como o pipeline | Uma linha larga copiada vira uma duplicata por ano. `nulls_injected` ignora a linha duplicada removida e o nulo estrutural. `total_imputed` mede o que a imputação preenche, não o nulo que some porque a linha foi descartada.
- 2026-11-11 | 05-filtros-contexto-insights | O chip de comparação da ds2 aponta a pirâmide quinquenal e o de TMI aponta o mapa da esperança de vida | Não há gráfico separado com esses títulos; o slug precisa coincidir com o card existente.
- 2026-11-11 | 05-filtros-contexto-insights | Playwright sobe a API com `python -m uvicorn` | Neste ambiente não há `.venv/bin/python`.
- 2026-11-11 | 05-filtros-contexto-insights | O fallback de `DATA_DIR` só ocorre quando o diretório não existe | Um `DATA_DIR` explícito sem `processed/` (teste ou pasta vazia) estava caindo na base do repositório.
- 2026-11-11 | 05-filtros-contexto-insights | A barra de seleção cruzada regrava a URL a partir de `window.location.search` | O efeito lia os parâmetros anteriores e apagava o `cod` recém-escolhido.
- 2026-11-11 | 05-filtros-contexto-insights | O pré-aquecimento do contexto cobre os anos 2000, 2010, 2020, 2026, 2030, 2040, 2050, 2060 e 2070 | Seis páginas × 33 territórios × 71 anos passava de 14 mil cálculos no deploy.

## 06-negocio-confiabilidade-storytelling

- 2026-11-11 | 06-negocio-confiabilidade-storytelling | Atípico só quando o salto anual passa de 5%, fica a mais de 0,8 da mediana (ou 3×IQR, o que for maior) e a variação absoluta passa de 4× o IQR do nível; 2020–2021 ficam fora da referência | O piso de 5% sozinho marcava taxas perto de zero (fecundidade e mortalidade) e levava a ds4 a ~50% das linhas. Linhas sinalizadas na original, antes → depois: ds1 1,72% (11.019) → 0%; ds2 0,80% (1.062) → 0%; ds3 18,40% (431) → 0%; ds4 47,93% (1.123) → 0,30% (7); ds5 30,73% (43.199) → 0%. Brasil 2026 na ds1: nenhuma idade. Detecção na base suja (células marcadas / injetadas): ds1 3.330/3.108 (107%), ds2 678/649 (104%), ds3 912/740 (123%), ds4 707/626 (113%), ds5 10.715/6.114 (175%).
- 2026-11-11 | 06-negocio-confiabilidade-storytelling | A manchete de população usa o formato compacto | O valor cheio em pessoas estourava a primeira linha.
- 2026-11-11 | 06-negocio-confiabilidade-storytelling | Carimbo sem fuso é exibido como America/Sao_Paulo | O pipeline grava hora local sem offset; o Brasil não tem horário de verão.
- 2026-11-11 | 06-negocio-confiabilidade-storytelling | As cinco URLs curadas da Agência IBGE foram confirmadas manualmente | A spec pede validação humana antes de fechar a lista de notícias.
- 2026-11-11 | 06-negocio-confiabilidade-storytelling | A manchete destaca os números em negrito, no mesmo tamanho da frase | O `text-3xl` quebrava a linha e não seguia o exemplo visual pedido.
- 2026-11-12 | 06-negocio-confiabilidade-storytelling | Carimbo sem fuso é UTC do servidor e a tela mostra horário de Brasília; o “Processado em” usa a mesma execução do histórico | No Railway o relógio é UTC e o histórico aparecia sem fuso, diferente da linha de atualização.
- 2026-11-12 | 06-negocio-confiabilidade-storytelling | Grupos quinquenais e grupos etários ganham regras de status do painel; o selo do KPI é só o ícone, no canto inferior direito | Sem regra não havia decisão, e o texto do selo cortava o nome em 1280 px.
- 2026-11-12 | 06-negocio-confiabilidade-storytelling | Notícia que marca outro ano de pico populacional que não 2041 sai de “Notícias que confirmam” | A revisão usada é a de 2024; a matéria de 2018 ainda cita 2047.
- 2026-11-13 | 06-negocio-confiabilidade-storytelling | Novidades fica no rodapé da sidebar e o status da API no rodapé da página, na mesma coluna da trilha | O canto inferior esquerdo abre o histórico das specs. O status sai da sidebar e permanece no footer, alinhado a “Visão geral”.
- 2026-11-13 | 06-negocio-confiabilidade-storytelling | Configurações e Como ler este painel ficam no bloco inferior, com Novidades | Esses três itens são apoio da interface, separados da navegação dos dados.
- 2026-11-13 | 06-negocio-confiabilidade-storytelling | O painel se chama Analytics; a navbar troca a trilha por busca; variação anual abaixo de 0,5% mantém duas casas no modo simples; nmx no resumo vira mortalidade no primeiro ano, em óbitos por mil | A trilha repetia o menu, 0% escondia a variação e a sigla nmx não dizia o indicador.

## 07-animacoes-opcionais

- 2026-11-05 | 07-animacoes-opcionais | Perfil de longo prazo não foi gravado no Chrome DevTools neste ambiente | As animações usam só `transform`, `opacity` e `stroke-dashoffset`, o stagger para em 400 ms e listas acima de 30 itens não escalonam; a revisão com Modo leve fica no `MotionConfig` (`always`) e em `data-reduced-motion`.
- 2026-11-05 | 07-animacoes-opcionais | A página `/dev/motion` só entra no router quando `import.meta.env.DEV` | O laboratório não vai para o build de produção.
- 2026-11-06 | 07-animacoes-opcionais | Linhas somem porque o shape do Recharts 3 não traz `d` | O `DrawingPath` descartava o traço sem `d`; a curva nasce dos `points`. Vale com e sem Modo leve. O `pathLength` junto de `strokeDasharray` também apagaria o tracejado. O domínio do eixo não era a causa: a linha do hoje e os marcadores continuavam.
- 2026-11-11 | 07-animacoes-opcionais | A série projetada não usa a animação de desenho do Recharts; entra com fade nos últimos 20% da janela | O traço é `strokeDasharray` estático. A animação nativa mexe em `stroke-dashoffset` e, nas versões anteriores, apagava a linha tracejada. As séries sólidas continuam com a animação nativa.
- 2026-11-12 | 07-animacoes-opcionais | Contagem parte de 0 (decimal inclusive), o texto entra por caractere e Configurações não anima | O pedido pede 0,0, fade por caractere e exclui essa página. Cards visíveis repetem a entrada a cada visita, mesmo depois da janela de 800 ms. O aviso do Sonner fica no canto inferior esquerdo, expandido, e fora do reset de transição para não sobrepor no hover.
- 2026-11-12 | 07-animacoes-opcionais | Fade por letra fica só em KPIs e cards; todo número estatístico conta de 0 até o valor final | Cabeçalho, manchete e títulos de seção entram inteiros. Anos de calendário continuam estáticos. A contagem não retoma do valor anterior.
- 2026-11-12 | 07-animacoes-opcionais | Nenhum texto entra por letra ou palavra | O fade de texto saiu de KPIs, cards, insights e do modo simples, junto com o botão "Mostrar tudo". A contagem dos números permanece.
- 2026-11-14 | 07-animacoes-opcionais | Como ler, Novidades, Insights, Notícias, Qualidade e o iframe do Databricks entram no relógio da página | Essas telas não chamavam `usePageReady` nem usavam `Reveal`. Configurações continua fora.
- 2026-11-15 | 07-animacoes-opcionais | A página de erro sobe em quatro tempos quando as animações estão ligadas | O código, o título, o texto e as ações usam o mesmo fade do restante do painel. Com animações desligadas o conteúdo aparece inteiro.

## 08-negocio-confiabilidade-storytelling-v2

- 2026-11-14 | 08-negocio-confiabilidade-storytelling-v2 | Painel Lakeview em SQL sobre o Parquet tratado, sem recriar o React | O workspace lê as mesmas tabelas do ETL; a pirâmide vira barra com homens negativos e mapa, animação e notícias ficam de fora.
- 2026-11-14 | 08-negocio-confiabilidade-storytelling-v2 | `/databricks` embute o dashboard publicado e ocupa só a área de conteúdo | A navegação existente permanece; o iframe usa a URL de embed do mesmo painel.

## 09-ajustes-avaliacao

- 2026-11-14 | 09-ajustes-avaliacao | Snapshots antigos de `data/processed` (csv, xlsx, parquet) foram apagados, ficando o mais recente de cada dataset | A API lê só o arquivo mais novo de cada formato; os JSON de relatório e as planilhas de `data/raw` continuam.
- 2026-11-15 | 09-ajustes-avaliacao | O selo de status do KPI fica na mesma altura da variação, à direita da última linha | O ícone absoluto ficava abaixo do texto.
- 2026-11-15 | 09-ajustes-avaliacao | O "?" do KPI abre no hover e o selo fica logo abaixo desse ícone | O texto permanece ao lado do card. O selo saiu da linha da variação.
- 2026-11-15 | 09-ajustes-avaliacao | O selo do KPI fica fora do fluxo, abaixo do "?", para o valor seguir a descrição | O selo na coluna do título empurrava o número para a linha seguinte.
- 2026-11-15 | 09-ajustes-avaliacao | O hover do "?" do KPI só vale em cima do ícone e o valor cola na descrição | O painel seguia aberto no restante do card. O botão no fluxo afastava o número.
- 2026-11-15 | 09-ajustes-avaliacao | Crítico, Atenção e Favorável em "O que fazer" usam a cor do selo da KPI | O rótulo estava no cinza do texto secundário.
- 2026-11-15 | 09-ajustes-avaliacao | A trilha da rolagem de Contexto usa o fundo do card da KPI | A trilha global usa o fundo da página, mais escuro que o card.
- 2026-11-15 | 09-ajustes-avaliacao | As KPIs da tábua mostram a variação absoluta em 10 anos | A página só lia o ano selecionado, então não havia base para o aumento ou a redução.
- 2026-11-15 | 09-ajustes-avaliacao | No topo de Insights, cada pergunta fica numa linha com o nome da página e as seções viram chips | Os dois blocos eram links sublinhados seguidos, sem separação visual.
- 2026-11-15 | 09-ajustes-avaliacao | A sidebar retrai para ícones e troca a marca por "A"; a escolha fica salva | O menu largo ocupa a área dos gráficos. No celular o menu continua com os nomes.
- 2026-11-15 | 09-ajustes-avaliacao | O "A" retraído usa o traço dos ícones e a largura anima em 280 ms com animações ligadas | A letra preenchida lia mais clara que os ícones. Com movimento reduzido a troca continua imediata.
- 2026-11-15 | 09-ajustes-avaliacao | A marca da sidebar é a imagem preta no tema claro e a branca no escuro; o ícone não se desloca ao retrair | O texto "IBGE Analytics" e o "A" saíram. A largura passa a 520 ms e os ícones ficam no mesmo eixo.
- 2026-11-15 | 09-ajustes-avaliacao | Fluxos de nascimento e óbito aceitam até 10 pessoas ou 0,001%; diferença 0 continua "ok" e o pó de ponto flutuante nas proporções também | Quatro regras de fluxo com 1 pessoa, antes contadas como aprovadas pela tolerância de 1, passam a "ok com arredondamento". O total aprovado fica 113 de 113 (99 exatas e 14 com arredondamento).
- 2026-11-15 | 09-ajustes-avaliacao | A base suja some em produção porque a limpeza guardava só o arquivo mais novo de cada dataset e `AUTO_SEED=false` não recria a fonte | O relatório passa a cair no MySQL quando o disco não tem a fonte, e a retenção guarda a execução mais recente de cada dataset e de cada fonte.
- 2026-11-15 | 09-ajustes-avaliacao | O Databricks externo usa o token de embed do Lakeview; sem credencial o padrão é `preview` | A documentação atual não entrega o dashboard a visitante anônimo sem um service principal. A página deixa de mostrar o iframe de login.
- 2026-11-15 | 09-ajustes-avaliacao | O título do painel volta a "Projeções IBGE" | "Analytics" tirava a referência ao IBGE.
- 2026-11-15 | 09-ajustes-avaliacao | A busca "Buscar página ou território" permanece | Pedido de 15/11: não alterar nem remover nada da interface. A decisão de 13/11 que trocou a trilha por busca fica confirmada.
- 2026-11-15 | 09-ajustes-avaliacao | A lista de territórios fica em memória depois da primeira consulta | Sem o MySQL, cada `/context` esperava o tempo de conexão e passava de 2 s.
- 2026-11-15 | 09-ajustes-avaliacao | Endereço inexistente, dataset fora do catálogo e falha de rota usam a mesma página de erro dentro do painel | O aviso compacto e a tela padrão do React Router saíam do visual e não ofereciam volta nem nova tentativa.
- 2026-11-15 | 09-ajustes-avaliacao | `/databricks` mostra só a tabela da população por idade | Galeria, login e iframe saíram. A página passa a ler a mesma base tratada da ds1.
- 2026-11-15 | 09-ajustes-avaliacao | `/databricks` volta a ser só o iframe do painel publicado | A tabela saiu. O iframe ocupa a área de conteúdo e usa a URL de embed do mesmo dashboard.

## 10-rubrica-entrega

- 2026-11-16 | 10-rubrica-entrega | Power BI fora do escopo; Databricks é o painel da rubrica; silver permanece em `data/processed/` | O item Power BI foi substituído pelo Lakeview. Não há `.pbix` nem DAX, e o Parquet silver não muda de pasta.
- 2026-11-16 | 10-rubrica-entrega | O log usa a chave da pasta em `specs/`, da etapa 1 à etapa 10 | Os rótulos antigos (etapa 11–16, geral, interface, railway) não batiam com as dez pastas.
- 2026-11-16 | 10-rubrica-entrega | A marca retraída passa a ser o símbolo geométrico (preto no claro, branco no escuro); o resumo fica acima dos filtros; a área de visualização ganha fade no topo e na base quando há rolagem | Pedido de 16/11. O fade some no extremo da rolagem para não apagar título nem o fim da página.
- 2026-11-16 | 10-rubrica-entrega | A marca retraída fica com a mesma altura da wordmark (`h-4`) e conserva a proporção do símbolo | Pedido de 16/11. A largura acompanha a imagem, sem caixa quadrada.
- 2026-11-16 | 10-rubrica-entrega | O fade da área de conteúdo fica em 1,5 rem e começa em 35% de opacidade; no celular o menu desliza da esquerda em 420 ms | Pedido de 16/11. Com animações desligadas ou `prefers-reduced-motion`, o drawer abre e fecha sem transição.

## 11-finalizacao-rubrica

- 2026-11-16 | 11-finalizacao-rubrica | A silver fica em `data/silver`; a base suja não entra nas fatos; a carga troca as linhas com DELETE e INSERT e confere o golden antes do commit | A etapa 11 prevalece sobre a 10. O atalho de mesma contagem deixava a base suja na ouro.
- 2026-11-16 | 11-finalizacao-rubrica | O painel `/databricks` usa `@databricks/aibi-client`; o token fica em `secrets/databricks.token`, ignorado pelo git, e a API o entrega ao cliente | O snippet pede o token emitido pelo servidor. O valor não entra no bundle nem no repositório.
- 2026-11-16 | 11-finalizacao-rubrica | O embed externo emite um token reduzido a cada request; `external_viewer_id` é opaco e `external_value` fica `publico` | O dashboard já publica com a identidade do publicador. Não há login na app, então o valor de filtro não carrega dado pessoal e o token amplo do service principal não vai ao browser.
- 2026-11-16 | 11-finalizacao-rubrica | O passo 2 só segue se o passo 1 devolver 200 e um `access_token` JWT; segredo e JSON bruto não entram no Bearer | O 401 do tokeninfo aparece quando o Bearer está ausente ou não é o access_token.
- 2026-11-16 | 11-finalizacao-rubrica | O embed para no passo 3 com `invalid_authorization_details`; a correção fica no workspace, não no código | O SP Access só tem `CAN_READ`. O tokeninfo exige workspace access, SQL access e `dashboard.runner`.
- 2026-11-16 | 11-finalizacao-rubrica | O passo 3 repete o mesmo `external_viewer_id` e `external_value` do passo 2; a página usa só o `access_token` desse passo no `@databricks/aibi-client` | O token amplo do passo 1 não vai ao browser. O reduzido expira em 1 h e nasce de novo a cada carregamento. Não há iframe `dashboardsv3`.
- 2026-11-16 | 11-finalizacao-rubrica | `/databricks` volta ao iframe `dashboardsv3`; o cliente `@databricks/aibi-client` e o token dos passos 1–3 saem da página | Pedido de desfazer o embed pelo cliente. O painel publicado entra de novo pela URL de embed.
- 2026-11-16 | 11-finalizacao-rubrica | `/databricks` volta ao `@databricks/aibi-client` com o access_token do passo 3, válido por 1 h e emitido a cada carregamento | O iframe `dashboardsv3` pedia login. Os passos 2 e 3 usam o mesmo `external_viewer_id` e `external_value`.
- 2026-11-17 | 11-finalizacao-rubrica | O embed usa o UUID do SP `clevo-embed-ibge`, `external_viewer_id=clevo-public-viewer`, `external_value=clevo-public` e o segredo só em `SERVICE_PRINCIPAL_SECRET` | O client id numérico não devolve `access_token`. O par externo é fixo e sem dado pessoal. O token do passo 3 nasce a cada carregamento.
- 2026-11-17 | 11-finalizacao-rubrica | `dump_ddl` compila com `server_version_info` 8.4, então `started_at` sai como `DEFAULT (now())` | Sem versão, o SQLAlchemy omite os parênteses e o DDL diverge do MySQL 8.4 do CI.
