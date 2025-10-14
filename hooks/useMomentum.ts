'use client';

import { useQuery } from '@tanstack/react-query';
export function useMomentum(matchId?: string) {
  return useQuery({
    queryKey: ['momentum', matchId],
    queryFn: () => {
      if (!matchId) {
        return Promise.reject(new Error('matchId is required'));
      }
      const search = new URLSearchParams({ matchId });
      return fetch(`/api/dashboard/momentum?${search.toString()}`).then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load match momentum');
        }
        return res.json();
      });
    },
    enabled: Boolean(matchId),
  });
}
