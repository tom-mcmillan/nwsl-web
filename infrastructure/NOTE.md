Infrastructure-as-code lives here. If resources are currently provisioned
manually, document the current state and TODOs below.

- Cloud Run services: `nwsl-api`, `nwsl-mcp`, `nwsl-viz`.
- Cloud SQL instance: `nwsl` (PostgreSQL 17).
- Secret Manager: see `docs/secrets.md` for canonical names.
- Cloud Storage bucket: `nwsl-visualizations`.

TODO:
- [ ] Capture Cloud Run configuration in Terraform.
- [ ] Define IAM bindings for service accounts.
- [ ] Automate Secret Manager creation with standardized naming.
