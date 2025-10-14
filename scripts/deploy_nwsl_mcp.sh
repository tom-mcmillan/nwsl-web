#!/usr/bin/env bash
# Deploy the nwsl-mcp service (MCP HTTP transport).

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
REGION="${REGION:-us-central1}"
SERVICE="nwsl-mcp"

gcloud builds submit "../nwsl-mcp-py" \
  --config "../nwsl-ops/ci/cloudbuild.mcp.yaml" \
  --project "${PROJECT_ID}"

gcloud run deploy "${SERVICE}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets "DATABASE_URL=prod-db-url-read:latest" \
  --set-secrets "VIZ_API_KEY=prod-viz-bearer-key-service:latest" \
  --set-env-vars "VIZ_BASE=https://nwsl-viz-havwlplupa-uc.a.run.app" \
  --project "${PROJECT_ID}"
