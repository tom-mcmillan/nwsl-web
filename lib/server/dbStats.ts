import 'server-only'

import { Pool } from 'pg'

type WarehouseStats = {
  events: number
  passes: number
  shots: number
  matches: number
  players: number
  seasons: number
}

let pool: Pool | null = null
let cachedStats: { data: WarehouseStats | null; fetchedAt: number } | null = null

function getPool() {
  const rawConnectionString = process.env.NWSL_DATA_WAREHOUSE_URL

  if (!rawConnectionString) {
    return null
  }

  if (!pool) {
    let sanitizedConnectionString = rawConnectionString
    let useSSL: boolean | undefined

    try {
      const parsed = new URL(rawConnectionString)
      const sslMode = parsed.searchParams.get('sslmode')

      if (sslMode) {
        useSSL = sslMode.toLowerCase() !== 'disable'
        parsed.searchParams.delete('sslmode')
        sanitizedConnectionString = parsed.toString()
      }
    } catch {
      // Ignore URL parsing errors and fall back to raw string
    }

    const sslEnv = process.env.NWSL_DATA_WAREHOUSE_SSL?.toLowerCase()
    if (sslEnv) {
      if (['false', 'disable', '0'].includes(sslEnv)) {
        useSSL = false
      } else {
        useSSL = true
      }
    }

    if (useSSL === undefined) {
      useSSL = true
    }

    pool = new Pool({
      connectionString: sanitizedConnectionString,
      ssl: useSSL
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      max: 2,
    })
  }

  return pool
}

export async function getWarehouseStats(): Promise<WarehouseStats | null> {
  if (cachedStats && Date.now() - cachedStats.fetchedAt < 5 * 60 * 1000) {
    return cachedStats.data
  }

  const activePool = getPool()
  if (!activePool) return null

  try {
    const client = await activePool.connect()

    try {
      const { rows } = await client.query<WarehouseStats>(`
        WITH event_totals AS (
          SELECT COUNT(*) AS count FROM fact_event_2013
          UNION ALL SELECT COUNT(*) FROM fact_event_2014
          UNION ALL SELECT COUNT(*) FROM fact_event_2015
          UNION ALL SELECT COUNT(*) FROM fact_event_2016
          UNION ALL SELECT COUNT(*) FROM fact_event_2017
          UNION ALL SELECT COUNT(*) FROM fact_event_2018
          UNION ALL SELECT COUNT(*) FROM fact_event_2019
          UNION ALL SELECT COUNT(*) FROM fact_event_2020
          UNION ALL SELECT COUNT(*) FROM fact_event_2021
          UNION ALL SELECT COUNT(*) FROM fact_event_2022
          UNION ALL SELECT COUNT(*) FROM fact_event_2023
          UNION ALL SELECT COUNT(*) FROM fact_event_2024
          UNION ALL SELECT COUNT(*) FROM fact_event_2025
        ),
        pass_totals AS (
          SELECT COUNT(*) AS count
          FROM fact_spadl_action
          WHERE lower(type_name) = 'pass'
        ),
        shot_totals AS (
          SELECT COUNT(*) AS count
          FROM fact_spadl_action
          WHERE lower(type_name) IN ('shot', 'shot_freekick', 'shot_penalty')
        )
        SELECT
          (SELECT SUM(count)::bigint FROM event_totals) AS events,
          (SELECT count::bigint FROM pass_totals) AS passes,
          (SELECT count::bigint FROM shot_totals) AS shots,
          (SELECT COUNT(*) FROM dim_match) AS matches,
          (SELECT COUNT(*) FROM dim_player) AS players,
          (SELECT COUNT(DISTINCT season_year) FROM dim_season) AS seasons
    `)

    if (!rows[0]) return null

    const { events, passes, shots, matches, players, seasons } = rows[0]

    const stats: WarehouseStats = {
      events: Number(events ?? 0),
      passes: Number(passes ?? 0),
      shots: Number(shots ?? 0),
      matches: Number(matches ?? 0),
      players: Number(players ?? 0),
      seasons: Number(seasons ?? 0),
    }

      cachedStats = { data: stats, fetchedAt: Date.now() }

      return stats
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to load warehouse stats', error)
    return null
  }
}
