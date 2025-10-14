# NWSL Dashboard Data Contracts

This document enumerates the data requirements for the upcoming analytics
dashboard, defines the canonical JSON contracts that the Next.js BFF will
consume, and specifies which backend service is responsible for producing each
payload. It also highlights any supporting database objects that may need to be
added or refreshed in the warehouse.

## Overview

The dashboard contains six primary panels plus global chrome (header metrics,
search, research links, ChatKit context). Each panel requires a structured JSON
response that the front end can request from `app/api/dashboard/*` routes. Those
routes will fan out to one of three backend services:

| Service         | Responsibility                                                                                       |
|-----------------|------------------------------------------------------------------------------------------------------|
| `nwsl-api`      | REST endpoints backed by curated SQL/aggregation views; ideal for deterministic, repeatable queries. |
| `nwsl-mcp-py`   | MCP tools that combine statistics/ML logic (VAEP, xT, SoccerMix, tactics clustering).                |
| `nwsl-viz`      | Visualization microservice returning rendered images or dense grids for pitch-based charts.          |

Wherever possible, responses should be cache-friendly (cache key derived from
season/team/match parameters) and include metadata (source tables, last updated,
model version).

## Global Metrics (Header + Stats Bar)

**BFF endpoint**: `GET /api/dashboard/summary?season=<year>`

**Contract**

```json5
{
  "seasonYear": 2025,
  "headline": {
    "matches": 1328,
    "players": 895,
    "teams": 14,
    "events": 2584661
  },
  "kpis": [
    {"label": "Matches", "value": 1328},
    {"label": "Players", "value": 895},
    {"label": "Teams", "value": 14},
    {"label": "Events", "value": 2584661},
    {
      "label": "data_sources",
      "note": "dim_team, dim_match, dim_player_contract, fact_event_xg, ...",
      "type": "note"
    }
  ],
  "lastUpdated": "2025-09-15T08:30:00Z"
}
```

**Producer**: `nwsl-api` (simple aggregated SQL using `dim_match`, `dim_player`,
`dim_team`, partitioned event tables). No new views required; counts can be
calculated via `COUNT(*)` with partition tables unioned through metadata.

---

## Panel 1 – Team Overview & Key Performance

**BFF endpoint**: `GET /api/dashboard/team-overview?season=<year>&competition=regular_season`

**Contract**

```json5
{
  "seasonYear": 2025,
  "competition": "regular_season",
  "leagueAverages": {
    "goalsPerMatch": 2.78,
    "shotsPerMatch": 22.4,
    "passAccuracyPct": 78.6,
    "homeWinPct": 58.3
  },
  "teamTable": {
    "columns": ["team", "mp", "w", "d", "l", "gf", "ga", "gd", "ppg", "shot_acc_pct", "pass_acc_pct"],
    "rows": [
      ["Portland Thorns", 26, 15, 6, 5, 49, 28, 21, 2.08, 54.3, 80.1],
      "... additional teams ..."
    ]
  },
  "barChart": {
    "series": [
      {
        "name": "Points per Game",
        "data": [
          {"team": "Portland Thorns", "value": 2.08},
          {"team": "Kansas City Current", "value": 1.97}
        ]
      },
      {
        "name": "Goals For",
        "data": [
          {"team": "Portland Thorns", "value": 49},
          {"team": "Kansas City Current", "value": 45}
        ]
      }
    ]
  },
  "source": {
    "service": "nwsl-api",
    "tables": ["agg_team_season"],
    "materializedView": "mv_league_standings (optional for standings ranking)"
  }
}
```

**Producer**: `nwsl-api`. Primary data from `agg_team_season`; league averages
can be derived on the fly or via a lightweight view (`vw_team_league_averages`)
that aggregates by season/competition. No MCP logic required.

**Visuals**: Shot map imagery for the selected team is sourced from `nwsl-viz`
(`POST /generate_shot_map`), surfaced via the Next.js BFF at
`/api/viz/shot-map`. The front end embeds the returned image URL alongside the
table and averages.

---

