# SPEC — Autorizar o SP Access a emitir o token de embed

Cole este texto na IA do Databricks. Não altere SQL, warehouse, publicação nem o `embed_credentials`.

## O que já foi validado (16/11/2026, contra o workspace real)

Workspace `https://dbc-e7ffba4b-1a76.cloud.databricks.com` (`o=7474648187013488`).
Dashboard `01f1e08bd1d71ca9b49a4604ee008ce0` (Analytics · IBGE): publicado, `lifecycle_state=ACTIVE`, `embed_credentials=true`, warehouse `6e8085d1425b8503`.

Service principal **Access**, client id `dcabf4c5-5541-46a8-853d-f22b2baed7a3`, id numérico `73584394385339`. ACL do dashboard: só `CAN_READ`.

Fluxo da aplicação, com um segredo OAuth novo (prefixo `dos`, apagado ao final do teste):

1. `POST /oidc/v1/token?o=7474648187013488` com Basic e `grant_type=client_credentials&scope=all-apis` → 200, `access_token` JWT.
2. `GET /api/2.0/lakeview/dashboards/01f1e08bd1d71ca9b49a4604ee008ce0/published/tokeninfo?o=7474648187013488&external_viewer_id=visitante1&external_value=publico` com `Authorization: Bearer <access_token>` → 200.
3. Novo `POST /oidc/v1/token?o=7474648187013488` com Basic, os campos do tokeninfo e `authorization_details` em string JSON → **401**:

```json
{"error":"invalid_authorization_details","error_description":"User is not authorized to the requested authorizations"}
```

O `tokeninfo` pede estas permissões, que o SP não tem:

- `permissionSets/workspace.workspace-access` em `workspaces/7474648187013488`
- `permissionSets/workspace.dbsql-access` em `workspaces/7474648187013488`
- `permissionSets/dashboard.runner` em `workspaces/7474648187013488/dashboards/01f1e08bd1d71ca9b49a4604ee008ce0`

Sem isso o passo 3 não emite o token que o `@databricks/aibi-client` usa. O 401 antigo de "Credential was not sent" não é o erro deste fluxo quando o Bearer é o `access_token`.

## O que fazer

1. No SP Access, marcar os entitlements **Workspace access** e **Databricks SQL access**.
2. No dashboard Analytics · IBGE, subir o SP Access de `CAN_READ` para `CAN_RUN`. Não tirar o acesso de quem já tem.
3. Não mudar SQL, warehouse `6e8085d1425b8503`, `embed_credentials` nem a publicação.
4. Na allowlist de embed (Settings → Security → External access → Embed dashboards), manter `https://dash.clevo.com.br/` e acrescentar `http://localhost:5173`.
5. Gerar um segredo OAuth novo para o client id `dcabf4c5-5541-46a8-853d-f22b2baed7a3` com a lista de escopos vazia (irrestrito, `all-apis`). Não marque escopos como `dashboard.genie`, `sql` ou outro subset: um segredo restrito responde 403 `Scopes 'all-apis' are not assigned`. Entregar o valor uma única vez. Não gravar o segredo no repositório.

## Pronto quando

- O passo 3 acima responde 200 com `access_token` que começa com `eyJ` e é diferente do token do passo 1.
- O SP Access tem `CAN_RUN` no dashboard e os dois entitlements.
- `http://localhost:5173` aparece na allowlist junto com `https://dash.clevo.com.br/`.
