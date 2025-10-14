'use client';

import { useQuery } from '@tanstack/react-query';
import type { GoalkeeperDashboardResponse } from '@/lib/server/apiClient';

interface Params {
  season?: number;
  competition?: string;
  teamId?: string | null;
}

async function loadGoalkeepers(params: Params): Promise<GoalkeeperDashboardResponse> {
  const search = new URLSearchParams();
  if (params.season !== undefined) search.set('season', String(params.season));
  if (params.competition) search.set('competition', params.competition);
  if (params.teamId) search.set('teamId', params.teamId);
  const qs = search.toString();
  const res = await fetch(`/api/dashboard/goalkeepers${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('Failed to load goalkeeper metrics');
  }
  const data = (await res.json()) as GoalkeeperDashboardResponse;
  return data;
}

export function useGoalkeepers(params: Params) {
  const { season, competition, teamId } = params;
  return useQuery<GoalkeeperDashboardResponse>({
    queryKey: ['goalkeepers', season ?? 'latest', competition ?? 'regular_season', teamId ?? 'all'],
    queryFn: () => loadGoalkeepers(params),
  });
}
