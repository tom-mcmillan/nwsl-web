# Monitoring & Alerts

Checklist of metrics, dashboards, and alerts to keep an eye on service health.

## Dashboards

- **Cloud Run – nwsl-api**: request latency, error rates, CPU/memory usage.
- **Cloud Run – nwsl-mcp**: request count, DB connection pool utilization.
- **Cloud Run – nwsl-viz**: job duration, visualization cache hit rate.
- **Cloud SQL**: connections, CPU %, storage, slow queries.
- **Vercel Analytics**: page load errors, edge function latency.

## Alerts

- API 5xx rate > 5% over 5 minutes.
- MCP request failures (ChatKit agent errors).
- Cloud SQL connections nearing limit.
- Missing ETL job completion (daily schedule).

## Manual Checks

- Weekly: run `./scripts/smoke_tests.py --all`.
- Monthly: verify billing dashboards for unexpected spikes.
- After every deploy: confirm `/health` endpoints, basic dashboard load, and
  MCP tool invocation.
