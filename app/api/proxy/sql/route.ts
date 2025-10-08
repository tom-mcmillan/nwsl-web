import { NextResponse } from 'next/server';

import { executeSql } from '@/lib/server/apiClient';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const sql = body?.sql;

    if (typeof sql !== 'string' || !sql.trim()) {
      return NextResponse.json(
        { error: 'SQL statement is required' },
        { status: 400 }
      );
    }

    if (sql.length > 50000) {
      return NextResponse.json(
        { error: 'SQL statement exceeds 50,000 character limit' },
        { status: 400 }
      );
    }

    const trimmed = sql.trim();
    const normalized = trimmed.toUpperCase();
    if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
      return NextResponse.json(
        { error: 'Only SELECT and WITH statements are permitted' },
        { status: 400 }
      );
    }

    const data = await executeSql(trimmed);
    return NextResponse.json(data);
  } catch (error) {
    console.error('SQL proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to execute SQL' },
      { status: 502 }
    );
  }
}
