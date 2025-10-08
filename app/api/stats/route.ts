import { NextResponse } from 'next/server';

import { executeSql } from '@/lib/server/apiClient';

export async function GET() {
  try {
    // Fetch database statistics using Kimball schema
    const statsQueries = [
      'SELECT COUNT(*) as count FROM dim_match',
      'SELECT COUNT(DISTINCT player_id) as count FROM dim_player',
      'SELECT COUNT(*) as count FROM fact_spadl_action',
      "SELECT COUNT(*) as count FROM fact_spadl_action WHERE type_name IN ('pass', 'cross')",
      'SELECT COUNT(*) as count FROM fact_action_xt WHERE xt_value > 0',
      "SELECT COUNT(*) as count FROM fact_spadl_action WHERE type_name IN ('shot', 'shot_penalty', 'shot_freekick')",
    ];

    const results = await Promise.allSettled(
      statsQueries.map(async (sql) => {
        try {
          const data = await executeSql(sql);
          return data.results; // Extract results array from backend response
        } catch (error) {
          console.error('Stats query failed:', sql, error);
          return null;
        }
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
      actions: getValue(2),
      passes: getValue(3),
      xt_actions: getValue(4),
      shots: getValue(5),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
