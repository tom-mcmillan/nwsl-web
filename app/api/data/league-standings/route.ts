import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    const sql = `
      SELECT
        team_name AS team,
        matches_played AS mp,
        wins AS w,
        draws AS d,
        losses AS l,
        goals_for AS gf,
        goals_against AS ga,
        goal_difference AS gd,
        points AS pts
      FROM agg_team_season
      WHERE season_year = 2024
        AND competition_type = 'regular_season'
      ORDER BY points DESC, goal_difference DESC
      LIMIT 14
    `;

    const response = await fetch(`${API_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch league standings');
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results, row_count: data.row_count });
  } catch (error) {
    console.error('Error fetching league standings:', error);
    return NextResponse.json({ results: [], row_count: 0 }, { status: 500 });
  }
}
