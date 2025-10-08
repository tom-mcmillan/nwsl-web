'use client';

import { useEffect, useState } from "react";
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface Stats {
  matches: number;
  players: number;
  teams: number;
  events: number;
}

interface DataRow {
  [key: string]: unknown;
}

interface PanelPayload {
  panel: {
    slug: string;
    title: string;
    description?: string | null;
    max_rows: number;
    tags: string[];
  };
  results: DataRow[];
  row_count: number;
  columns: string[];
  execution_time_ms: number;
}

type PanelMap = Record<string, PanelPayload>;

const DASHBOARD_PANEL_SLUGS = [
  'league-standings',
  'top-scorers',
  'recent-matches',
  'team-performance',
] as const;

const DEFAULT_LAYOUT = [24, 26, 26, 24];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [panels, setPanels] = useState<PanelMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standings = panels['league-standings']?.results ?? [];
  const topScorers = panels['top-scorers']?.results ?? [];
  const teamStats = panels['team-performance']?.results ?? [];

  // ChatKit setup
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        if (!currentClientSecret) {
          // Create new session
          const res = await fetch('/api/chatkit/start', { method: 'POST' });
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(errorBody?.error || 'Unable to start ChatKit session');
          }
          const data = await res.json();
          if (!data?.client_secret) {
            throw new Error('ChatKit session did not return a client secret');
          }
          return data.client_secret;
        }

        // Refresh existing session
        const res = await fetch('/api/chatkit/refresh', {
          method: 'POST',
          body: JSON.stringify({ currentClientSecret }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody?.error || 'Unable to refresh ChatKit session');
        }
        const data = await res.json();
        if (!data?.client_secret) {
          throw new Error('ChatKit refresh did not return a client secret');
        }
        return data.client_secret;
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
        const [statsRes, panelEntries] = await Promise.all([
          fetch('/api/stats'),
          Promise.all(
            DASHBOARD_PANEL_SLUGS.map(async (slug) => {
              const response = await fetch(`/api/panel/${slug}`);
              if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody?.error || `Failed to fetch panel: ${slug}`);
              }
              const payload: PanelPayload = await response.json();
              return [slug, payload] as const;
            })
          ),
        ]);

        if (!statsRes.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const statsData: Stats = await statsRes.json();
        setStats(statsData);
        setPanels(Object.fromEntries(panelEntries));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
      <div className="flex-1 flex p-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          className="flex-1 rounded-lg border border-gray-200 bg-gray-100/60"
          autoSaveId="nwsl-dashboard-panels"
        >
          <Panel minSize={18} defaultSize={DEFAULT_LAYOUT[0]} className="flex">
            <div className="m-1 flex-1 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
                <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  {panels['league-standings']?.panel.title ?? 'League Standings'}
                </h3>
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
          </Panel>
          <PanelResizeHandle className="group flex items-center justify-center w-2 cursor-col-resize transition-colors bg-gray-200 hover:bg-blue-500">
            <div className="h-10 w-1 rounded bg-gray-400 group-hover:bg-white" />
          </PanelResizeHandle>
          <Panel minSize={18} defaultSize={DEFAULT_LAYOUT[1]} className="flex">
            <div className="m-1 flex-1 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
                <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  {panels['top-scorers']?.panel.title ?? 'Top Scorers'}
                </h3>
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
          </Panel>
          <PanelResizeHandle className="group flex items-center justify-center w-2 cursor-col-resize transition-colors bg-gray-200 hover:bg-blue-500">
            <div className="h-10 w-1 rounded bg-gray-400 group-hover:bg-white" />
          </PanelResizeHandle>
          <Panel minSize={18} defaultSize={DEFAULT_LAYOUT[2]} className="flex">
            <div className="m-1 flex-1 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
                <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  {panels['team-performance']?.panel.title ?? 'Team Performance'}
                </h3>
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
          </Panel>
          <PanelResizeHandle className="group flex items-center justify-center w-2 cursor-col-resize transition-colors bg-gray-200 hover:bg-blue-500">
            <div className="h-10 w-1 rounded bg-gray-400 group-hover:bg-white" />
          </PanelResizeHandle>
          <Panel minSize={18} defaultSize={DEFAULT_LAYOUT[3]} className="flex">
            <div className="m-1 flex-1 overflow-hidden rounded-lg bg-white border border-gray-300 shadow-sm relative">
              <ChatKit control={control} className="h-full w-full" />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
