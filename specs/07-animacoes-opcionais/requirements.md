# Spec 14: Requisitos (Animações opcionais)

Prevalece sobre as specs anteriores. Hoje a aplicação não tem animações (regra vigente); esta spec cria uma **camada de movimento opcional**, desligada por padrão, que pode ser removida sem afetar o restante.

## Princípios de segurança (obrigatórios)
Lições das versões anteriores: a animação de desenho customizada fez linhas sumirem; staggers e `layoutId` causaram saltos de layout; componentes com estado inicial oculto ficaram invisíveis.
- P1. **Conteúdo visível por padrão**: o HTML/CSS base renderiza o estado final. O estado inicial oculto só é aplicado por JavaScript, e só com animações ligadas.
- P2. **Camada isolada**: componentes de dados e de layout não mudam a lógica; a animação entra por wrappers, hooks e atributos `data-anim`. Desligada, a camada não executa nada (nem `requestAnimationFrame`, nem `IntersectionObserver`).
- P3. **Só `opacity`, `transform`, `clip-path` e `stroke-dashoffset` nativo do Recharts**. Nunca animar `width`, `height`, `top`/`left` ou `display`, nem manipular `stroke-dasharray` por `ref`.
- P4. **Sem dependências novas**: CSS (`@keyframes`), Web Animations API, as animações nativas do Recharts e dois hooks próprios (count-up e palavra a palavra). Nada de Framer Motion.
- P5. **Falha segura**: erro dentro de um componente de animação → `ErrorBoundary` renderiza a versão estática. Sem suporte a `IntersectionObserver` → tudo visível sem animação. Ao imprimir (`@media print`) → tudo visível.
- P6. **Interruptor de emergência**: `VITE_MOTION_ENABLED=false` desativa a camada inteira e esconde a opção nas Configurações.
- P7. **Estado final idêntico**: com animações ligadas, depois que tudo termina, a tela é idêntica (pixel a pixel) à versão com animações desligadas.

## R1. Opção nas Configurações
- R1.1 Em Configurações › **Acessibilidade**: interruptor **"Animações"** com a descrição "Números contam, gráficos se desenham e o conteúdo aparece ao rolar a página".
- R1.2 Padrão: **desligado**. Se o sistema tiver `prefers-reduced-motion: reduce`, o interruptor mostra a nota "Seu sistema pede menos movimento", mas o usuário pode ligar mesmo assim.
- R1.3 A escolha é persistida (store com `persist`, leitura e escrita em try/catch) e aplicada antes do primeiro render como `data-motion="on|off"` no `<html>` (script anti-flash).
- R1.4 A troca vale imediatamente: ao desligar, qualquer animação em curso salta para o estado final.

## R2. Sincronização
- R2.1 **Entrada da página**: todos os elementos animados visíveis na primeira dobra começam **no mesmo instante** e têm a **mesma duração** (`--motion-page`, 800 ms, curva `ease-out`). O instante de início é quando os dados essenciais da página estão prontos (ou após 1.200 ms, o que vier primeiro). Elementos cujos dados chegam depois desse instante aparecem já no estado final.
- R2.2 **Rolagem**: elementos abaixo da dobra aparecem com **fade-in** (opacidade 0 → 1 e deslocamento de 8 px para cima) ao entrar na tela. Os que entram juntos no mesmo quadro formam um grupo e animam juntos, com a mesma duração (`--motion-reveal`, 500 ms), e as animações internas deles (números, gráficos) começam junto com o fade.
- R2.3 Cada elemento revelado anima **uma vez por visita à página**. Voltar a rolar para cima não repete.
- R2.4 **Mudança de filtro** (território, ano, sexo, drill): uma transição única para todos os elementos afetados (`--motion-update`, 400 ms). Os números vão do valor anterior ao novo (R3.4).
- R2.5 Sem stagger entre componentes. Coreografia interna de um gráfico é permitida, desde que comece e termine dentro da janela do grupo.

## R3. Contagem dos números
- R3.1 Animam: valores numéricos dos **KPIs**, da **manchete** e do card **Contexto**. Não animam: tabelas, eixos, tooltips, Fatos, Insights e anos.
- R3.2 **Inteiros**: contam de **0** até o valor (ex.: 0 → 214.211.951), sempre exibindo inteiros durante a contagem.
- R3.3 **Decimais**: contam de **0,1** até o valor, com o número de casas decimais do valor final durante toda a contagem (ex.: 0,10 → 77,03; 0,1% → 19,2%). Regras de borda:
  - valores negativos começam em −0,1 (decimais) ou 0 (inteiros);
  - valores com módulo menor que 0,1 não animam;
  - valores não numéricos ("40–44", "DF", "2041") não animam.
- R3.4 Na **primeira exibição**, a contagem parte de 0 ou 0,1. Em **atualizações** (R2.4), parte do valor anterior, para não reiniciar a cada filtro.
- R3.5 Duração = a do grupo (R2.1/R2.2), curva easeOutExpo. Cada quadro passa por `formatValue` (no modo Simples, a contagem já sai compacta: "0 → 214 mi").
- R3.6 Largura reservada (`tabular-nums` + `min-width` calculada com o valor final) para o layout não se mexer. Leitores de tela recebem só o valor final (`aria-live="polite"`; o texto animado fica `aria-hidden`).

