'use client';

import { useQuery } from '@tanstack/react-query';

interface Params {
  season?: number;
  competition?: string;
  teamId?: string | null;
  minMinutes?: number;
  limit?: number;
  orderBy?: 'vaep' | 'xt';
}

export function usePlayerValuation(params: Params) {
  const { season, competition, teamId, minMinutes, limit, orderBy } = params;
  return useQuery({
    queryKey: ['player-valuation', season ?? 'latest', competition ?? 'regular_season', teamId ?? 'all', minMinutes ?? 600, limit ?? 25, orderBy ?? 'vaep'],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (season !== undefined) search.set('season', String(season));
      if (competition) search.set('competition', competition);
      if (teamId) search.set('teamId', teamId);
      if (minMinutes !== undefined) search.set('minMinutes', String(minMinutes));
      if (limit !== undefined) search.set('limit', String(limit));
      if (orderBy) search.set('orderBy', orderBy);
      const qs = search.toString();
      const res = await fetch(`/api/dashboard/player-valuation${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        throw new Error('Failed to load player valuation');
      }
      return res.json();
    },
  });
}
