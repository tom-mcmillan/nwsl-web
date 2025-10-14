'use client';

import { useQuery } from '@tanstack/react-query';

interface Params {
  teamName?: string;
  season?: number;
  forceRefresh?: boolean;
}

export function useShotMap(params: Params) {
  const { teamName, season, forceRefresh } = params;
  return useQuery({
    queryKey: ['shot-map', teamName ?? 'none', season ?? 'latest', forceRefresh ? 'force' : ''],
    queryFn: async () => {
      if (!teamName) {
        throw new Error('teamName is required');
      }
      const search = new URLSearchParams({ team: teamName });
      if (season !== undefined) search.set('season', String(season));
      if (forceRefresh) search.set('forceRefresh', 'true');
      const res = await fetch(`/api/viz/shot-map?${search.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load shot map');
      }
      const data = await res.json();
      return data as {
        imageUrl: string;
        summary: string;
        metrics?: Record<string, number | undefined> | null;
      };
    },
    enabled: Boolean(teamName),
    staleTime: 1000 * 60 * 5,
  });
}
