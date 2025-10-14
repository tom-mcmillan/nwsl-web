import 'server-only'

import { fetchDashboardTotals } from '@/lib/server/apiClient'

type WarehouseStats = {
  events: number
  passes: number
  shots: number
  matches: number
  players: number
  seasons: number
}

let cachedStats: { data: WarehouseStats | null; fetchedAt: number } | null = null

function mapTotals(totals: Partial<WarehouseStats> | undefined): WarehouseStats | null {
  if (!totals) return null
  return {
    events: Number(totals.events ?? 0),
    passes: Number(totals.passes ?? 0),
    shots: Number(totals.shots ?? 0),
    matches: Number(totals.matches ?? 0),
    players: Number(totals.players ?? 0),
    seasons: Number(totals.seasons ?? 0),
  }
}

export async function getWarehouseStats(): Promise<WarehouseStats | null> {
  if (cachedStats && Date.now() - cachedStats.fetchedAt < 5 * 60 * 1000) {
    return cachedStats.data
  }

  try {
    const response = await fetchDashboardTotals()
    const stats = mapTotals(response?.totals)

    cachedStats = { data: stats, fetchedAt: Date.now() }
    return stats
  } catch (error) {
    console.error('[dbStats] Failed to load warehouse stats via API', error)
    return null
  }
}
