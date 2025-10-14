# Runbook: Rotate Database Passwords

Applies to secrets `prod.db.url.write`, `prod.db.url.read`, and their dev/staging
counterparts.

1. **Generate new passwords**
   - Use `psql` or Cloud SQL Console to run:
     ```sql
     ALTER ROLE etl WITH PASSWORD 'NEW-STRONG-PASSWORD';
     ALTER ROLE mcpserver WITH PASSWORD 'NEW-STRONG-PASSWORD';
     ```
   - Record the new values in the secure vault (1Password).
2. **Update Secret Manager**
   ```bash
   echo "$NEW_ETL_URL" | gcloud secrets versions add prod.db.url.write --data-file=-
   echo "$NEW_READ_URL" | gcloud secrets versions add prod.db.url.read --data-file=-
   ```
3. **Redeploy services**
   - `./scripts/deploy_nwsl_api.sh`
   - `./scripts/deploy_nwsl_mcp.sh`
   - `./scripts/deploy_nwsl_viz.sh`
   - Update Vercel env vars if a frontend service needs the read URL.
4. **Run smoke tests**
   ```bash
   ./scripts/smoke_tests.py --target api --target mcp --target viz
   ```
5. **Cleanup**
   - Remove prior secret versions from Secret Manager once the rollout is
     confirmed.
   - Update `docs/secrets.md` with rotation date.
