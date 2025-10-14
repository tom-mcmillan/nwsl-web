# Secret Inventory

This document tracks every secret that powers the NWSL platform. For each entry,
record the canonical Secret Manager name, the environment variable that
consumers expect, and the services that depend on it. Update this table whenever
you add, rotate, or decommission a credential.

> **Note:** do **not** store raw secret values here. Values live in Google Secret
> Manager (and a secure vault for rotation history).

## Baseline (current names before refactor)

| Secret Manager Name         | Runtime Env Var / Usage                         | Notes / Consumers                               |
|-----------------------------|--------------------------------------------------|--------------------------------------------------|
| `DATABASE_URL_API`          | `DATABASE_URL` for `nwsl-api` (write-access URL) | Cloud Run; likely maps to `etl` Postgres role    |
| `DATABASE_URL_ETL`          | Legacy ETL scripts                               | Verify if still used; same credentials as above  |
| `DATABASE_URL_MCP`          | Read URL for MCP service                         | Superseded by `MCP_DATABASE_URL`?               |
| `MCP_DATABASE_URL`          | `DATABASE_URL` for `nwsl-mcp`                    | Used by MCP deploy/load scripts                  |
| `FOOTYSTATS_API_KEY`        | `FOOTYSTATS_API_KEY`                             | `nwsl-api` enrichment endpoints                  |
| `JWKS_URI`, `JWT_AUD`, `JWT_ISS`, `JWT_SECRET` | Legacy auth setup          | Confirm if still required                        |
| `NWSL_API_KEY`              | Edge API key (`X-API-Key`)                       | Vercel frontend / testing                        |
| `NWSL_API_KEYS`             | Comma-separated static keys                      | `nwsl-api` static auth map                       |
| `TEST_API_KEY`              | QA / dev key                                     | Redundant with `NWSL_API_KEY`?                   |
| `NWSL_API_PASSWORD`         | Legacy credential                                | Identify active usage                            |
| `NWSL_DB_PASSWORD`          | Raw DB password (role unknown)                   | Possibly duplicate of `db-password`             |
| `db-password`               | Same as above (legacy)                           | Clean up after rotation                          |
| `NWSL_INGEST_PASSWORD`      | `NWSL_INGEST_PASSWORD` for Next.js ingest        | Used by `nwsl-web/lib/db.ts`                     |
| `NWSL_MCP_PASSWORD`         | DB password for `mcpserver` role                 | Used alongside `MCP_DATABASE_URL`                |
| `USER_DB_PASSWORD`          | NextAuth / user DB password                      | Needed only if auth re-enabled                   |
| `OPENAI_API_KEY`, `openai-api-key` | OpenAI integrations                      | Consolidate to one canonical secret              |
| `SVC_TOKEN`                 | Legacy orchestrator token                        | Determine ongoing usage before delete            |

Current Vercel env vars: `NWSL_API_KEY`, `NWSL_API_BASE_URL`, `OPENAI_API_KEY`, `CHATKIT_WORKFLOW_ID`.

Document any additional secrets you encounter before renaming.

### gcloud snapshot (baseline)

```
NAME                  CREATED              REPLICATION_POLICY  LOCATIONS
DATABASE_URL_API      2025-09-27T23:33:41  automatic           -
DATABASE_URL_ETL      2025-10-08T01:43:34  automatic           -
DATABASE_URL_MCP      2025-09-27T23:33:39  automatic           -
FOOTYSTATS_API_KEY    2025-09-27T23:33:24  automatic           -
JWKS_URI              2025-09-13T03:50:06  automatic           -
JWT_AUD               2025-09-13T03:50:08  automatic           -
JWT_ISS               2025-09-13T03:50:03  automatic           -
JWT_SECRET            2025-09-13T20:35:57  automatic           -
MCP_DATABASE_URL      2025-09-24T19:23:41  automatic           -
NWSL_API_KEY          2025-10-08T01:00:47  automatic           -
NWSL_API_KEYS         2025-09-25T02:40:12  automatic           -
NWSL_API_PASSWORD     2025-09-27T23:33:23  automatic           -
NWSL_DB_PASSWORD      2025-09-25T02:44:35  automatic           -
NWSL_INGEST_PASSWORD  2025-09-27T23:33:20  automatic           -
NWSL_MCP_PASSWORD     2025-09-27T23:33:21  automatic           -
OPENAI_API_KEY        2025-09-19T19:50:59  automatic           -
SVC_TOKEN             2025-09-13T03:48:55  automatic           -
TEST_API_KEY          2025-09-25T03:24:45  automatic           -
USER_DB_PASSWORD      2025-09-25T02:44:41  automatic           -
db-password           2025-09-09T19:55:35  automatic           -
openai-api-key        2025-07-30T14:59:15  automatic           -
```

## Target State (new taxonomy)

