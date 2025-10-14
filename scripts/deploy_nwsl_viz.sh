#!/usr/bin/env bash
# Deploy the nwsl-viz visualization service.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
REGION="${REGION:-us-central1}"
SERVICE="nwsl-viz"

gcloud builds submit "../nwsl-viz" \
  --config "../nwsl-ops/ci/cloudbuild.viz.yaml" \
  --project "${PROJECT_ID}"

gcloud run deploy "${SERVICE}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets "DATABASE_URL=prod-db-url-read:latest" \
  --set-secrets "VIZ_API_KEY=prod-viz-bearer-key-service:latest" \
  --set-env-vars "VIZ_BUCKET=nwsl-visualizations" \
  --project "${PROJECT_ID}"
