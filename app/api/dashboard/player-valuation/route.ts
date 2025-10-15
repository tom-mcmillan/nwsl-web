import { NextResponse } from 'next/server';
import { fetchPlayerValuation } from '@/lib/server/apiClient';
import fallback from '@/data/fallback/player-valuation.json';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const competition = url.searchParams.get('competition') ?? undefined;
  const teamId = url.searchParams.get('teamId') ?? undefined;
  const minMinutesParam = url.searchParams.get('minMinutes');
  const limitParam = url.searchParams.get('limit');
  const orderByParam = url.searchParams.get('orderBy');

  const season = seasonParam ? Number(seasonParam) : undefined;
  const minMinutes = minMinutesParam ? Number(minMinutesParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;
  const orderBy = orderByParam === 'xt' ? 'xt' : orderByParam === 'vaep' ? 'vaep' : undefined;

  try {
    const data = await fetchPlayerValuation({
      season: Number.isFinite(season) ? season : undefined,
      competition,
      teamId: teamId ?? undefined,
      minMinutes: Number.isFinite(minMinutes) ? minMinutes : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      orderBy,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/player-valuation error', error);
    return NextResponse.json(fallback);
  }
}
