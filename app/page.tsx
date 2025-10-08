'use client';

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DataPanel } from '@/components/DataPanel';
import { ImagePanel } from '@/components/ImagePanel';
import panel1Tab1Data from '@/public/data/panel-1.json';
import panel1Tab2Data from '@/public/data/panel-1-tab-2.json';
import panel1Tab3Data from '@/public/data/panel-1-tab-3.json';
import panel2Data from '@/public/data/panel-2.json';
import panel3Data from '@/public/data/panel-3.json';

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
  'team-performance',
] as const;

const VerticalResizeHandle = () => (
  <PanelResizeHandle className="group flex w-1 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500">
    <div className="h-8 w-0.5 rounded bg-gray-400 transition-colors group-hover:bg-white" />
  </PanelResizeHandle>
);

const HorizontalResizeHandle = () => (
  <PanelResizeHandle className="group flex h-1 cursor-row-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500">
    <div className="h-0.5 w-8 rounded bg-gray-400 transition-colors group-hover:bg-white" />
  </PanelResizeHandle>
);

const PanelShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex h-full w-full flex-col overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
    <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
    </div>
    <div className="flex-1 overflow-auto">{children}</div>
  </div>
);

interface Tab {
  id: string;
  label: string;
}

const TabbedPanelShell = ({
  tabs,
  activeTab,
  onTabChange,
  children
}: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}) => (
  <div className="flex h-full w-full flex-col overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
    <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 flex items-center">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 text-[10px] font-semibold uppercase tracking-wide text-gray-700 ${
            index < tabs.length - 1 ? 'border-r border-gray-300' : ''
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <div className="flex-1 overflow-auto">{children}</div>
  </div>
);

const PlaceholderPanel = ({ label, description }: { label: string; description?: string }) => (
  <div className="flex h-full items-center justify-center text-center text-xs text-gray-500">
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">{label}</p>
      {description ? <p className="mt-2 text-[11px] text-gray-500">{description}</p> : null}
    </div>
  </div>
);

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [panels, setPanels] = useState<PanelMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab states for each panel
  const [topLeftTab, setTopLeftTab] = useState('standings');
  const [topRightTab, setTopRightTab] = useState('chart1');
  const [bottomTab, setBottomTab] = useState('team-stats');

  const standings = panels['league-standings']?.results ?? [];
  const topScorers = panels['top-scorers']?.results ?? [];
  const teamStats = panels['team-performance']?.results ?? [];

  // ChatKit setup with page context
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        // Build context about what's on the page
        const pageContext = {
          currentView: 'NWSL Dashboard',
          visiblePanels: [
            'Data Panel (top-left)',
            'Age Distribution Visualization (top-right)',
            'Data Panel (bottom)',
            'ChatKit Assistant (right sidebar)'
          ],
          activeVisualization: {
            title: 'NWSL Player Age Distribution vs. Goal-Scoring Age',
            finding: 'Goals are scored by younger players on average (0.26 years younger)',
            data: {
              playerAge: { mean: 26.46, sd: 4.27, unit: 'years' },
              goalScoringAge: { mean: 26.20, sd: 4.54, unit: 'years' }
            }
          },
          stats: stats ? {
            matches: stats.matches,
            players: stats.players,
            teams: stats.teams,
            events: stats.events
          } : null
        };

        if (!currentClientSecret) {
          // Create new session with context
          const res = await fetch('/api/chatkit/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: pageContext })
          });
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
      tools: [
        {
          id: 'search_docs',
          label: 'Search docs',
          shortLabel: 'Docs',
          placeholderOverride: 'Search documentation',
          icon: 'book-open',
          pinned: false
        }
      ],
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
    <div className="h-screen flex flex-col bg-gray-100">
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
      <div className="flex-1 overflow-hidden p-2">
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
          autoSaveId="nwsl-dashboard-layout"
        >
          {/* Left Side - 4 Data Panels in 2 rows */}
          <Panel minSize={50} defaultSize={70}>
            <PanelGroup
              direction="vertical"
              className="flex h-full w-full"
              autoSaveId="nwsl-left-stack"
            >
              {/* Top Row - 2 panels side by side */}
              <Panel defaultSize={50} minSize={30}>
                <PanelGroup
                  direction="horizontal"
                  className="flex h-full w-full"
                  autoSaveId="nwsl-top-row"
                >
                  {/* Panel 1 - Left list with tabs */}
                  <Panel minSize={20} defaultSize={33} className="m-2">
                    <DataPanel
                      tabs={[
                        { label: "Top Scorers 2025", data: panel1Tab1Data },
                        { label: "Top Assists 2025", data: panel1Tab2Data },
                        { label: "Top Keepers 2025", data: panel1Tab3Data }
                      ]}
                      height="100%"
                    />
                  </Panel>
                  <VerticalResizeHandle />
                  {/* Panel 2 - Center images with tabs */}
                  <Panel minSize={30} defaultSize={67} className="m-2">
                    <ImagePanel
                      tabs={[
                        { label: "Bell Curve", imagePath: "/images/bell-curve.png" },
                        { label: "Eden Hazard Goal SPADL", imagePath: "/images/eden_hazard_goal_spadl.webp" }
                      ]}
                      height="100%"
                    />
                  </Panel>
                </PanelGroup>
              </Panel>
              <HorizontalResizeHandle />
              {/* Panel 3 - Bottom details with tabs */}
              <Panel defaultSize={50} minSize={30} className="m-2">
                <DataPanel
                  tabs={[
                    { label: "Top Scorers 2025", data: panel1Tab1Data },
                    { label: "Top Assists 2025", data: panel1Tab2Data },
                    { label: "Top Keepers 2025", data: panel1Tab3Data }
                  ]}
                  height="100%"
                />
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          {/* Right Side - ChatKit (full height) */}
          <Panel minSize={20} defaultSize={30} className="m-2">
            <ChatKit control={control} className="h-full w-full rounded-3xl overflow-hidden" />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
