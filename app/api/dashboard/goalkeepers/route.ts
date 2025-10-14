import { NextResponse } from 'next/server';
import { fetchGoalkeeperDashboard } from '@/lib/server/apiClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const competition = url.searchParams.get('competition') ?? undefined;
  const teamId = url.searchParams.get('teamId') ?? undefined;

  const season = seasonParam ? Number(seasonParam) : undefined;

  try {
    const data = await fetchGoalkeeperDashboard({
      season: Number.isFinite(season) ? season : undefined,
      competition,
      teamId: teamId ?? undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/goalkeepers error', error);
    return NextResponse.json({ error: 'Failed to load goalkeeper metrics' }, { status: 500 });
  }
}
