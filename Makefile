.PHONY: help secrets-dev deploy-api deploy-mcp deploy-viz deploy-frontend smoke lint

help:
	@echo "Available targets:"
	@echo "  make secrets-dev     # fetch dev secrets into current shell"
	@echo "  make deploy-api      # build & deploy nwsl-api"
	@echo "  make deploy-mcp      # build & deploy nwsl-mcp"
	@echo "  make deploy-viz      # build & deploy nwsl-viz"
	@echo "  make deploy-frontend # deploy Vercel frontend"
	@echo "  make smoke           # run smoke tests against all services"
	@echo "  make lint            # scan repos for hard-coded secrets"

secrets-dev:
	@./scripts/fetch_dev_secrets.sh

deploy-api:
	@./scripts/deploy_nwsl_api.sh

deploy-mcp:
	@./scripts/deploy_nwsl_mcp.sh

deploy-viz:
	@./scripts/deploy_nwsl_viz.sh

deploy-frontend:
	@./scripts/deploy_frontend.sh

smoke:
	@./scripts/smoke_tests.py --target api --target mcp --target viz

lint:
	@./scripts/lint_secrets.py ..
