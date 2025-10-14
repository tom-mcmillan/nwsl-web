'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLookupsResponse } from '@/lib/server/apiClient';

export function useDashboardLookups() {
  return useQuery<DashboardLookupsResponse>({
    queryKey: ['dashboard-lookups'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/lookups');
      if (!res.ok) {
        throw new Error('Failed to load dashboard lookups');
      }
      const data = (await res.json()) as DashboardLookupsResponse;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
