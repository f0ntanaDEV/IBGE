# Etapa 9: Design

## 1. Remoção das animações
Ordem:
1. Buscar os usos:
   ```bash
   rg -n "framer-motion|AnimatePresence|layoutId|motion\.|MotionConfig|useCountUp|AnimatedNumber|usePageAnimation|PageMotion|useMotionEnabled|useSeenOnce|startViewTransition|__motionLog" apps/web/src
   rg -n "animate-|transition|duration-|ease-|animationDuration|isAnimationActive|scroll-smooth|@keyframes" apps/web/src apps/web/tailwind.config.*
   ```
2. Substituir `motion.X` por `X`, remover `AnimatePresence` (renderização condicional direta) e `layoutId`.
3. `AnimatedNumber` → `<span className="tabular-nums">{formatValue(v, m)}</span>`.
4. Recharts: um wrapper `chartDefaults` com `isAnimationActive={false}` aplicado a **toda** série (`Line`, `Bar`, `Area`, `Scatter`, `Pie`) e `Tooltip` com `animationDuration={0}`.
5. shadcn (`components/ui/*`): remover as classes `data-[state=open]:animate-in`, `fade-in-*`, `zoom-in-*`, `slide-in-*`, `animate-out`, `transition-*` e o `animate-pulse` do Skeleton.
6. Remover `tailwindcss-animate` do `tailwind.config` e do `package.json`; remover `framer-motion`.
7. Adicionar a rede de segurança em `globals.css` (R1.7).
8. Remover o Modo leve (botão, Configurações, store, atributo, CSS de `data-reduced-motion`) e a rota `/dev/motion`.

## 2. Mapa de calor: layout
```
┌ card ───────────────────────────────────────────────┐
│ Idade por ano                              [⤓]      │
│ Densidade da população por idade, 2000–2070          │
│      ┌ margem sup. 16 ───────────── "2026" ┐         │
│ I 80 │                              │       │         │
│ d 60 │        matriz canvas         │       │         │
│ a 40 │      (71 anos × 90 idades)   │       │         │
│ d 20 │                              │       │         │
│ e  0 │______________________________│_______│         │
│      2000  2010 … 2060           2070               │
│      Pessoas por idade  ▕▔▔▔▔gradiente▔▔▔▔▏         │
│      80 mil          1,8 mi            3,6 mi        │
│ Idades de 0 a 89 anos. O grupo 90 ou mais não é…     │
└──────────────────────────────────────────────────────┘
```
- Estrutura: `div.relative` com `canvas` posicionado na área de plotagem (`left: 44px; top: 16px; right: 16px; bottom: 28px`) e um `svg` do tamanho total para eixos, rótulos e linha do "hoje".
- Escalas: `x = scaleLinear([2000, 2070], [0, plotW])`, `y = scaleLinear([0, 89], [plotH, 0])` com `scaleBand` para as células.
- Cor: `interpolateRgbBasis([seq1 … seq5])` lido das variáveis CSS do tema ativo, com a ordem invertida conforme o tema (R2.8). Redesenhar ao trocar o tema.
- Legenda: componente `GradientLegend({ min, max, ticks: 3, title })` com a mesma largura da área de plotagem.
- Hover: `onMouseMove` no canvas → `ano = round(x⁻¹)`, `idade = floor(y⁻¹)` → tooltip HTML com `pointer-events: none`, limitado ao card.

## 3. KPI card
```tsx
<Card className="flex h-full min-h-[7rem] flex-col gap-1 p-4">
  <div className="flex items-start justify-between gap-2">
    <span className="truncate text-sm text-muted-foreground">{label}</span>
    <GlossaryButton />
  </div>
  <div className="flex items-baseline gap-1.5 min-w-0">
    <span className="text-2xl font-semibold tabular-nums">{formatValue(value, metric)}</span>
    {unit && <span className="truncate text-sm text-muted-foreground">{unit}</span>}
  </div>
  <KpiDelta value={delta} period="em 10 anos" />   {/* "↑ 5,1% em 10 anos" */}
</Card>
```
- `KpiRow`: `grid items-stretch` (altura uniforme pelo maior card).
- Unidades em `glossary.ts` (`unidadeKpi`): `e0`/`e60` → "anos"; `tft` → "filho(s) por mulher" (singular se < 2); `ie60` → "por 100 jovens"; `tmi` → "por mil"; população → sem unidade. "taxa", "número", "grupo", "pessoas" e "razão" são removidas.
- Teste de contenção (Playwright):
  ```ts
  for (const card of await page.locator('[data-card]').all()) {
    const box = await card.boundingBox();
    const out = await card.evaluate((el, b) => [...el.querySelectorAll('*')].filter(n => {
      const r = n.getBoundingClientRect();
      return r.width && (r.left < b.x - 1 || r.right > b.x + b.width + 1 || r.top < b.y - 1 || r.bottom > b.y + b.height + 1);
    }).length, box);
    expect(out).toBe(0);
  }
  ```
  (Excluir elementos dentro de containers com `overflow: auto` legítimo, verificando o pai rolável em vez do card.)

## 4. Sidebar fixa
- Remover `collapsed`, o toggle e o `CollapsedNavItem`; manter apenas o markup expandido.
- `aside`: `hidden md:flex w-60 shrink-0 flex-col border-r`. Mobile: o botão de menu no header abre o `Sheet` (sem animação, via a remoção de classes do §1).

## 5. Card "Contexto"
```tsx
<ChartCard title="Contexto" className="h-[--card-h-chart]">
  <div className="flex h-full flex-col overflow-y-auto">
    {hasCenso && <CensoSection />}       {/* Projeção · Recenseada · Diferença · nota */}
    {hasCenso && <Separator className="my-3" />}
    <FatosSection max={2} />
  </div>
</ChartCard>
```
- Os componentes `CensoCard` e `FatosCard` antigos são removidos dos `DashboardSpec`; cada spec referencia apenas `{ kind: 'context', span: 4 }`.
- `packRows` (Etapa 8) passa a validar que nenhuma linha termina com um único item de span 4.

## 6. Integração do Censo
- `integrations/ibge_agregados.py`: `get_censo_2022(cod)` → consulta os metadados; se a tabela/variável confirmar, consulta os valores, normaliza para `{cod: populacao}` e grava em `data/cache/censo2022.json`.
- O endpoint `/reference/censo-2022` lê primeiro o cache de disco; a API só é chamada se o cache não existir.
- Teste com a resposta da API mockada + teste golden do Brasil.

## 7. Esperança de vida
- `niceDomain` com passo 10 → `[60, 90]`; `tickFormatter` inteiro.
- `margin={{ right: 72 }}` para os rótulos diretos.
- `Tooltip` com `cursor` padrão e sem `active` forçado; `onMouseLeave` limpa o hover sincronizado.
- `ReferenceArea x1={2020} x2={2021}` sem preenchimento, apenas com o rótulo "Covid-19" no topo (`--muted-foreground`, 11 px).
