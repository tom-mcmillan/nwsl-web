#!/usr/bin/env bash
# Deploy the Next.js frontend (Vercel).

set -euo pipefail

# Ensure Vercel CLI is authenticated.
vercel --version >/dev/null

# Push updated environment variables from Secret Manager.
PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
ENVIRONMENTS=("production" "preview")

for env in "${ENVIRONMENTS[@]}"; do
  if [[ "${env}" == "production" ]]; then
    secret_prefix="prod"
  else
    secret_prefix="dev"
  fi

  vercel env add NWSL_API_KEY "${env}" <<< "$(gcloud secrets versions access latest --secret=${secret_prefix}-api-bearer-key-edge --project=${PROJECT_ID})"
  vercel env add OPENAI_API_KEY "${env}" <<< "$(gcloud secrets versions access latest --secret=${secret_prefix}-integrations-api-key-openai --project=${PROJECT_ID})"
  vercel env add CHATKIT_WORKFLOW_ID "${env}" <<< "$(gcloud secrets versions access latest --secret=${secret_prefix}-integrations-workflow-id-chatkit --project=${PROJECT_ID})"
done

# Trigger deployment.
vercel --prod ../nwsl-web
