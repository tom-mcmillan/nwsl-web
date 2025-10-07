import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    // Fetch database statistics using Kimball schema
    const statsQueries = [
      'SELECT COUNT(*) as count FROM dim_match',
      'SELECT COUNT(DISTINCT player_id) as count FROM dim_player',
      'SELECT COUNT(DISTINCT contestant_id) as count FROM dim_team',
      'SELECT COUNT(*) as count FROM fact_event',
    ];

    const results = await Promise.all(
      statsQueries.map(async (sql) => {
        const response = await fetch(`${API_URL}/sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql }),
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
      })
    );

    return NextResponse.json({
      matches: results[0].results[0]?.count || 0,
      players: results[1].results[0]?.count || 0,
      teams: results[2].results[0]?.count || 0,
      events: results[3].results[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
