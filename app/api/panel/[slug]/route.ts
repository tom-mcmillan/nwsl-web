import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { fetchPanel } from '@/lib/server/apiClient';

type Params = { slug: string };

const isPromise = <T>(value: T | Promise<T>): value is Promise<T> =>
  typeof (value as Promise<T>)?.then === 'function';

export async function GET(
  request: NextRequest,
  context: { params: Params | Promise<Params> }
) {
  const params = isPromise(context.params) ? await context.params : context.params;
  const limitParam = request.nextUrl.searchParams.get('limit');

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
