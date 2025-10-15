import { NextResponse } from 'next/server';
import { fetchDashboardLookups } from '@/lib/server/apiClient';
import fallback from '@/data/fallback/lookups.json';

export async function GET() {
  try {
    const data = await fetchDashboardLookups();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] dashboard/lookups error', error);
    return NextResponse.json(fallback);
  }
}
