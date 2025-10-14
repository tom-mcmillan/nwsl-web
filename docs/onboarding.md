# Onboarding Guide

Welcome to the NWSL operations playbook. This short guide helps future-you (or
new collaborators) ramp up quickly.

## Repositories

- `nwsl-web` – Next.js frontend (Vercel).
- `nwsl-api` – Flask analytics API.
- `nwsl-mcp-py` – MCP research tools for ChatKit.
- `nwsl-viz` – Visualization microservice.
- `nwsl-loader` – ETL pipeline and warehouse utilities.
- `nwsl-ops` – **this repo**: secrets, runbooks, infra scripts.

## Prerequisites

- Google Cloud SDK (`gcloud`) authenticated to the `nwsl-data` project.
- Access to Google Secret Manager (Secret Manager Secret Accessor role).
- Vercel CLI access to the deployment project.

## Getting Started

1. Clone `nwsl-ops` and run `make help` to see available automation.
2. Fetch dev secrets: `eval "$(./scripts/fetch_dev_secrets.sh)"`.
3. Follow `docs/architecture.md` for the big picture.
4. Review runbooks in `docs/runbooks/` before your first deploy.
5. Keep `docs/secrets.md` updated whenever credentials change.

## Expectations

- Document incidents and rotations.
- Prefer automation via scripts/Makefile over ad-hoc commands.
- Keep secrets out of code repositories; always fetch from Secret Manager.
- Update this guide whenever processes change.

Welcome aboard!
