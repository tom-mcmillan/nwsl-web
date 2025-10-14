'use client';

import { useQuery } from '@tanstack/react-query';

interface Params {
  season?: number;
  competition?: string;
  teamId?: string | null;
}

export function useGoalkeepers(params: Params) {
  const { season, competition, teamId } = params;
  return useQuery({
    queryKey: ['goalkeepers', season ?? 'latest', competition ?? 'regular_season', teamId ?? 'all'],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (season !== undefined) search.set('season', String(season));
      if (competition) search.set('competition', competition);
      if (teamId) search.set('teamId', teamId);
      const qs = search.toString();
      const res = await fetch(`/api/dashboard/goalkeepers${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        throw new Error('Failed to load goalkeeper metrics');
      }
      return res.json();
    },
  });
}
