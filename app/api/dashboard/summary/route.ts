import { NextResponse } from 'next/server';
import { fetchDashboardSummary } from '@/lib/server/apiClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const season = seasonParam ? Number(seasonParam) : undefined;

  try {
    const data = await fetchDashboardSummary(Number.isFinite(season) ? season : undefined);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/summary error', error);
    return NextResponse.json({ error: 'Failed to load dashboard summary' }, { status: 500 });
  }
}
