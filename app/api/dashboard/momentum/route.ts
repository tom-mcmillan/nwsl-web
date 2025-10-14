import { NextResponse } from 'next/server';
import { fetchMomentum } from '@/lib/server/apiClient';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchId = url.searchParams.get('matchId') ?? undefined;

  if (!matchId) {
    return NextResponse.json({ error: 'matchId query parameter is required' }, { status: 400 });
  }

  try {
    const data = await fetchMomentum(matchId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/momentum error', error);
    return NextResponse.json({ error: 'Failed to load match momentum' }, { status: 500 });
  }
}
