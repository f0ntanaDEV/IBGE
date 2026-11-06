# Etapa 6: Requisitos (Animações personalizadas)

Princípio: animação deve **explicar** (mostrar de onde o dado vem, o que mudou, para onde olhar), nunca decorar. Tudo é sutil, rápido e coerente com o visual sóbrio.

## R1. Regras gerais
- R1.1 Com o **Modo leve** ativo (ou `prefers-reduced-motion` sem escolha do usuário), TODAS as animações desta etapa ficam desligadas e os elementos aparecem direto no estado final. Sem exceções.
- R1.2 Animar apenas `transform` e `opacity` (e `stroke-dashoffset` em SVG). Nunca animar `width`, `height`, `top`, `left` ou `box-shadow`.
- R1.3 As durações e curvas DEVEM vir de tokens centrais (ver design); valores avulsos nos componentes são proibidos.
- R1.4 Animações de entrada rodam **uma vez por sessão por elemento** (ex.: o gráfico não "redesenha" do zero toda vez que a página é revisitada); mudanças de dados animam do estado anterior para o novo.
- R1.5 Nenhuma animação pode bloquear interação: o usuário clica, rola e filtra durante a animação.
- R1.6 Manter 60 fps em notebook comum: staggers limitados a 400 ms no total, e listas com mais de 30 itens não fazem stagger.

## R2. Sidebar suave
- R2.1 Recolher/expandir com **spring** (sem "estalo"): a largura muda por `transform` em um wrapper com `layout` do Framer Motion, e o conteúdo principal acompanha sem salto.
- R2.2 Os rótulos dos itens saem com fade + deslize de 4 px antes de a sidebar encolher e entram com stagger de 20 ms depois que ela expande.
- R2.3 O **indicador do item ativo** é uma "pílula" de fundo que desliza entre os itens ao navegar (`layoutId`), em vez de piscar.
- R2.4 Com a sidebar recolhida, o hover nos ícones mostra um tooltip que entra com escala 0,96 → 1.
- R2.5 No mobile, o drawer segue o dedo (arrastar para fechar, com velocidade e limiar), e o fundo escurece proporcionalmente ao arraste.
- R2.6 O ícone de recolher faz um morph (seta ↔ seta espelhada) com rotação.

## R3. Números animados (count-up)
- R3.1 KPIs e números de destaque animam **de 0 até o valor final** na primeira exibição, quando entram na viewport.
- R3.2 Quando o valor muda (filtro, ano, seleção cruzada), a animação vai **do valor anterior ao novo**, não do zero.
- R3.3 Curva easeOutExpo com duração proporcional à magnitude da mudança (400–1.200 ms).
- R3.4 Cada quadro é formatado por `formatValue` (Etapa 4): no modo simplificado, o número sobe já compactado ("0 → 214 mi") e nunca exibe o valor exato no caminho.
- R3.5 Usar `tabular-nums` e largura mínima reservada para o texto não "tremer" nem empurrar o layout.
- R3.6 Leitores de tela recebem apenas o valor final (`aria-live="polite"` atualizado ao término; o texto animado fica com `aria-hidden`).
- R3.7 O indicador de variação (↑ ↓) entra **depois** que o número termina, deslizando 4 px na direção da variação.

## R4. Animações personalizadas (assinatura visual da aplicação)
- R4.1 **Pirâmide que cresce do eixo**: as barras nascem do centro para fora com stagger de baixo para cima (das idades jovens para as idosas). Ao trocar o ano, elas fazem **morph** entre os valores, e o botão "▶ Reproduzir" mostra o envelhecimento do Brasil de 2000 a 2070 em cerca de 10 s, com o ano grande e esmaecido ao fundo.
- R4.2 **Linhas que se desenham**: as séries são traçadas da esquerda para a direita (`stroke-dashoffset`). O trecho projetado (tracejado) começa a ser desenhado só depois do observado, com uma pequena pausa no "hoje".
- R4.3 **Marcos que pousam**: o marcador do pico (2041) desce 8 px com fade e emite **um único pulso** de anel. O cruzamento idosos × jovens é revelado por um "X" que se forma no ponto de encontro.
- R4.4 **Mapa em onda**: na primeira exibição, as UFs se preenchem em onda de norte a sul (stagger pela latitude do centroide). Ao trocar de indicador, as cores fazem crossfade.
- R4.5 **Dispersão viva**: no `AnimatedScatter`, as bolhas se movem suavemente entre os anos, deixando um rastro opcional ("mostrar trajetória") para a UF selecionada.
- R4.6 **Filtro cruzado com foco**: ao selecionar, os elementos não selecionados esmaecem com 150 ms de atraso em relação ao destaque do selecionado (o olho vai primeiro para o que importa). Os chips entram com `layout` e saem encolhendo.
- R4.7 **Expandir com elemento compartilhado**: o gráfico "cresce" do card até o modo ampliado (`layoutId`) em vez de aparecer em um dialog genérico, e ao fechar volta ao card de origem.
- R4.8 **Troca de tema com revelação circular**: com a View Transitions API, o novo tema se expande em círculo a partir do botão clicado. Sem suporte, faz crossfade de 200 ms.
- R4.9 **Smart Narratives**: as frases de "Observações finais" entram uma a uma (fade + 4 px) quando o card chega à viewport, e os números destacados dentro delas usam o count-up.
- R4.10 **Skeleton → conteúdo**: o shimmer é sutil (opacidade 0,04–0,08) e o conteúdo real substitui o skeleton com crossfade, sem "pulo" de layout (mesmas dimensões).
- R4.11 **Transição entre páginas**: fade + deslize de 8 px. Os KPIs da Visão Geral que também existem no dashboard de destino usam `layoutId` e "viajam" para a nova posição.
- R4.12 **Alternar visão (Completa ↔ Simplificada)**: os elementos que somem colapsam com fade, os que ficam se reposicionam com `layout`, e os números fazem morph do formato exato para o compacto.
- R4.13 **Microinterações**: botões com escala 0,98 no clique; o ícone do Modo leve faz morph (onda → linha reta) ao ativar; o toggle de tema gira o sol/lua 90°.

## R5. Qualidade
- R5.1 Um teste garante que, com `data-reduced-motion="true"`, `useCountUp` retorna o valor final no primeiro render e nenhum componente da Etapa 6 agenda `requestAnimationFrame`.
- R5.2 Perfil de desempenho (Chrome DevTools) da Visão Geral e do dashboard ds4 sem tarefas longas (> 50 ms) causadas por animação. O resultado vai para `DECISIONS.md`.
- R5.3 Uma página interna `/dev/motion` (somente em desenvolvimento) lista todas as animações com controles de repetir e de velocidade 0,25×, para revisão visual.
