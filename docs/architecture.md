# Architecture Overview

High-level flow of data and services for the NWSL analytics stack.

```
Browser (nwsldata.com)
        │
        ▼
Next.js BFF (Vercel) ──▶ NWSL API (Cloud Run) ──▶ Cloud SQL (PostgreSQL)
        │                                      ▲
        │                                      │
        ├──▶ Viz Service (Cloud Run) ◀─────────┘
        │
        └──▶ ChatKit / MCP Agent
                   │
                   ▼
             MCP Service (Cloud Run) ──▶ Cloud SQL (read-only)
```

## Components

- **Next.js BFF** – server-side routes that inject API keys and proxy frontend
  requests to backend services.
- **NWSL API** – Flask service that exposes curated analytics endpoints with
  rate limiting and API-key authentication.
- **ETL Jobs** – batch processes that populate the Kimball-modeled warehouse.
- **MCP Service** – Model Context Protocol implementation used by the ChatKit
  agent to run research tools.
- **Viz Service** – generates mplsoccer visualizations and stores them in Google
  Cloud Storage.

## Secrets & Access

- Write access to the database is reserved for ETL jobs and the API.
- Read-only credentials are issued to MCP, viz, and analytics notebooks.
- Frontend uses edge API keys with limited scope (no direct DB access).

Keep this document updated as the architecture evolves (new services, new
datastores, etc.).
