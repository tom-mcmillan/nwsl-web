import { NextResponse } from 'next/server';
import { fetchTeamOverview } from '@/lib/server/apiClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const competition = url.searchParams.get('competition') ?? undefined;
  const season = seasonParam ? Number(seasonParam) : undefined;

  try {
    const data = await fetchTeamOverview({
      season: Number.isFinite(season) ? season : undefined,
      competition,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/team-overview error', error);
    return NextResponse.json({ error: 'Failed to load team overview' }, { status: 500 });
  }
}