## Panel 2 – Player Valuation & Advanced Metrics

**BFF endpoint**: `GET /api/dashboard/player-valuation?season=<year>&teamId=<contestant_id|all>`

**Contract**

```json5
{
  "seasonYear": 2025,
  "teamFilter": {
    "selectedTeamId": null,
    "selectedTeamName": "All Teams",
    "availableTeams": [
      {"teamId": "portland-thorns", "teamName": "Portland Thorns"},
      {"teamId": "orlando-pride", "teamName": "Orlando Pride"}
    ]
  },
  "headline": {
    "topXg": {"playerId": "sophia-smith", "playerName": "Sophia Smith", "value": 15.3},
    "topXt": {"playerId": "debinha", "playerName": "Debinha", "value": 9.7},
    "medianVaep": 0.12
  },
  "players": {
    "columns": ["player", "team", "position", "minutes", "xg", "goals", "xa", "assists", "xt", "vaep"],
    "rows": [
      {
        "playerId": "sophia-smith",
        "playerName": "Sophia Smith",
        "teamName": "Portland Thorns",
        "position": "FW",
        "minutes": 1985,
        "xg": 15.3,
        "goals": 16,
        "xa": 6.2,
        "assists": 6,
        "xt": 9.7,
        "vaep": 0.31
      }
    ]
  },
  "valueFlow": {
    "nodes": [
      {"id": "Portland Thorns", "group": "team"},
      {"id": "Sophia Smith", "group": "player"}
    ],
    "links": [
      {"source": "Portland Thorns", "target": "Sophia Smith", "weight": 4.6}
    ],
    "modelVersion": "socceraction_vaep_v1.4.2"
  },
  "source": {
    "service": "nwsl-mcp-py",
    "tool": "query_player_metrics",
    "auxiliaryTables": [
      "agg_player_season",
      "fact_action_xt",
      "fact_vaep_values"
    ]
  }
}
```

**Producer**: `nwsl-mcp-py`. The existing `query_player_metrics` tool already
surfaces goals, assists, VAEP, xT. The Sankey/value-flow representation can be
composed within the tool or a new dedicated tool (`get_player_value_flow`) that
returns per-player xT/VAEP contributions grouped by team. Requires access to
`agg_player_season`, `fact_action_xt`, `fact_vaep_values`.

---

## Panel 3 – Team Tactical Analysis

**BFF endpoint**: `GET /api/dashboard/tactics?teamId=<contestant_id>&season=<year>&eventType=<pass|shot|defense>`

**Contract**

```json5
{
  "team": {"teamId": "orlando-pride", "teamName": "Orlando Pride"},
  "seasonYear": 2025,
  "eventType": "pass",
  "heatmap": {
    "gridSize": [50, 32],
    "cells": [
      {"x": 5, "y": 12, "count": 18},
      {"x": 6, "y": 12, "count": 22}
    ],
    "normalization": "per90"
  },
  "playerDistribution": [
    {
      "playerId": "marta",
      "playerName": "Marta",
      "x": 65.2,
      "y": 34.8,
      "density": 0.73
    }
  ],
  "trendMiniChart": {
    "series": [
      {
        "name": "Possession Trend",
        "points": [
          {"minute": 15, "value": 0.62},
          {"minute": 30, "value": 0.58}
        ]
      }
    ]
  },
  "source": {
    "service": "nwsl-mcp-py",
    "tool": "query_spatial_distribution",
    "auxiliaryTables": ["fact_event_2025", "fact_phase", "fact_phase_cluster"],
    "visualization": {
      "service": "nwsl-viz",
      "endpoint": "/generate_heatmap",
      "optional": true
    }
  }
}
```

**Producer**: `nwsl-mcp-py` for core data. The `query_spatial_distribution`
tool can be extended to return grid densities and per-player centroid clusters.
Optionally request an image from `nwsl-viz` when the front end prefers a rendered
PNG. Raw data sourced from the relevant partitioned event tables plus phase/tactic
metadata (`fact_phase`, `fact_phase_cluster`).

