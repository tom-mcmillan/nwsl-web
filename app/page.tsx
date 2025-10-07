'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatKit, useChatKit } from '@openai/chatkit-react';

interface Stats {
  matches: number;
  players: number;
  teams: number;
  events: number;
}

interface DataRow {
  [key: string]: unknown;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topScorers, setTopScorers] = useState<DataRow[]>([]);
  const [recentMatches, setRecentMatches] = useState<DataRow[]>([]);
  const [standings, setStandings] = useState<DataRow[]>([]);
  const [teamStats, setTeamStats] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  // Build context for ChatKit
  const buildChatContext = () => {
    return {
      timestamp: new Date().toISOString(),
      visible_data: {
        standings: {
          count: standings.length,
          sample: standings.slice(0, 5).map(s => ({
            team: s.team,
            pts: s.pts,
            gd: s.gd
          }))
        },
        top_scorers: {
          count: topScorers.length,
          sample: topScorers.slice(0, 5)
        },
        team_stats: {
          count: teamStats.length,
          sample: teamStats.slice(0, 5)
        }
      },
      metadata: {
        season: '2024',
        last_updated: new Date().toISOString()
      }
    };
  };

  // ChatKit setup
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        if (!currentClientSecret) {
          // Create new session
          const res = await fetch('/api/chatkit/start', { method: 'POST' });
          const { client_secret } = await res.json();
          return client_secret;
        }

        // Refresh existing session
        const res = await fetch('/api/chatkit/refresh', {
          method: 'POST',
          body: JSON.stringify({ currentClientSecret }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
    theme: {
      colorScheme: 'light',
      radius: 'pill',
      density: 'normal',
      typography: {
        baseSize: 14,
        fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSources: [
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap'
          }
        ]
      }
    },
    composer: {
      placeholder: 'ask any question about the nwsl...',
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760
      },
    },
    startScreen: {
      greeting: '',
      prompts: [],
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [statsRes, scorersRes, matchesRes, standingsRes, teamStatsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/data/top-scorers'),
          fetch('/api/data/recent-matches'),
          fetch('/api/data/league-standings'),
          fetch('/api/data/team-stats'),
        ]);

        if (!statsRes.ok || !scorersRes.ok || !matchesRes.ok || !standingsRes.ok || !teamStatsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const statsData = await statsRes.json();
        const scorersData = await scorersRes.json();
        const matchesData = await matchesRes.json();
        const standingsData = await standingsRes.json();
        const teamStatsData = await teamStatsRes.json();

        setStats(statsData);
        setTopScorers(scorersData.results || []);
        setRecentMatches(matchesData.results || []);
        setStandings(standingsData.results || []);
        setTeamStats(teamStatsData.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.min(Math.max(newWidth, 300), 800));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getValueClass = (value: unknown, isPositive: boolean = true) => {
    const num = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : 0;
    if (num > 0) return isPositive ? 'positive' : 'negative';
    if (num < 0) return isPositive ? 'negative' : 'positive';
    return 'neutral';
  };

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="p-2 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );

  const EmptyState = ({ message = "No data available" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-xs">{message}</p>
    </div>
  );

  const ErrorState = ({ message = "Failed to load data" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-40 text-red-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xs mb-2">{message}</p>
      <button
        onClick={retryFetch}
        className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Stats Bar */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        <div className="flex items-center px-3 py-1.5 gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Matches</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.matches || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Players</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.players || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Teams</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.teams || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Events</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.events || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-1 p-1 overflow-hidden">
        {/* Data Panels Grid */}
        <div className="flex-1 grid grid-cols-9 gap-1">
          {/* Left Panel - League Standings */}
          <div className="col-span-3 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
            <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">League Standings</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <TableSkeleton rows={14} />
            ) : error ? (
              <ErrorState message={error} />
            ) : standings.length > 0 ? (
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr>
                    <th className="text-center">#</th>
                    <th>Team</th>
                    <th className="text-center">PTS</th>
                    <th className="text-center">GD</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr key={i}>
                      <td className="text-center text-gray-500 font-medium text-[9px]">{i + 1}</td>
                      <td className="font-medium">{String(row.team)}</td>
                      <td className="text-center font-semibold">{String(row.pts)}</td>
                      <td className={`text-center ${getValueClass(row.gd)}`}>{String(row.gd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No standings data available" />
            )}
          </div>
        </div>

        {/* Center Panel - Top Scorers */}
        <div className="col-span-3 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
            <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Top Scorers 2024</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <TableSkeleton rows={20} />
            ) : error ? (
              <ErrorState message={error} />
            ) : topScorers.length > 0 ? (
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr>
                    <th className="text-center">#</th>
                    {Object.keys(topScorers[0]).map((key) => (
                      <th key={key}>{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((row, i) => (
                    <tr key={i}>
                      <td className="text-center text-gray-500 font-medium text-[9px]">{i + 1}</td>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className={j === 0 ? 'font-medium' : ''}>
                          {value === null ? '—' : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No top scorers data available" />
            )}
          </div>
        </div>

        {/* Center-Right Panel - Team Stats */}
        <div className="col-span-3 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
            <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Team Performance</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <TableSkeleton rows={14} />
            ) : error ? (
              <ErrorState message={error} />
            ) : teamStats.length > 0 ? (
              <table className="w-full">
                <thead className="sticky top-0">
                  <tr>
                    {Object.keys(teamStats[0]).map((key) => (
                      <th key={key}>{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className={j === 0 ? 'font-medium' : ''}>
                          {value === null ? '—' : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No team performance data available" />
            )}
          </div>
        </div>

        </div>

        {/* ChatKit - Standalone to the right */}
        <div
          style={{ width: `${chatWidth}px` }}
          className="flex-shrink-0 overflow-hidden rounded-lg relative"
        >
          {/* Resize Handle */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-500' : 'bg-gray-300'}`}
            style={{ zIndex: 10 }}
          />
          <ChatKit control={control} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
