'use client';

import { useQuery } from '@tanstack/react-query';
import type { MomentumResponse } from '@/lib/server/apiClient';

async function loadMomentum(matchId: string): Promise<MomentumResponse> {
  const search = new URLSearchParams({ matchId });
  const res = await fetch(`/api/dashboard/momentum?${search.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load match momentum');
  }
  const data = (await res.json()) as MomentumResponse;
  return data;
}

export function useMomentum(matchId?: string) {
  return useQuery<MomentumResponse>({
    queryKey: ['momentum', matchId],
    queryFn: () => {
      if (!matchId) {
        throw new Error('matchId is required');
      }
      return loadMomentum(matchId);
    },
    enabled: Boolean(matchId),
  });
}
