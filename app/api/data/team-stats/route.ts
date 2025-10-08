import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    const sql = `
      SELECT
        team_name AS team,
        ROUND(shot_accuracy, 1) AS shot_acc,
        ROUND(pass_accuracy, 1) AS pass_acc,
        ROUND(avg_possession, 1) AS poss,
        corners_total AS corners,
        fouls_committed AS fouls
      FROM agg_team_season
      WHERE season_year = 2024
        AND competition_type = 'regular_season'
      ORDER BY pass_accuracy DESC
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
      throw new Error('Failed to fetch team stats');
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results, row_count: data.row_count });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json({ results: [], row_count: 0 }, { status: 500 });
  }
}
