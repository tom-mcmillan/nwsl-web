#!/usr/bin/env bash
# Fetch a single production secret from Google Secret Manager.
# Usage:
#   ./scripts/fetch_prod_secret.sh prod.db.url.write

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <secret-name>" >&2
  exit 1
fi

PROJECT_ID="${GCP_PROJECT:-nwsl-data}"
SECRET_NAME="$1"

gcloud secrets versions access latest --secret="${SECRET_NAME}" --project="${PROJECT_ID}"
