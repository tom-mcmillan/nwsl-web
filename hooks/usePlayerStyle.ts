'use client';

import { useQuery } from '@tanstack/react-query';
import type { PlayerStyleResponse } from '@/lib/server/apiClient';

interface Params {
  season?: number;
  competition?: string;
  playerId?: string;
  playerName?: string;
}

async function loadPlayerStyle(params: Params): Promise<PlayerStyleResponse> {
  const search = new URLSearchParams();
  if (params.season !== undefined) search.set('season', String(params.season));
  if (params.competition) search.set('competition', params.competition);
  if (params.playerId) search.set('playerId', params.playerId);
  if (params.playerName) search.set('playerName', params.playerName);
  const qs = search.toString();
  const res = await fetch(`/api/dashboard/player-style${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('Failed to load player style');
  }
  const data = (await res.json()) as PlayerStyleResponse;
  return data;
}

export function usePlayerStyle(params: Params) {
  const { season, competition, playerId, playerName } = params;
  return useQuery<PlayerStyleResponse>({
    queryKey: ['player-style', season ?? 'latest', competition ?? 'regular_season', playerId ?? playerName ?? 'unknown'],
    queryFn: () => loadPlayerStyle(params),
    enabled: Boolean(playerId || playerName),
  });
}
