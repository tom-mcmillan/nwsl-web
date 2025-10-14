import { NextResponse } from 'next/server';
import { generateShotMap } from '@/lib/server/vizClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamName = url.searchParams.get('team');
  const seasonParam = url.searchParams.get('season');
  const forceParam = url.searchParams.get('forceRefresh');

  if (!teamName) {
    return NextResponse.json({ error: 'team query parameter is required' }, { status: 400 });
  }

  const season = seasonParam ? Number(seasonParam) : undefined;
  const forceRefresh = forceParam === 'true';

  try {
    const data = await generateShotMap({ teamName, season, forceRefresh });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] viz/shot-map error', error);
    return NextResponse.json({ error: 'Failed to generate shot map' }, { status: 500 });
  }
}
