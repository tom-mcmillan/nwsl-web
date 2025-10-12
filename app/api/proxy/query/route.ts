import { NextResponse } from 'next/server';

import { executeQuery } from '@/lib/server/apiClient';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const query = body?.query;
    const options = body?.options;
    const context = body?.context;

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Query text is required' },
        { status: 400 }
      );
    }

    const data = await executeQuery(query, {
      options: options && typeof options === 'object' ? options : undefined,
      context: context && typeof context === 'object' ? context : undefined,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Query proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 502 }
    );
  }
}