## R4. Gráficos (animações criativas, todas dentro da janela do grupo)
| Gráfico | Animação |
|---|---|
| População 2000–2070 | Linha se desenha da esquerda para a direita (animação nativa do Recharts); o marcador do pico surge com escala 0 → 1 nos últimos 20% da janela; o rótulo "Projeção →" aparece com fade no fim |
| Pirâmide (idade e quinquenal) | Barras crescem **do eixo central para fora** (homens para a esquerda, mulheres para a direita), todas juntas |
| Mapa de calor idade × ano | **Varredura do tempo**: `clip-path` revela a matriz da esquerda (2000) para a direita (2070); a linha do ano atual surge quando a varredura passa por ela |
| Composição 100% | Varredura da esquerda para a direita (mesma técnica do mapa de calor) |
| 0–14 e 60+ | Linhas se desenham; o "X" do cruzamento aparece com escala no fim |
| Esperança de vida H × M, TFT, Natalidade × mortalidade, Bônus | Linhas se desenham; linhas de referência (reposição 2,1, ano atual) e áreas aparecem com fade no fim |
| Rankings e barras divergentes | Barras crescem a partir de zero (nativo do Recharts) |
| Mapa por UF | Cada UF passa do tom neutro à sua cor de classe (transição de `fill`) com leve escala 0,98 → 1 do mapa inteiro |
| Slope | Linhas se desenham de 2000 para o ano selecionado |
| Dispersão | Bolhas crescem de raio 0 (nativo do Recharts) |
| Tábuas (sobrevivência, risco, vida restante) | Linhas se desenham ao longo do eixo de idade |
- R4.1 Usar, sempre que existir, a animação **nativa do Recharts** (`isAnimationActive`, `animationBegin` = atraso até o início do grupo, `animationDuration` = duração do grupo, `animationEasing="ease-out"`). Animações próprias só em SVG/canvas próprios (pirâmide, mapa, mapa de calor), com CSS/WAAPI.
- R4.2 Desligado → `isAnimationActive={false}` em todos os gráficos.
- R4.3 Mudança de filtro: o Recharts anima entre os valores (comportamento nativo) dentro de `--motion-update`.

## R5. O que anima e o que não anima
- R5.1 **Animam**: o conteúdo principal na entrada (fade de 0 → 1 dos cards da primeira dobra), números (R3), gráficos (R4), cards abaixo da dobra (R2.2), selo de status dos KPIs (fade no fim da janela), faixa "O que fazer" (fade) e textos do modo Simples (R6).
- R5.2 **Não animam**: sidebar, cabeçalho, filtros, botões, menus, popovers, dialogs, tooltips, accordion dos Insights, tabelas, troca de tema, troca de página na navegação e foco.
- R5.3 Hover e foco continuam instantâneos.

## R6. Modo Simples com animações: texto palavra por palavra
- R6.1 Com o modo Simples **e** as animações ligadas, os **textos do conteúdo** aparecem **palavra por palavra, uma a cada 100 ms**: manchete, parágrafos do bloco "Entenda os dados", fatos em destaque e frases de notícias do bloco. Títulos, rótulos de KPI, menus, botões e filtros não usam o efeito.
- R6.2 Os parágrafos visíveis na primeira dobra começam juntos (no início da página); os de baixo começam quando entram na tela.
- R6.3 Técnica sem salto de layout: o texto completo é renderizado desde o início, com cada palavra em um `span` de opacidade 0 que passa para 1 na sua vez (o espaço já está ocupado).
- R6.4 Clicar em um parágrafo, ou pressionar `Esc`, conclui a exibição na hora. Um botão "Mostrar tudo" no topo do bloco conclui todos os parágrafos.
- R6.5 Leitores de tela recebem o parágrafo inteiro de uma vez (texto acessível fora da animação).
- R6.6 Mudança de território ou ano: os textos que mudarem recomeçam o efeito; os iguais permanecem completos.
- R6.7 Números dentro dos textos aparecem como palavras (sem contagem), para não haver dois efeitos no mesmo trecho.

## R7. Verificação
- R7.1 Testes unitários:
  - `countUpStart(value)`: inteiro → 0; decimal → 0,1 com as casas do valor; negativo; módulo < 0,1; texto;
  - `useCountUp` desligado retorna o valor final no primeiro render;
  - divisão em palavras e intervalo de 100 ms (relógio falso).
- R7.2 E2E, em todas as páginas de dados:
  - **desligado**: `document.getAnimations().length === 0` e nenhum `IntersectionObserver` registrado (contador instrumentado em modo de teste);
  - **ligado**: as animações de entrada da primeira dobra têm o mesmo `startTime` (±16 ms) e a mesma duração;
  - após rolar até o fim, nenhum `[data-anim]` fica com opacidade < 1;
  - **estado final idêntico**: screenshot com animações ligadas (após 3 s e rolagem completa) comparado ao desligado, com diferença ≤ 0,1% dos pixels;
  - CLS (layout shift) < 0,01;
  - zero erros no console;
  - modo Simples: palavras aparecem a cada 100 ms (±20 ms), e "Mostrar tudo" conclui.
- R7.3 Teste do interruptor de emergência (`VITE_MOTION_ENABLED=false`): a opção não aparece e nada anima.
