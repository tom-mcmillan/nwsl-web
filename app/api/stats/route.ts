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

    const results = await Promise.allSettled(
      statsQueries.map(async (sql, index) => {
        const response = await fetch(`${API_URL}/sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Stats query ${index} failed:`, sql, errorText);
          return null;
        }
        const data = await response.json();
        return data.results; // Extract results array from backend response
      })
    );

    const getValue = (index: number) => {
      const result = results[index];
      if (result.status === 'fulfilled' && result.value) {
        return result.value[0]?.count || 0;
      }
      return 0;
    };

    return NextResponse.json({
      matches: getValue(0),
      players: getValue(1),
      teams: getValue(2),
      events: getValue(3),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
