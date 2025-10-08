import { NextResponse } from 'next/server';

import { fetchPanel } from '@/lib/server/apiClient';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');

  let limit: number | undefined;
  if (limitParam !== null) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: 'limit must be a positive integer' },
        { status: 400 }
      );
    }
    limit = parsed;
  }

  try {
    const data = await fetchPanel(params.slug, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Panel fetch failed (${params.slug}):`, error);
    return NextResponse.json(
      { error: 'Failed to load panel data' },
      { status: 502 }
    );
  }
}

