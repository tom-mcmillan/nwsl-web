import { NextResponse } from 'next/server';
import { fetchPlayerStyle } from '@/lib/server/apiClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const competition = url.searchParams.get('competition') ?? undefined;
  const playerId = url.searchParams.get('playerId') ?? undefined;
  const playerName = url.searchParams.get('playerName') ?? undefined;

  const season = seasonParam ? Number(seasonParam) : undefined;

  if (!playerId && !playerName) {
    return NextResponse.json({ error: 'playerId or playerName is required' }, { status: 400 });
  }

  try {
    const data = await fetchPlayerStyle({
      season: Number.isFinite(season) ? season : undefined,
      competition,
      playerId,
      playerName,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/player-style error', error);
    return NextResponse.json({ error: 'Failed to load player style' }, { status: 500 });
  }
}