---

## Panel 4 – Goalkeeper Performance Analysis

**BFF endpoint**: `GET /api/dashboard/goalkeepers?season=<year>&teamId=<contestant_id|all>`

**Contract**

```json5
{
  "seasonYear": 2025,
  "teamFilter": {
    "selectedTeamId": null,
    "availableTeams": [
      {"teamId": "portland-thorns", "teamName": "Portland Thorns"},
      {"teamId": "gotham-fc", "teamName": "Gotham FC"}
    ]
  },
  "headline": {
    "bestSavePct": {"playerId": "alyssa-naeher", "value": 78.4},
    "cleanSheetsLeader": {"playerId": "adrianna-franch", "value": 9},
    "distributionLeader": {"playerId": "kailen-sheridan", "value": 80.1}
  },
  "goalkeepers": {
    "columns": ["player", "team", "matches", "saves", "save_pct", "goals_conceded", "clean_sheets", "psxg_plus_minus", "dist_acc_pct"],
    "rows": [
      {
        "playerId": "alyssa-naeher",
        "playerName": "Alyssa Naeher",
        "teamName": "Chicago Red Stars",
        "matches": 22,
        "saves": 97,
        "savePct": 78.4,
        "goalsConceded": 27,
        "cleanSheets": 8,
        "psxgPlusMinus": 3.1,
        "distributionAccuracy": 76.2
      }
    ]
  },
  "barChart": {
    "metric": "psxg_plus_minus",
    "series": [
      {"playerId": "alyssa-naeher", "playerName": "Alyssa Naeher", "value": 3.1},
      {"playerId": "adrianna-franch", "playerName": "Adrianna Franch", "value": 2.4}
    ]
  },
  "source": {
    "service": "nwsl-api",
    "tables": ["agg_goalkeeper_season"],
    "notes": "PSxG derived from fact_event_xg joins; ensure the season refresh job populates the aggregate."
  }
}
```

**Producer**: `nwsl-api`. All required measures are already in `agg_goalkeeper_season`.
If PSxG +/- is missing, create a view `vw_goalkeeper_psxg` that joins aggregates to
`fact_event_xg`.

---

## Panel 5 – Match Momentum & Key Events

**BFF endpoint**: `GET /api/dashboard/momentum?matchId=<match_id>`

**Contract**

```json5
{
  "match": {
    "matchId": "401f4aa222f94b0690858b2c2053a676",
    "matchDate": "2025-08-24",
    "homeTeam": "Orlando Pride",
    "awayTeam": "San Diego Wave",
    "homeScore": 3,
    "awayScore": 2
  },
  "momentum": {
    "series": [
      {
        "team": "home",
        "points": [
          {"minute": 1, "value": 0.02},
          {"minute": 5, "value": 0.05}
        ]
      },
      {
        "team": "away",
        "points": [
          {"minute": 1, "value": 0.01},
          {"minute": 5, "value": 0.03}
        ]
      }
    ],
    "metric": "rolling_xg",
    "window": 5
  },
  "events": [
    {"minute": 12, "team": "Orlando Pride", "player": "Marta", "event": "Goal", "detail": "Left-footed shot"},
    {"minute": 31, "team": "San Diego Wave", "player": "Alex Morgan", "event": "Shot", "detail": "Saved"}
  ],
  "valueFlow": {
    "nodes": [
      {"id": "Build-up", "group": "phase"},
      {"id": "Final third", "group": "phase"},
      {"id": "Shot", "group": "action"},
      {"id": "Goal", "group": "action"}
    ],
    "links": [
      {"source": "Build-up", "target": "Final third", "weight": 42}
    ]
  },
  "source": {
    "service": "nwsl-api",
    "tables": [
      "dim_match",
      "fact_event_xg",
      "fact_match_goal_timeline",
      "fact_phase",
      "fact_phase_event"
    ],
    "supplementary": {
      "service": "nwsl-mcp-py",
      "tool": "query_sequence_patterns",
      "usage": "Derive phase transitions for Sankey diagram"
    }
  }
}
```

