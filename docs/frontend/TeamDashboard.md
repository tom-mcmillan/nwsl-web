# Team Dashboard Implementation Plan

## Overview

Replace the static HTML dashboard with a production Next.js implementation that consumes the new BFF endpoints, renders live analytics, and preserves the Capital IQ styling. This document outlines the front-end architecture, data flow, and milestones. Scope includes the six panels plus lookup selectors; ChatKit is optional initially.

## Panel Inventory & Data Contracts

| Panel / Feature | API Route | Notes |
|-----------------|-----------|-------|
| Header metrics | `GET /api/dashboard/summary` | Includes season filter. |
| Team overview | `GET /api/dashboard/team-overview` | Table + bar chart + team list. |
| Player valuation | `GET /api/dashboard/player-valuation` | Player table, headline stats, value flow. |
| Goalkeepers | `GET /api/dashboard/goalkeepers` | GK table + headline metrics. |
| Match momentum | `GET /api/dashboard/momentum` | Rolling xG series, event log, phase transitions. |
| Player style | `GET /api/dashboard/player-style` | Radar metrics, style vectors, prototypes, VAEP splits. |
| Global lookups | `GET /api/dashboard/lookups` | Seasons, teams, matches, players for selectors. |

## Architecture

- **Data Layer**: use React Query (`@tanstack/react-query`) for all client-side fetches. Create typed hooks per endpoint (e.g., `useTeamOverview`, `usePlayerValuation`). Query keys should include season/team/player filters to avoid stale data.
- **TypeScript Models**: rely on the interfaces exported from `lib/server/apiClient.ts` for strong typing throughout hooks and components.
- **Routing/Layout**: keep the main page under `app/page.tsx` or introduce a dedicated `/dashboard` route. Use a Server Component for the layout shell (title, static nav) and Client Components for data-driven panels.
- **Charts**: use `nwsl-viz` MPL Soccer charts for soccer-specific visuals (shot maps, heatmaps, pass networks) via BFF routes. For inline charts (bar/line/radar), add lightweight client-side components (Plotly radar optional). Tables remain HTML/CSS with optional virtualization.
- **Viz Service**: the BFF defaults to `https://nwsl-viz-havwlplupa-uc.a.run.app` with no auth. Override via `NWSL_VIZ_BASE_URL`/`NWSL_VIZ_TOKEN` if needed.
- **Shared Context**: implement a `DashboardFilterContext` to store selected season, competition, team, match, and player across panels.
- **Styling**: continue using Tailwind/CSS modules already defined in `app/globals.css`. Panels should match the Capital IQ-style grid.

## Interaction Design

- **Season Selector**: global; triggers refetches of all panels.
- **Competition Toggle**: optional, defaults to `regular_season`.
- **Team Filter**: shared by player valuation + goalkeeper panels.
- **Match Selector**: dropdown or search across match list for the momentum panel.
- **Player Search**: typeahead over player lookups for the style panel.
- **Loading/Error States**: skeleton loaders per panel, consistent error messages with retry buttons.
- **Last Updated**: display timestamps from API payloads in each panel footer.

## Implementation Steps

1. **Hook Layer (React Query)**
   - Implement hooks: `useDashboardSummary`, `useTeamOverview`, `usePlayerValuation`, `useGoalkeepers`, `useMomentum`, `usePlayerStyle`, `useDashboardLookups`.
   - Provide filter arguments and option hooks (e.g., enabling/disabling queries when required params are missing).
   - Configure environment variables (`NWSL_VIZ_BASE_URL`, `NWSL_VIZ_TOKEN`) to allow BFF routes to proxy the `nwsl-viz` service for soccer charts.
   - Frontend requests rely on the API's built-in static key (`public_dev_dashboard_key`). No local secrets required unless overriding with production values.

2. **Layout & Panels**
   - Build container layout replicating the three-column top grid + side ChatKit area.
   - Panel components: `TeamOverviewPanel`, `PlayerValuationPanel`, `GoalkeeperPanel`, `MomentumPanel`, `PlayerStylePanel`, `HeaderMetrics`.
   - Integrate chart libraries and configure axes/legends consistent with the HTML prototypes.

3. **Interactivity**
   - Create filter toolbar (season dropdown, competition toggle) using lookups data.
   - Sync team selector across valuation/GK panels.
   - Integrate match and player selectors (typeahead).
   - Wire ChatKit context updates using fetched metrics (optional for initial delivery).

4. **Testing & QA**
   - Component/unit tests with MSW mocking the BFF routes.
   - Integration tests verifying filter changes propagate to all panels.
   - Manual QA scenarios (different seasons, teams, missing data).

5. **Enhancements (Post-MVP)**
   - Integrate `nwsl-viz` endpoints for rendered heatmaps.
   - Persist user layout/filter preferences in localStorage.
   - Add CSV export options for tables using JSON data.
   - Provide skeleton for future analytics (tactics heatmap) when backend endpoint is ready.

## Deliverables

- React Query hook library for dashboard endpoints.
- Fully interactive dashboard page with live data visuals.
- Documentation updates (README, usage examples).
- Optional: Storybook entries for key components.

Once hooks are in place, development can proceed panel by panel following the order above.
