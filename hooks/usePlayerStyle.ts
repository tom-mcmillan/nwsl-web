'use client';

import { useQuery } from '@tanstack/react-query';
interface Params {
  season?: number;
  competition?: string;
  playerId?: string;
  playerName?: string;
}

export function usePlayerStyle(params: Params) {
  const { season, competition, playerId, playerName } = params;
  return useQuery({
    queryKey: ['player-style', season ?? 'latest', competition ?? 'regular_season', playerId ?? playerName ?? 'unknown'],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (season !== undefined) search.set('season', String(season));
      if (competition) search.set('competition', competition);
      if (playerId) search.set('playerId', playerId);
      if (playerName) search.set('playerName', playerName);
      const qs = search.toString();
      const res = await fetch(`/api/dashboard/player-style${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        throw new Error('Failed to load player style');
      }
      return res.json();
    },
    enabled: Boolean(playerId || playerName),
  });
}
