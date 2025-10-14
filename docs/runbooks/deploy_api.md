# Runbook: Deploy `nwsl-api`

1. **Fetch secrets (local terminal)**
   ```bash
   eval "$(./scripts/fetch_prod_secret.sh prod.db.url.write)"
   eval "$(./scripts/fetch_prod_secret.sh prod.api.bearer-key.edge)"
   eval "$(./scripts/fetch_prod_secret.sh prod.api.bearer-key.panel-admin)"
   eval "$(./scripts/fetch_prod_secret.sh prod.integrations.api-key.footystats)"
   ```
2. **Kick off Cloud Build**
   ```bash
   ./scripts/deploy_nwsl_api.sh
   ```
   The script wraps `gcloud builds submit` and `gcloud run deploy` with the
   canonical `--set-secrets` flags.
3. **Verify deployment**
   - Check Cloud Build logs for success.
   - Run smoke tests:
     ```bash
     ./scripts/smoke_tests.py --target api
     ```
   - Confirm `/health` returns `200`.
4. **Cleanup**
   - Unset any exported secrets if you fetched them into the shell.
   - Update deployment notes (GitHub PR, changelog).
