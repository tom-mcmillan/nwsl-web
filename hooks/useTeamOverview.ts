'use client';

import { useQuery } from '@tanstack/react-query';
import type { TeamOverviewResponse } from '@/lib/server/apiClient';

interface Params {
  season?: number;
  competition?: string;
}

async function loadTeamOverview(params: Params): Promise<TeamOverviewResponse> {
  const search = new URLSearchParams();
  if (params.season !== undefined) search.set('season', String(params.season));
  if (params.competition) search.set('competition', params.competition);
  const qs = search.toString();
  const res = await fetch(`/api/dashboard/team-overview${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('Failed to load team overview');
  }
  const data = (await res.json()) as TeamOverviewResponse;
  return data;
}

export function useTeamOverview(params: Params) {
  const { season, competition } = params;
  return useQuery<TeamOverviewResponse>({
    queryKey: ['team-overview', season ?? 'latest', competition ?? 'regular_season'],
    queryFn: () => loadTeamOverview(params),
  });
}
