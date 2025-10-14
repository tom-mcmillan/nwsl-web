#!/usr/bin/env bash
# Fetch developer secrets from Google Secret Manager and export them locally.
# Usage:
#   eval "$(/path/to/fetch_dev_secrets.sh)"

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
SECRETS=(
  "dev-db-url-read:DATABASE_URL"
  "dev-api-bearer-key-edge:NWSL_API_KEY"
  "dev-integrations-api-key-openai:OPENAI_API_KEY"
)

for entry in "${SECRETS[@]}"; do
  secret="${entry%%:*}"
  env_var="${entry##*:}"
  value="$(gcloud secrets versions access latest --secret="${secret}" --project="${PROJECT_ID}")"
  printf 'export %s=%q\n' "${env_var}" "${value}"
done
