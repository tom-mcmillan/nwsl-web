'use client';

import { useQuery } from '@tanstack/react-query';

async function loadSummary(season?: number) {
  const search = season !== undefined ? `?season=${season}` : '';
  const res = await fetch(`/api/dashboard/summary${search}`);
  if (!res.ok) {
    throw new Error('Failed to load dashboard summary');
  }
  return res.json();
}

export function useDashboardSummary(season?: number) {
  return useQuery({
    queryKey: ['dashboard-summary', season ?? 'latest'],
    queryFn: () => loadSummary(season),
  });
}
