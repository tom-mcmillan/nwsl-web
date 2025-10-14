'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardSummaryResponse } from '@/lib/server/apiClient';

async function loadSummary(season?: number) {
  const search = season !== undefined ? `?season=${season}` : '';
  const res = await fetch(`/api/dashboard/summary${search}`);
  if (!res.ok) {
    throw new Error('Failed to load dashboard summary');
  }
  const data = (await res.json()) as DashboardSummaryResponse;
  return data;
}

export function useDashboardSummary(season?: number) {
  return useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard-summary', season ?? 'latest'],
    queryFn: () => loadSummary(season),
  });
}
