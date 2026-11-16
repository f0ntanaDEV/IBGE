# Etapa 10: Desenho

Sem endpoint, tela ou tabela nova além do FK.

- README absorve `PROMPTS.md`; o arquivo de prompts permanece.
- FK só em `cod`, tipo já igual ao de `dim_territorio.cod`. Carga: dimensão primeiro, dentro da transação que já existe em `loader.py`.
- `ddl_ouro.sql` é export estático do metadata (pode ser gerado por um trecho curto no teste ou no próprio arquivo). Não vira segundo caminho de migração.
- EDA e painel são Markdown em `docs/`. Números transcritos, não recalculados.
- Databricks: zero mudança em `page.tsx`, `02_gold.sql` e `paginas/`.