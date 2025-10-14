#!/usr/bin/env bash
# Deploy the nwsl-api service via Cloud Build + Cloud Run.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
REGION="${REGION:-us-central1}"
SERVICE="nwsl-api"

gcloud builds submit "../nwsl-api" \
  --config "../nwsl-ops/ci/cloudbuild.api.yaml" \
  --project "${PROJECT_ID}"

gcloud run deploy "${SERVICE}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets "DATABASE_URL=prod-db-url-write:latest" \
  --set-secrets "NWSL_API_KEY=prod-api-bearer-key-edge:latest" \
  --set-secrets "PANEL_ADMIN_TOKEN=prod-api-bearer-key-panel-admin:latest" \
  --set-secrets "FOOTYSTATS_API_KEY=prod-integrations-api-key-footystats:latest" \
  --project "${PROJECT_ID}"
