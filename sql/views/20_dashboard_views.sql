-- ============================================================================
-- Phase 5: Dashboard Helper Views
-- ============================================================================
-- Purpose: Support web dashboard contracts with pre-aggregated metrics
-- ============================================================================

------------------------------------------------------------------------------
-- League-wide averages per season/competition
------------------------------------------------------------------------------

DROP VIEW IF EXISTS vw_team_league_averages CASCADE;

CREATE VIEW vw_team_league_averages AS
WITH base AS (
    SELECT
        season_year,
        competition_type,
        team_id,
        matches_played,
        goals_for,
        shots_total,
        pass_accuracy,
        home_wins,
        home_draws,
        home_losses
    FROM agg_team_season
    WHERE matches_played > 0
)
SELECT
    season_year,
    competition_type,
    ROUND(
        AVG(goals_for::numeric / NULLIF(matches_played, 0)),
        3
    ) AS avg_goals_per_match,
    ROUND(
        AVG(shots_total::numeric / NULLIF(matches_played, 0)),
        3
    ) AS avg_shots_per_match,
    ROUND(AVG(pass_accuracy), 3) AS avg_pass_accuracy_pct,
    ROUND(
        CASE
            WHEN SUM(home_wins + home_draws + home_losses) > 0
                THEN SUM(home_wins)::numeric
                     / NULLIF(SUM(home_wins + home_draws + home_losses), 0)::numeric
                     * 100
            ELSE NULL
        END,
        2
    ) AS home_win_percentage
FROM base
GROUP BY season_year, competition_type;

------------------------------------------------------------------------------
-- Goalkeeper PSxG / distribution summary
------------------------------------------------------------------------------

DROP VIEW IF EXISTS vw_goalkeeper_psxg CASCADE;

CREATE VIEW vw_goalkeeper_psxg AS
SELECT
    season_year,
    competition_type,
    player_id,
    player_name,
    team_id,
    team_name,
    matches_played,
    saves,
    goals_conceded,
    psxg,
    COALESCE(goals_prevented, psxg - goals_conceded) AS psxg_minus_goals,
    ROUND(save_percentage, 2) AS save_percentage,
    clean_sheets,
    ROUND(clean_sheet_percentage, 2) AS clean_sheet_percentage,
    passes,
    passes_successful,
    ROUND(pass_accuracy, 2) AS pass_accuracy,
    long_balls,
    throws,
    keeper_sweeps,
    keeper_pickups,
    keeper_claims,
    punches,
    clearances,
    interceptions,
    saves_per_90,
    goals_conceded_per_90,
    last_updated
FROM agg_goalkeeper_season;

------------------------------------------------------------------------------
-- Match momentum (minute-level xG + rolling window)
------------------------------------------------------------------------------

DROP VIEW IF EXISTS vw_match_momentum CASCADE;

CREATE VIEW vw_match_momentum AS
WITH minute_events AS (
    SELECT
        match_id,
        season_year,
        team_id,
        match_minute,
        SUM(shot_xg)::numeric AS minute_xg
    FROM fact_event_xg
    GROUP BY match_id, season_year, team_id, match_minute
),
minute_series AS (
    SELECT
        match_id,
        season_year,
        team_id,
        match_minute,
        minute_xg,
        SUM(minute_xg) OVER (
            PARTITION BY match_id, team_id
            ORDER BY match_minute
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_xg,
        SUM(minute_xg) OVER (
            PARTITION BY match_id, team_id
            ORDER BY match_minute
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ) AS rolling_xg_5
    FROM minute_events
)
SELECT * FROM minute_series;

------------------------------------------------------------------------------
-- Phase-to-phase transition counts (for tactics Sankey diagrams)
------------------------------------------------------------------------------

DROP VIEW IF EXISTS vw_phase_transition_counts CASCADE;

CREATE VIEW vw_phase_transition_counts AS
WITH phase_clusters AS (
    SELECT
        p.phase_id,
        p.game_id,
        p.team_id,
        p.season_year,
        p.pipeline_run_id,
        p.phase_number,
        fc.cluster_version,
        fc.cluster_id
    FROM fact_phase p
    JOIN fact_phase_cluster fc
        ON fc.phase_id = p.phase_id
),
ordered AS (
    SELECT
        phase_id,
        game_id,
        team_id,
        season_year,
        pipeline_run_id,
        cluster_version,
        cluster_id,
        LEAD(cluster_id) OVER (
            PARTITION BY game_id, team_id, pipeline_run_id, cluster_version
            ORDER BY phase_number
        ) AS next_cluster_id
    FROM phase_clusters
)
SELECT
    season_year,
    team_id,
    cluster_version,
    cluster_id AS source_cluster_id,
    next_cluster_id AS target_cluster_id,
    COUNT(*) AS transition_count
FROM ordered
WHERE next_cluster_id IS NOT NULL
GROUP BY season_year, team_id, cluster_version, cluster_id, next_cluster_id;

------------------------------------------------------------------------------
-- Success notice
------------------------------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '✅ Dashboard helper views created/refreshed.';
    RAISE NOTICE '   - vw_team_league_averages';
    RAISE NOTICE '   - vw_goalkeeper_psxg';
    RAISE NOTICE '   - vw_match_momentum';
    RAISE NOTICE '   - vw_phase_transition_counts';
END $$;
