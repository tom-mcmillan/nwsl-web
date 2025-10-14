'use client';

import { useQuery } from '@tanstack/react-query';
export function useDashboardLookups() {
  return useQuery({
    queryKey: ['dashboard-lookups'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/lookups');
      if (!res.ok) {
        throw new Error('Failed to load dashboard lookups');
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}
