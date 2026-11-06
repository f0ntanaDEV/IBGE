# Etapa 2: Requisitos (Design system e base do frontend)

## R1. Identidade visual
- R1.1 A paleta DEVE ser neutra (zinc/slate) com um único acento dessaturado. Cores vibrantes, gradientes e sombras pesadas são proibidos.
- R1.2 Os gráficos DEVEM usar de 5 a 6 tons dessaturados, legíveis nos dois temas e distinguíveis por pessoas daltônicas.
- R1.3 A tipografia DEVE ser Inter ou Geist, com números em `tabular-nums` e espaçamento em múltiplos de 4 px.
- R1.4 Todos os tokens DEVEM ser variáveis CSS (padrão shadcn), definidas em `:root` e `.dark`.

## R2. Layout e navegação
- R2.1 Sidebar colapsável com: Visão Geral, os 5 datasets, Qualidade de Dados, Notícias IBGE e Configurações.
- R2.2 Header com breadcrumb, command palette (⌘K / Ctrl+K), seletor de tema e botão do Modo leve.
- R2.3 QUANDO a largura for < 768 px, ENTÃO a sidebar DEVE virar um drawer (Sheet) e os grids DEVEM reorganizar-se em 4 → 2 → 1 colunas.

## R3. Tema
- R3.1 Opções Claro, Escuro e Sistema, persistidas.
- R3.2 O tema DEVE ser aplicado antes do primeiro render, sem flash de tema errado.
- R3.3 Gráficos, tooltips e skeletons DEVEM ficar corretos nos dois temas.

## R4. Modo leve
- R4.1 Um botão no header DEVE alternar o Modo leve, com estado persistido.
- R4.2 QUANDO ativo, ENTÃO o sistema DEVE zerar transições e animações CSS, desligar animações do Framer Motion e do Recharts, e remover `backdrop-filter`/blur.
- R4.3 QUANDO o sistema operacional tiver `prefers-reduced-motion: reduce` e o usuário nunca tiver escolhido, ENTÃO o Modo leve DEVE iniciar ativo.

## R5. UX e acessibilidade
- R5.1 Contraste WCAG AA, foco visível, navegação por teclado e `aria-label` em botões de ícone.
- R5.2 Todo carregamento usa Skeleton; estados vazio e de erro têm uma ação clara ("Tentar novamente").
- R5.3 Feedback de ações via toast discreto.

## R6. Base técnica
- R6.1 Cliente de API tipado, gerado do OpenAPI, em `packages/shared`.
- R6.2 O rodapé exibe o status de `/health`.
- R6.3 A página Configurações reúne tema, Modo leve e densidade (confortável/compacta).
