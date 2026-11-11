# Spec 14: Tarefas

Execute uma por vez, marque `[x]` e continue. Depois de **cada** tarefa, rode o teste de estado final (T14.2) com animações ligadas e desligadas. Se ele falhar, corrija antes de seguir.

- [x] **T14.1** `motion/` (tokens, CSS condicional, `MotionProvider`, flag de emergência, `MotionBoundary`) + opção nas Configurações + anti-flash. Nenhum componente animado ainda. → R1, P1–P6
- [x] **T14.2** Testes de segurança antes de animar qualquer coisa: estado final idêntico (screenshot ligado × desligado), `getAnimations()` vazio quando desligado, CLS, console limpo, interruptor de emergência. → P7, R7.2, R7.3
- [x] **T14.3** Relógio da página, `usePageReady`, grupos de entrada e de atualização, `Reveal` com grupos por quadro. Aplicar a entrada nos cards da primeira dobra e o fade-in ao rolar nos cards de baixo. → R2, R5.1
- [x] **T14.4** `countUpStart`, `useCountUp`, `CountUp` em KPIs, manchete e Contexto. Testes unitários. → R3
- [x] **T14.5** `chartMotion` em todas as séries Recharts + marcadores e referências no fim da janela. Validar o tracejado da série projetada. → R4, R4.1–R4.3
- [x] **T14.6** Animações próprias: pirâmide, mapa de calor, Composição 100% e mapa por UF. → R4
- [x] **T14.7** Selo de status e faixa "O que fazer" com fade no fim da janela. → R5.1
- [x] **T14.8** `WordReveal` no modo Simples + "Mostrar tudo", `Esc`, clique e reinício por hash. Testes. → R6
- [x] **T14.9** E2E completo do R7.2 em todas as páginas, nos dois modos e nos dois temas; suítes verdes. Registrar em `DECISIONS.md` qualquer animação que tenha sido desligada por instabilidade. → R7