| Environment | Secret Manager Name                         | Exposed Env Var               | Scope / Purpose                 | Consumers                         | Last Rotated | Notes |
|-------------|---------------------------------------------|-------------------------------|---------------------------------|-----------------------------------|--------------|-------|
| `prod`      | `prod_db_url_write`                         | `DATABASE_URL`                | Warehouse write access          | `nwsl-api`, ETL jobs              | _YYYY-MM-DD_ | replaces `DATABASE_URL_API` |
| `prod`      | `prod_db_url_read`                          | `DATABASE_URL`                | Warehouse read access           | `nwsl-mcp`, `nwsl-viz`, analytics | _YYYY-MM-DD_ | replaces `MCP_DATABASE_URL` |
| `prod`      | `prod_db_password_ingest`                   | `NWSL_INGEST_PASSWORD`        | Legacy ingest scripts           | `nwsl-web` ingest helpers         | _YYYY-MM-DD_ | deprecate after migrating to read URL |
| `prod`      | `prod_api_bearer_key_edge`                  | `NWSL_API_KEY`                | Public API usage                | Vercel frontend / integrations    | _YYYY-MM-DD_ | replaces `NWSL_API_KEY` |
| `prod`      | `prod_api_bearer_key_edge-test`             | `NWSL_API_KEY_TEST`           | QA / integration testing        | automated tests                   | _YYYY-MM-DD_ | replaces `TEST_API_KEY` |
| `prod`      | `prod_api_bearer_key_panel_admin`           | `PANEL_ADMIN_TOKEN`           | Panel admin endpoints           | `nwsl-api`                        | _YYYY-MM-DD_ | |
| `prod`      | `prod_api_keys_static`                      | `NWSL_STATIC_API_KEYS`        | Comma-separated API keys        | `nwsl-api`                        | _YYYY-MM-DD_ | replaces `NWSL_API_KEYS` |
| `prod`      | `prod_integrations_api_key_footystats`      | `FOOTYSTATS_API_KEY`          | External data fetches           | `nwsl-api`                        | _YYYY-MM-DD_ | |
| `prod`      | `prod_integrations_api_key_openai`          | `OPENAI_API_KEY`              | ChatKit / MCP                   | Frontend, MCP agent               | _YYYY-MM-DD_ | replaces `OPENAI_API_KEY`, `openai-api-key` |
| `prod`      | `prod_integrations_workflow_id_chatkit`     | `CHATKIT_WORKFLOW_ID`         | ChatKit workflow ID             | Vercel frontend                   | _YYYY-MM-DD_ | |
| `prod`      | `prod_viz_bearer_key_service`               | `VIZ_API_KEY`                 | Viz microservice auth           | `nwsl-mcp`, `nwsl-viz`            | _YYYY-MM-DD_ | |
| `prod`      | `prod_auth_jwt_secret`                      | `JWT_SECRET`                  | Legacy JWT signing              | `nwsl-api` (if enabled)           | _YYYY-MM-DD_ | group JWKS/JWT values under `prod.auth.*` |
| `prod`      | `prod_auth_jwks_uri`                        | `JWKS_URI`                    | Legacy auth discovery           | `nwsl-api`                        | _YYYY-MM-DD_ | |
| `prod`      | `prod_auth_jwt_issuer`                      | `JWT_ISS`                     | JWT issuer                      | `nwsl-api`                        | _YYYY-MM-DD_ | |
| `prod`      | `prod_auth_jwt_audience`                    | `JWT_AUD`                     | JWT audience                    | `nwsl-api`                        | _YYYY-MM-DD_ | |
| `prod`      | `prod_auth_user_db_password`                | `USER_DB_PASSWORD`            | NextAuth database (optional)    | `nwsl-web`                        | _YYYY-MM-DD_ | only if auth enabled |
| `dev`       | `dev_db_url_write`                          | `DATABASE_URL`                | Dev write DB                    | local ETL / API                   | _YYYY-MM-DD_ | |
| `dev`       | `dev_db_url_read`                           | `DATABASE_URL`                | Dev read DB                     | MCP, viz, notebooks               | _YYYY-MM-DD_ | |
| `dev`       | `dev_db_password_ingest`                    | `NWSL_INGEST_PASSWORD`        | Dev ingest scripts              | `nwsl-web` local                  | _YYYY-MM-DD_ | |
| `dev`       | `dev_api_bearer_key_edge`                   | `NWSL_API_KEY`                | Dev API usage                   | Vercel preview, local BFF         | _YYYY-MM-DD_ | |
| `dev`       | `dev_api_keys_static`                       | `NWSL_STATIC_API_KEYS`        | Dev static keys                 | `nwsl-api` dev instance           | _YYYY-MM-DD_ | |
| `dev`       | `dev_integrations_api_key_footystats`       | `FOOTYSTATS_API_KEY`          | Dev FootyStats access           | `nwsl-api` dev                    | _YYYY-MM-DD_ | |
| `dev`       | `dev_integrations_api_key_openai`           | `OPENAI_API_KEY`              | Dev ChatKit / MCP               | Frontend dev, MCP dev             | _YYYY-MM-DD_ | |
| `dev`       | `dev_integrations_workflow_id_chatkit`      | `CHATKIT_WORKFLOW_ID`         | Dev ChatKit workflow            | Vercel preview                    | _YYYY-MM-DD_ | |
| `dev`       | `dev_viz_bearer_key_service`                | `VIZ_API_KEY`                 | Dev viz auth                    | MCP dev, viz dev                  | _YYYY-MM-DD_ | |
| `dev`       | `dev_auth_jwt_secret`                       | `JWT_SECRET`                  | Dev JWT testing                 | `nwsl-api` dev                    | _YYYY-MM-DD_ | |

## Rotation Checklist

1. Create a new secret version in Google Secret Manager.
2. Update the relevant deployment descriptors (`gcloud run deploy … --set-secrets`).
3. Refresh Vercel or other environment-specific configs.
4. Redeploy services and confirm health checks.
5. Update the "Last Rotated" date in the table above.
6. Remove the previous secret version once the rollout is stable.

**Status notes (2025-10-14):**
- Created new underscore-named secrets for DB URLs/password, API edge/static/test keys, FootyStats, OpenAI, and JWT configuration (prod + dev).
- Panel admin token, ChatKit workflow ID, and viz bearer token now have populated prod/dev entries in Secret Manager.
- Analytics agent requests now route exclusively through the ChatKit workflow, so no separate `AGENT_SERVICE_API_KEY` secret is required (removed prod/dev entries from Secret Manager).
