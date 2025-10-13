'use client';

import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react'
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DataPanel } from '@/components/DataPanel';
import { ImagePanel } from '@/components/ImagePanel';
import { ResearchPanel } from '@/components/ResearchPanel';
import panel1Tab2Data from '@/public/data/panel-1-tab-2.json';
import panel1Tab3Data from '@/public/data/panel-1-tab-3.json';
import panel2Data from '@/public/data/panel-2.json';
import panel3Data from '@/public/data/panel-3.json';

interface Stats {
  matches: number;
  players: number;
  actions: number;
  passes: number;
  xt_actions: number;
  shots: number;
}

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

export default function Home() {
  const { data: session } = useSession()
  const isPro = session?.user?.tier === 'PRO'

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Track active tab only for the Graph image panel
  const [panel2ActiveTab, setPanel2ActiveTab] = useState(0);

  const panel2Tabs = [
    { label: "Bell Curve", imagePath: "/images/bell-curve.png" },
    { label: "Eden Hazard Goal SPADL", imagePath: "/images/eden_hazard_goal_spadl.webp" }
  ];

  // Research links (hyperlinks list)
  const researchLinks = [
    { label: 'Natural Language Query: Compare two players', href: '/query' },
    { label: 'SQL Explorer: Team passing accuracy by match', href: '/explore' },
    { label: 'League standings methodology (panel)', href: '/api/panel/league-standings?limit=14' },
    { label: 'Top scorers (panel)', href: '/api/panel/top-scorers?limit=10' },
  ];

  // ChatKit setup with page context
  const { control } = useChatKit({
    api: {
      async getClientSecret(currentClientSecret) {
        // Build dynamic context about current page state
        const pageContext = {
          currentView: 'NWSL Dashboard',
          databaseStats: stats ? {
            matches: stats.matches,
            players: stats.players,
            spadl_actions: stats.actions,
            passes: stats.passes,
            xt_actions: stats.xt_actions,
            shots: stats.shots
          } : null,
          activeData: {
            graph: {
              name: 'Top Right Panel',
              activeTab: panel2Tabs[panel2ActiveTab]?.label,
              dataType: 'Visualization',
              currentImage: panel2Tabs[panel2ActiveTab]?.imagePath,
              availableTabs: panel2Tabs.map(t => t.label)
            },
            research: {
              name: 'Bottom Middle Research',
              dataType: 'Research Links',
              links: researchLinks,
            },
          },
          userCanInteract: {
            switchTabs: true,
            viewDifferentData: true,
            askAboutVisibleData: true
          }
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
    let cancelled = false

    async function fetchStats() {
      if (!isPro) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        const res = await fetch('/api/stats')
        if (!res.ok) {
          throw new Error('Failed to fetch statistics')
        }
        const statsData: Stats = await res.json()
        if (!cancelled) {
          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching statistics:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      cancelled = true
    }
  }, [isPro])

  // Expand small seed datasets into large tables for preview
  function makeLarge<T>(rows: readonly T[], target = 200): T[] {
    const out: T[] = [];
    if (!Array.isArray(rows) || rows.length === 0) return out;
    while (out.length < target) {
      // clone rows to avoid ref equality
      for (const r of rows) {
        out.push({ ...r });
        if (out.length >= target) break;
      }
    }
    return out.slice(0, target);
  }

  type TeamRow = { id?: number; team_name: string; wins?: number; losses?: number; draws?: number; goals_for?: number; goals_against?: number; points?: number };
  type PlayerRow = { id?: number; player_name: string; team_name: string; assists_per_90?: number; key_passes?: number };
  type MatchRow = { id?: number; match_date: string; home_team: string; away_team: string; home_score: number; away_score: number; attendance?: number };
  type ShotsRow = { id?: number; player_name: string; team_name: string; clean_sheets?: number; saves_per_90?: number };

  const teamRowsLarge: Record<string, unknown>[] = makeLarge<TeamRow>(panel2Data as TeamRow[], 250) as unknown as Record<string, unknown>[];
  const playerRowsLarge: Record<string, unknown>[] = makeLarge<PlayerRow>(panel1Tab2Data as PlayerRow[], 300) as unknown as Record<string, unknown>[];
  const matchRowsLarge: Record<string, unknown>[] = makeLarge<MatchRow>(panel3Data as MatchRow[], 250) as unknown as Record<string, unknown>[];
  const shotsRowsLarge: Record<string, unknown>[] = makeLarge<ShotsRow>(panel1Tab3Data as ShotsRow[], 220) as unknown as Record<string, unknown>[];

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
            <span className="text-[9px] text-gray-500 uppercase">SPADL Actions</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.actions || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Passes</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.passes || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">xT Actions</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.xt_actions || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 uppercase">Shots</span>
            <span className="text-sm font-semibold">{loading ? '...' : (stats?.shots || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden p-2">
        {/* Gating banner removed by request */}
        <PanelGroup
          direction="horizontal"
          className="flex h-full"
          autoSaveId="nwsl-dashboard-layout"
        >
          {/* Left/Middle: 3 columns (shared widths). Each column has adjustable heights */}
          <Panel minSize={45} defaultSize={72}>
            <PanelGroup direction="horizontal" className="flex h-full w-full" autoSaveId="nwsl-grid-cols">
              {/* Column 1: Team (top) / Match (bottom) */}
              <Panel minSize={15} defaultSize={33}>
                <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-col-1">
                  <Panel defaultSize={50} minSize={30}>
                    <DataPanel heading="Team" data={teamRowsLarge} height="100%" />
                  </Panel>
                  <HorizontalResizeHandle />
                  <Panel defaultSize={50} minSize={30}>
                    <DataPanel heading="Match" data={matchRowsLarge} height="100%" />
                  </Panel>
                </PanelGroup>
              </Panel>
              <VerticalResizeHandle />
              {/* Column 2: Graph (top) / Research (bottom) */}
              <Panel minSize={15} defaultSize={34}>
                <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-col-2">
                  <Panel defaultSize={50} minSize={30}>
                    <ImagePanel heading="Graph" tabs={panel2Tabs} height="100%" onTabChange={setPanel2ActiveTab} />
                  </Panel>
                  <HorizontalResizeHandle />
                  <Panel defaultSize={50} minSize={30}>
                    <ResearchPanel heading="Research" links={researchLinks} height="100%" />
                  </Panel>
                </PanelGroup>
              </Panel>
              <VerticalResizeHandle />
              {/* Column 3: Player (top) / Shots (bottom) */}
              <Panel minSize={15} defaultSize={33}>
                <PanelGroup direction="vertical" className="flex h-full w-full" autoSaveId="nwsl-col-3">
                  <Panel defaultSize={50} minSize={30}>
                    <DataPanel heading="Player" data={playerRowsLarge} height="100%" />
                  </Panel>
                  <HorizontalResizeHandle />
                  <Panel defaultSize={50} minSize={30}>
                    <DataPanel heading="Shots" data={shotsRowsLarge} height="100%" />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
          <VerticalResizeHandle />
          {/* Right: ChatKit (full height, docked, edge-to-edge white) */}
          <Panel minSize={18} defaultSize={28}>
            <div className="h-full w-full bg-white">
              <ChatKit control={control} className="h-full w-full" />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
