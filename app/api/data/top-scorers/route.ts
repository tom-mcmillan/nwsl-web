import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    const sql = `
      SELECT
        player_name,
        team_name,
        goals,
        assists,
        matches_played
      FROM agg_player_season
      WHERE season_year = 2024
        AND competition_type = 'regular_season'
      ORDER BY goals DESC
      LIMIT 10
    `;

    const response = await fetch(`${API_URL}/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top scorers');
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results, row_count: data.row_count });
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top scorers', results: [] },
      { status: 500 }
    );
  }
}
