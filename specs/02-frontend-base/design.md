# Etapa 2: Design

## Stack
React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · TanStack Table · React Router · Zustand (persist) · Recharts (via chart do shadcn) · Framer Motion · lucide-react · sonner · openapi-typescript + openapi-fetch · Vitest + Testing Library

## Estrutura
```
apps/web/src/
├── app/         providers.tsx, router.tsx, layout/ (AppShell, Sidebar, Header, Footer)
├── features/    datasets/, news/, quality/, settings/      # cada um: api.ts, hooks.ts, components/, page.tsx
├── components/
│   ├── ui/      # shadcn
│   └── common/  KpiCard, ChartCard, DataTable, EmptyState, ErrorState, NewsCard, QualityBadge, PageHeader
├── hooks/       useReducedMotion.ts, useChartTheme.ts
├── lib/         api.ts, format.ts (pt-BR), cn.ts
├── stores/      preferences.ts   # theme, reducedMotion, density
└── styles/      globals.css
packages/shared/ api-types.ts (gerado), client.ts
```

## Tokens (globals.css)
- Base: `--background`, `--foreground`, `--muted`, `--border`, `--card`, `--primary` (acento, ex. `215 20% 45%` no claro e `215 20% 65%` no escuro).
- Gráficos: `--chart-1..6`, com saturação ≤ 30% e luminosidade ajustada por tema.
- Raio `--radius: 0.5rem`; sombra apenas `shadow-sm` em overlays.

## Tema
- Classe `.dark` no `<html>`, com script inline no `index.html` que lê o localStorage (try/catch) e `matchMedia` antes do bundle.
- Store: `theme: 'light'|'dark'|'system'`.

## Modo leve
1. A store define `reducedMotion: boolean | null` (`null` = segue o sistema).
2. Um efeito aplica `document.documentElement.dataset.reducedMotion`.
3. CSS global:
```css
html[data-reduced-motion="true"] *, html[data-reduced-motion="true"] *::before, html[data-reduced-motion="true"] *::after {
  animation-duration: 0s !important; animation-iteration-count: 1 !important;
  transition-duration: 0s !important; scroll-behavior: auto !important;
}
html[data-reduced-motion="true"] [class*="backdrop-blur"] { backdrop-filter: none !important; }
```
4. `<MotionConfig reducedMotion={rm ? "always" : "user"}>` no provider.
5. `useReducedMotion()` alimenta `isAnimationActive` de todos os gráficos.

## Componentes base (contratos)
- `KpiCard({label, value, format, delta?, hint?, loading?})`
- `ChartCard({title, description?, actions?, loading?, error?, children})`
- `DataTable({columns, queryKey, fetcher})`: paginação, ordenação e busca server-side
- `NewsCard({title, summary, date, url, image?, relatedMetric?})`
- `QualityBadge({status: 'consistent'|'minor'|'relevant'})`: cor neutra + ícone + texto, nunca só cor

## Responsividade
Breakpoints testados: 375, 768, 1280 e 1920 px. Tabelas com scroll horizontal e colunas de baixa prioridade ocultas em telas pequenas.
