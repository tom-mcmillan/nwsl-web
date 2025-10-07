import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET() {
  try {
    const sql = `
      SELECT
        match_date,
        home_team,
        away_team,
        home_score,
        away_score,
        attendance
      FROM matches
      ORDER BY match_date DESC
      LIMIT 10
    `;

    const response = await fetch(`${API_URL}/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent matches');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recent matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent matches', results: [] },
      { status: 500 }
    );
  }
}
