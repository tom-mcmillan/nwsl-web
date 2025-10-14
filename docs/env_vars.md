# Environment Variable Inventory

Per-service environment variables discovered in the current codebase.

## nwsl-web (Next.js)
- `NWSL_API_BASE_URL`
- `NWSL_API_KEY`
- `NWSL_PANEL_ADMIN_TOKEN`
- `OPENAI_API_KEY`
- `CHATKIT_WORKFLOW_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` (NextAuth / Prisma)
- `NWSL_DATA_WAREHOUSE_URL`
- `NWSL_DATA_WAREHOUSE_SSL`
- `NWSL_VIZ_BASE_URL`
- `NWSL_VIZ_TOKEN`
- `NWSL_INGEST_PASSWORD`

## nwsl-api (Flask)
- `DATABASE_URL` components (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- `PANEL_ADMIN_TOKEN`
- `NWSL_STATIC_API_KEYS` / `STATIC_API_KEYS`
- `DEFAULT_PUBLIC_API_KEY`
- `AGENT_SERVICE_URL`
- `AGENT_SERVICE_API_KEY`
- `AGENT_SERVICE_TIMEOUT`
- `PANEL_CACHE_TTL`
- `USER_DB_ENABLED`
- `FOOTYSTATS_API_KEY`
- `PORT`

## nwsl-mcp-py (MCP)
- `DATABASE_URL`
- `VIZ_API_KEY`
- `VIZ_BASE`
- `ALLOWED_ORIGINS`
- `PORT`

## nwsl-viz
- `DATABASE_URL`
- `VIZ_BUCKET`
- `VIZ_CACHE_VERSION`
- `DB_POOL_MIN_CONN`
- `DB_POOL_MAX_CONN`
- `VIZ_REQUIRE_AUTH`
- `VIZ_API_KEY`
- `PORT`

Update this list whenever new environment variables are introduced or removed.
