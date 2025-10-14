# NWSL Ops

Operational runbooks, infrastructure definitions, and shared automation for the
NWSL analytics platform. This repository hosts the cross-service documentation
and scripts that keep deployments, secrets, and monitoring consistent across
projects.

## Layout

- `docs/` – canonical documentation (secret inventory, architecture diagrams,
  runbooks, monitoring notes, onboarding checklist).
- `scripts/` – helper scripts for fetching secrets, deploying services, and
  executing smoke tests.
- `infrastructure/` – infrastructure-as-code (Terraform) or notes describing
  the current manual setup.
- `ci/` – reference CI/CD configuration files (Cloud Build, Vercel mappings).
- `Makefile` – convenience targets that tie scripts together.

See `docs/onboarding.md` for guidance on how to use the repository and update it
as the platform evolves.
