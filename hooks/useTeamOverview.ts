'use client';

import { useQuery } from '@tanstack/react-query';

interface Params {
  season?: number;
  competition?: string;
}

async function loadTeamOverview(params: Params) {
  const search = new URLSearchParams();
  if (params.season !== undefined) search.set('season', String(params.season));
  if (params.competition) search.set('competition', params.competition);
  const qs = search.toString();
  const res = await fetch(`/api/dashboard/team-overview${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('Failed to load team overview');
  }
  return res.json();
}

export function useTeamOverview(params: Params) {
  const { season, competition } = params;
  return useQuery({
    queryKey: ['team-overview', season ?? 'latest', competition ?? 'regular_season'],
    queryFn: () => loadTeamOverview(params),
  });
}