**Producer**: Mixed. The momentum curve (rolling xG) can be produced with SQL
window functions over `fact_event_xg` in `nwsl-api`. Event log comes from
`fact_match_goal_timeline` and `fact_match_ai_analysis` (for narratives if desired).
Phase transition Sankey can be generated via MCP (`query_sequence_patterns`)
consuming `fact_phase_*` tables.

---

## Panel 6 – Player Style & Role

**BFF endpoint**: `GET /api/dashboard/player-style?playerId=<player_id>&season=<year>`

**Contract**

```json5
{
  "player": {
    "playerId": "cmolam8ri93kos2rasjhnuxyi",
    "playerName": "S. Coffey",
    "teamId": "portland-thorns",
    "teamName": "Portland Thorns",
    "seasonYear": 2025,
    "competition": "regular_season",
    "matchesPlayed": 22,
    "minutesPlayed": 1985
  },
  "radar": {
    "metrics": [
      {"label": "Goals per 90", "value": 0.31, "percentile": 88.4},
      {"label": "Assists per 90", "value": 0.27, "percentile": 81.9},
      {"label": "Take-On Success %", "value": 62.1, "percentile": 74.2},
      {"label": "Tackle Success %", "value": 54.3, "percentile": 68.0},
      {"label": "Pass Accuracy %", "value": 82.4, "percentile": 92.5},
      {"label": "Season xT", "value": 6.91, "percentile": 89.7}
    ],
    "scale": "per90"
  },
  "styleVector": {
    "styleVector": [0.02, 0.18, 0.11, "..."],
    "passVector": ["..."],
    "crossVector": ["..."],
    "dribbleVector": ["..."],
    "shotVector": ["..."]
  },
  "stylePrototypes": [
    {"prototypeId": 305, "actionType": "carry", "stage": 1, "weight": 4.21, "share": 0.34, "alpha": 0.12},
    {"prototypeId": 287, "actionType": "pass", "stage": 1, "weight": 3.08, "share": 0.25, "alpha": 0.09}
  ],
  "heatmap": {
    "imageUrl": null,
    "data": null
  },
  "vaep": {
    "total": 3.62,
    "offensive": 2.94,
    "defensive": 0.68
  }
}
```

**Producer**: `nwsl-api`. Metrics derive from `agg_player_season` (per-90
offense/defense stats), style vectors from `player_style_vectors`, and prototype
weights from `agg_player_style_vectors` + `fact_soccermix_prototypes`. Heatmap
data can be requested separately from `nwsl-viz` if the front-end needs a
rendered image.

---

## Supporting Lookups & Metadata

Additional endpoints to support selectors and ChatKit context:

1. `GET /api/dashboard/lookups`
   - Returns seasons available, team list, goalkeeper list, match list, player list.
   - Producer: `nwsl-api` (SQL on `dim_team`, `dim_match`, `dim_player`).

2. `GET /api/dashboard/chatkit-context?season=<year>&panel=<panel>`
   - Returns concise textual context (metrics summary, active filters).
   - Producer: Compose from cached responses in the Next.js layer to avoid
     round-tripping.

---

## Database Enhancements Required

1. **League averages view** (`vw_team_league_averages`): aggregates `agg_team_season`
   by season/competition to compute mean goals, shots, pass accuracy, home win %.

2. **Goalkeeper PSxG materialization** (`vw_goalkeeper_psxg`): sums PSxG +/- per
   goalie by season if not already stored.

3. **Momentum helper view** (`vw_match_momentum`): window function over
   `fact_event_xg` (rolling sum per team ordered by event timestamp).

4. **Phase transition summary** (`vw_phase_transition_counts`): counts transitions
   between clustered phases for use in Sankey diagrams.

These can be implemented in `nwsl-loader/sql/views/` and refreshed alongside
existing aggregates.

---

## Next Steps

1. Implement the backend endpoints/tools according to the contracts above.
2. Add integration tests (service layer + BFF) verifying contract adherence.
3. Update front-end components to consume the new BFF endpoints.
