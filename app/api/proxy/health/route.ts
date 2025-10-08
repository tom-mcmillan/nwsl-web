import { NextResponse } from 'next/server';

import { fetchHealth } from '@/lib/server/apiClient';

export async function GET() {
  try {
    const data = await fetchHealth();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Health proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to contact backend health endpoint' },
      { status: 502 }
    );
  }
}

